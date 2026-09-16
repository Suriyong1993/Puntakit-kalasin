import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Members from "./pages/Members";
import Profile from "./pages/Profile";
import Groups from "./pages/Groups";
import Reports from "./pages/Reports";
import ComingSoon from "./pages/ComingSoon";
function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/members" component={Members} /><Route path="/groups" component={Groups} /><Route path="/profile" component={Profile} /><Route path="/announcements" component={ComingSoon} /><Route path="/worship" component={ComingSoon} /><Route path="/church" component={ComingSoon} /><Route path="/ministries" component={ComingSoon} /><Route path="/reports" component={Reports} /><Route path="/media" component={ComingSoon} /><Route path="/settings" component={ComingSoon} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><Toaster richColors position="top-right" /><Router /></ThemeProvider></ErrorBoundary>;
}

export default App;
