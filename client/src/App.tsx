import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Preferences from "./pages/Preferences";
import MenusView from "./pages/MenusView";
import ShoppingListView from "./pages/ShoppingListView";
import DashboardLayout from "./components/DashboardLayout";

function RecordLastPublicPath() {
  const location = useLocation();
  const me = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  useEffect(() => {
    try {
      if (!me.data && location.pathname !== '/login' && location.pathname !== '/404') {
        sessionStorage.setItem('last-public-path', location.pathname);
      }
    } catch {}
  }, [me.data, location.pathname]);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router>
            <RecordLastPublicPath />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              {/* Protected app routes */}
              <Route element={<DashboardLayout><Outlet /></DashboardLayout>}>
                <Route path="/preferences" element={<Preferences />} />
                <Route path="/menus" element={<MenusView />} />
                <Route path="/shopping" element={<ShoppingListView />} />
              </Route>

              <Route path="/404" element={<NotFound />} />
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
