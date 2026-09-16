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
import Workspace from "./pages/Workspace";
function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/members" component={Members} /><Route path="/groups" component={Groups} /><Route path="/profile" component={Profile} /><Route path="/announcements" component={Workspace} /><Route path="/worship" component={Workspace} /><Route path="/church" component={Workspace} /><Route path="/ministries" component={Workspace} /><Route path="/reports" component={Reports} /><Route path="/media" component={Workspace} /><Route path="/settings" component={Workspace} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><Toaster richColors position="top-right" /><Router /></ThemeProvider></ErrorBoundary>;
}

export default App;
