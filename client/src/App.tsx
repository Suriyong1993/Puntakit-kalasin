import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Members from "./pages/Members";
import ActivityLog from "./pages/ActivityLog";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "./const";

function AdminActivityLog() {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <div className="auth-screen"><div className="auth-card"><strong>กำลังตรวจสอบสิทธิ์...</strong><span>กำลังเตรียมพื้นที่รายงาน</span></div></div>;
  if (!isAuthenticated) return <div className="auth-screen"><div className="auth-card"><h1>เข้าสู่ระบบก่อน</h1><p>Activity Log สำหรับผู้ดูแลระบบเท่านั้น</p><button className="blue-button" onClick={() => startLogin()}>เข้าสู่ระบบ</button></div></div>;
  if (user?.role !== "admin") return <div className="auth-screen"><div className="auth-card"><h1>ไม่มีสิทธิ์เข้าถึง</h1><p>หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ</p></div></div>;
  return <ActivityLog />;
}
function Router() {
  // make sure to consider if you need authentication for certain routes
  return <Switch><Route path="/" component={Home} /><Route path="/members" component={Members} /><Route path="/activity-log" component={AdminActivityLog} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
