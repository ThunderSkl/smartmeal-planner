import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
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
  const utils = trpc.useContext();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Forms state
  const [mode, setMode] = React.useState<'login' | 'register'>('login');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

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

  const validateEmail = (v: string) => /.+@.+\..+/.test(v);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateEmail(email)) {
      // basic client-side validation
      // eslint-disable-next-line no-console
      console.warn('invalid email');
      return;
    }
    if (password.length < 1) {
      // eslint-disable-next-line no-console
      console.warn('password required');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await loginMutation.mutateAsync({ email, password }) as any;
        // Always refetch authoritative `me` from the server (covers cookies / legacy users).
        await utils.auth.me.invalidate();
        const meRes = await meQuery.refetch();

        // Prefer the server-refetched user (complete/authoritative). If missing,
        // fall back to the mutation-returned user (and derive a name from email).
        const finalUser = meRes.data ?? (res?.user ? {
          ...res.user,
          name: res.user.name || (res.user.email ? String(res.user.email).split('@')[0] : null),
        } : null);

        if (!finalUser) {
          try {
            const { toast } = await import('sonner');
            toast.error('Sesión creada en el servidor pero inválida al verificarla en el cliente — revisa VITE_APP_ID y JWT_SECRET en el servidor');
          } catch {
            /* ignore */
          }
          return;
        }

        utils.auth.me.setData(undefined, finalUser);
      } else {
        if (name.trim().length < 1) {
          // eslint-disable-next-line no-console
          console.warn('name required');
          setLoading(false);
          return;
        }
        await registerMutation.mutateAsync({ name, email, password });

        // registration keeps existing behavior: ensure client session is valid
        await utils.auth.me.invalidate();
        const meRes = await meQuery.refetch();
        if (!meRes.data) {
          try {
            const { toast } = await import('sonner');
            toast.error('Sesión creada en el servidor pero inválida al verificarla en el cliente — revisa VITE_APP_ID y JWT_SECRET en el servidor');
          } catch {
            /* ignore */
          }
          return;
        }
      }

      // Compute best post-login target: explicit `next` → recorded last-public-path → same-origin referrer → fallback '/'
      let referrerPath: string | null = null;
      try {
        const stored = sessionStorage.getItem('last-public-path');
        if (stored) {
          referrerPath = stored;
        } else {
          const ref = typeof document !== 'undefined' ? document.referrer : '';
          if (ref) {
            const u = new URL(ref);
            if (u.origin === window.location.origin && u.pathname !== '/login') referrerPath = u.pathname;
          }
        }
      } catch {
        referrerPath = null;
      }
      const target = (searchParams.get('next') || referrerPath || '/') as string;
      navigate(target, { replace: true });
    } catch (err: any) {
      console.error(err);
      // show a simple error; repo already uses `sonner` for toasts in other pages
      try {
        const { toast } = await import('sonner');
        toast.error(err?.message ?? 'Authentication failed');
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleGoogleCredential(credential: string | undefined) {
    if (!credential) return;
    try {
      const fetchRes = await fetch("/api/oauth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: credential }),
        credentials: "include",
      });
      if (!fetchRes.ok) throw new Error("Google sign-in failed");
      // successful: server set cookie -> refresh client state
      await utils.auth.me.invalidate();
      const meRes = await meQuery.refetch();
      if (!meRes.data) {
        try {
          const { toast } = await import('sonner');
          toast.error('Sesión creada en el servidor pero inválida al verificarla en el cliente — revisa VITE_APP_ID y JWT_SECRET en el servidor');
        } catch {
          /* ignore */
        }
        return;
      }
      navigate(next, { replace: true });
    } catch (err) {
      console.error(err);
      // fallback: try full redirect flow
      window.location.href = getLoginUrl();
    }
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <div className="max-w-md w-full">
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Si ya te redirigieron aquí tras el login, la página intentará
            finalizar el flujo automáticamente.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          {/* Email/password form (Login / Register) */}
          <form onSubmit={submit} className="space-y-3">
            <div className="flex gap-2 justify-center">
              <Button variant={mode === 'login' ? 'default' : 'ghost'} onClick={() => setMode('login')}>Iniciar sesión</Button>
              <Button variant={mode === 'register' ? 'default' : 'ghost'} onClick={() => setMode('register')}>Registrar</Button>
            </div>

            {mode === 'register' ? (
              <div>
                <label className="block mb-1 text-sm text-muted-foreground">Nombre</label>
                <input className="w-full input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            ) : null}

            <div>
              <label className="block mb-1 text-sm text-muted-foreground">Email</label>
              <input type="email" className="w-full input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="block mb-1 text-sm text-muted-foreground">Contraseña</label>
              <input type="password" className="w-full input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="flex items-center justify-between">
              <Button type="submit" disabled={loading}>{mode === 'login' ? 'Entrar' : 'Registrarse'}</Button>
              <Button variant="link" onClick={() => onLogin()} className="text-sm">OAuth / Provider</Button>
            </div>
          </form>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div className="flex items-center justify-center">
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
