import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Members from "./pages/Members";
import Groups from "./pages/Groups";
import Attendance from "./pages/Attendance";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import Church from "./pages/Church";
import Ministries from "./pages/Ministries";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ComingSoon from "./pages/ComingSoon";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/members">
        <ProtectedRoute>
          <Members />
        </ProtectedRoute>
      </Route>
      <Route path="/groups">
        <ProtectedRoute>
          <Groups />
        </ProtectedRoute>
      </Route>
      <Route path="/attendance">
        <ProtectedRoute>
          <Attendance />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/announcements">
        <ProtectedRoute>
          <Announcements />
        </ProtectedRoute>
      </Route>
      <Route path="/events">
        <ProtectedRoute>
          <Events />
        </ProtectedRoute>
      </Route>
      <Route path="/worship">
        <ProtectedRoute>
          <Events />
        </ProtectedRoute>
      </Route>
      <Route path="/church">
        <ProtectedRoute>
          <Church />
        </ProtectedRoute>
      </Route>
      <Route path="/ministries">
        <ProtectedRoute>
          <Ministries />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <ComingSoon />
        </ProtectedRoute>
      </Route>
      <Route path="/media">
        <ProtectedRoute>
          <ComingSoon />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <ComingSoon />
        </ProtectedRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
