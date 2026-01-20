import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ManusDialog } from "@/components/ManusDialog";
import { Button } from "@/components/ui/button";

// Lazy-load the GoogleLogin component (browser-compatible ESM)
type _GoogleLoginProps = {
  onSuccess?: (resp: { credential?: string } | any) => void;
  onError?: () => void;
  [key: string]: any;
};
const GoogleLogin = React.lazy(() =>
  import("@react-oauth/google").then((mod) => ({ default: (mod as any).GoogleLogin }))
) as React.LazyExoticComponent<React.ComponentType<_GoogleLoginProps>>;

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const next = (searchParams.get("next") || "/") as string;

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // If provider (or misconfigured OAuth) redirected to client /login with code/state,
  // forward those params to the server callback which will create the session cookie.
  useEffect(() => {
    const hasCode = searchParams.has("code");
    const hasState = searchParams.has("state");
    if (hasCode && hasState) {
      // Forward to server-side callback to finish the OAuth flow and issue the cookie.
      // The server will redirect back to `/` on success.
      window.location.href = `/api/oauth/callback${window.location.search}`;
      return;
    }
  }, [searchParams]);

  // If already signed in, redirect to the app (or `next`).
  useEffect(() => {
    if (meQuery.data) {
      navigate(next, { replace: true });
    }
  }, [meQuery.data, navigate, next]);

  const onLogin = () => {
    // Start the OAuth flow (handled by external OAuth server configured in env)
    window.location.href = getLoginUrl();
  };

  async function handleGoogleCredential(credential: string | undefined) {
    if (!credential) return;
    try {
      const res = await fetch("/api/oauth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: credential }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Google sign-in failed");
      // successful: server set cookie -> refresh client state
      window.location.href = next;
    } catch (err) {
      console.error(err);
      // fallback: try full redirect flow
      window.location.href = getLoginUrl();
    }
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <div className="max-w-md w-full">
        <ManusDialog
          open={true}
          title="Sign in to SmartMeal"
          onLogin={onLogin}
        />

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Si ya te redirigieron aquí tras el login, la página intentará
            finalizar el flujo automáticamente.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            // @react-oauth/google renders a button and returns an id_token (credential)
            // We accept the id_token on the server and create the session cookie.
            <div className="flex items-center justify-center">
              {/* lazy-load to avoid bundling if not installed */}
              {/* If you haven't installed @react-oauth/google run: pnpm add @react-oauth/google */}
              {/* The component will call onSuccess with { credential } */}
              {/* We use dynamic import so the bundle doesn't fail if the package is absent. */}
              <React.Suspense fallback={<div>Loading…</div>}>
                <GoogleLogin
                  onSuccess={(resp: { credential?: string } | any) => void handleGoogleCredential(resp?.credential)}
                  onError={() => void handleGoogleCredential(undefined)}
                />
              </React.Suspense>
            </div>
          ) : null}

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/", { replace: true })}
              className="text-sm"
            >
              Volver a la página principal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
