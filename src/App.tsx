import { Redirect, Switch, Route, Router as WouterRouter, useRoute } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { StoreProvider } from "@/lib/store";
import { AppGate } from "@/components/app/app-shell";
import { ErrorBoundary } from "@/components/app/error-boundary";
import { MainLayout } from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Goals from "@/pages/goals";
import Base from "@/pages/base";
import Platforms from "@/pages/platforms";
import Ideas from "@/pages/ideas";
import IdeaDetail from "@/pages/idea-detail";
import ContentPlan from "@/pages/content-plan";
import PublicationDetail from "@/pages/publication-detail";
import Templates from "@/pages/templates";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRouter() {
  return (
    <MainLayout>
      <ErrorBoundary>
      <Switch>
        <Route path="/app" component={Dashboard} />
        <Route path="/app/goals" component={Goals} />
        <Route path="/app/base" component={Base} />
        <Route path="/app/platforms" component={Platforms} />
        <Route path="/app/ideas/:id" component={IdeaDetail} />
        <Route path="/app/ideas" component={Ideas} />
        <Route path="/app/content-plan/:id" component={PublicationDetail} />
        <Route path="/app/content-plan" component={ContentPlan} />
        <Route path="/app/templates" component={Templates} />
        <Route path="/app/profile" component={Profile} />
        <Route path="/app/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      </ErrorBoundary>
    </MainLayout>
  );
}

function LegacyIdeaDetailRedirect() {
  const [, params] = useRoute("/ideas/:id");
  return <Redirect to={`/app/ideas/${params?.id ?? ""}`} />;
}

function LegacySingularIdeaDetailRedirect() {
  const [, params] = useRoute("/idea/:id");
  return <Redirect to={`/app/ideas/${params?.id ?? ""}`} />;
}

function RootRouter() {
  const protectedApp = (
    <AppGate>
      <AppRouter />
    </AppGate>
  );

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      <Route path="/forgot-password" component={AuthPage} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/ideas/:id" component={LegacyIdeaDetailRedirect} />
      <Route path="/idea/:id" component={LegacySingularIdeaDetailRedirect} />
      <Route path="/ideas"><Redirect to="/app/ideas" /></Route>
      <Route path="/app">{protectedApp}</Route>
      <Route path="/app/:rest*">{protectedApp}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="influera-theme">
        <AuthProvider>
          <StoreProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <RootRouter />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </StoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
