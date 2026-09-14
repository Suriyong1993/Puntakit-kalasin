import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Members from "./pages/Members";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/members" component={Members} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><Router /></ThemeProvider></ErrorBoundary>;
}

export default App;
