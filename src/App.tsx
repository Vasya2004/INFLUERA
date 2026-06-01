import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { StoreProvider } from "@/lib/store";
import { AppGate } from "@/components/app/app-shell";
import { MainLayout } from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Goals from "@/pages/goals";
import Base from "@/pages/base";
import AiProducer from "@/pages/ai-producer";
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
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/goals" component={Goals} />
        <Route path="/base" component={Base} />
        <Route path="/ai-producer" component={AiProducer} />
        <Route path="/platforms" component={Platforms} />
        <Route path="/ideas/:id" component={IdeaDetail} />
        <Route path="/ideas" component={Ideas} />
        <Route path="/content-plan/:id" component={PublicationDetail} />
        <Route path="/content-plan" component={ContentPlan} />
        <Route path="/templates" component={Templates} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function RootRouter() {
  return (
    <Switch>
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      <Route path="/forgot-password" component={AuthPage} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route>
        <AppGate>
          <AppRouter />
        </AppGate>
      </Route>
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
