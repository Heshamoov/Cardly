import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "@/pages/Home";
import Builder from "@/pages/Builder";
import InvitationView from "@/pages/InvitationView";
import RsvpDashboard from "@/pages/RsvpDashboard";
import WishesWall from "@/pages/WishesWall";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import AdminDashboard from "@/pages/AdminDashboard";
import Login from "@/pages/Login";

function Router() {
  return (
    <Switch>
      {/* Landing page */}
      <Route path={"/"} component={Home} />
      {/* Builder — requires auth (handled inside Builder) */}
      <Route path={"/create"} component={Builder} />
      {/* Guest invitation view */}
      <Route path={"/invite/:slug"} component={InvitationView} />
      {/* Owner dashboards */}
      <Route path={"/rsvp-dashboard"} component={RsvpDashboard} />
      <Route path={"/wall/:slug"} component={WishesWall} />
      {/* Legal */}
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/refund"} component={RefundPolicy} />
      {/* Auth */}
      <Route path={"/login"} component={Login} />
      {/* Admin */}
      <Route path={"/admin"} component={AdminDashboard} />
      {/* Fallback */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
