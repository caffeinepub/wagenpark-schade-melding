import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { Beheer } from "./pages/Beheer";
import { Dashboard } from "./pages/Dashboard";
import { LoginPage } from "./pages/LoginPage";
import { MeldingDetail } from "./pages/MeldingDetail";
import { MijnMeldingen } from "./pages/MijnMeldingen";
import { NieuweMankement } from "./pages/NieuweMankement";
import { NieuweRondje } from "./pages/NieuweRondje";
import { NieuweSchademelding } from "./pages/NieuweSchademelding";
import { NieuweStoring } from "./pages/NieuweStoring";
import { VoertuigenBeheer } from "./pages/VoertuigenBeheer";

// Root route
const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" richColors />
    </>
  );
}

// Auth guard wrapper
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }
  if (!identity) {
    return <LoginPage />;
  }
  return <Layout>{children}</Layout>;
}

// Routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <LoginPage />,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  ),
});

const meldenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/melden",
  component: () => (
    <AuthGuard>
      <NieuweSchademelding />
    </AuthGuard>
  ),
});

const storingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/storing",
  component: () => (
    <AuthGuard>
      <NieuweStoring />
    </AuthGuard>
  ),
});

const mankementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mankement",
  component: () => (
    <AuthGuard>
      <NieuweMankement />
    </AuthGuard>
  ),
});

const rondjeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rondje",
  component: () => (
    <AuthGuard>
      <NieuweRondje />
    </AuthGuard>
  ),
});

const meldingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/meldingen/$id",
  component: () => (
    <AuthGuard>
      <MeldingDetail />
    </AuthGuard>
  ),
});

const voertuigenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/voertuigen",
  component: () => (
    <AuthGuard>
      <VoertuigenBeheer />
    </AuthGuard>
  ),
});

const mijnMeldingenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mijn-meldingen",
  component: () => (
    <AuthGuard>
      <MijnMeldingen />
    </AuthGuard>
  ),
});

const beheerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/beheer",
  component: () => (
    <AuthGuard>
      <Beheer />
    </AuthGuard>
  ),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  meldenRoute,
  storingRoute,
  mankementRoute,
  rondjeRoute,
  meldingDetailRoute,
  voertuigenRoute,
  mijnMeldingenRoute,
  beheerRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
