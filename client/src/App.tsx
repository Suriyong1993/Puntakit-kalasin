import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Members from "./pages/Members";
import SectionPage from "./pages/SectionPage";
import { BarChart3, Building2, FileText, Heart, Megaphone, Music2, Settings, Users } from "lucide-react";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/members" component={Members} />
    <Route path="/groups"><SectionPage title="กลุ่มบ้าน" subtitle="พื้นที่เล็ก ๆ ที่ทำให้การเติบโตเกิดขึ้นจริง" icon={Heart} /></Route>
    <Route path="/announcements"><SectionPage title="การประกาศ" subtitle="สื่อสารข่าวสารสำคัญให้ทุกคนรับรู้พร้อมกัน" icon={Megaphone} /></Route>
    <Route path="/worship"><SectionPage title="การนมัสการ" subtitle="เตรียมทีมและดูแลประสบการณ์การนมัสการ" icon={Music2} /></Route>
    <Route path="/church"><SectionPage title="คริสตจักร" subtitle="ภาพรวมพื้นที่และการดำเนินงานของคริสตจักร" icon={Building2} /></Route>
    <Route path="/ministries"><SectionPage title="พันธกิจ" subtitle="เชื่อมต่อคนกับการรับใช้ที่มีความหมาย" icon={Heart} /></Route>
    <Route path="/reports"><SectionPage title="รายงาน" subtitle="เปลี่ยนข้อมูลให้เป็นบทสนทนาและการตัดสินใจ" icon={BarChart3} /></Route>
    <Route path="/media"><SectionPage title="สื่อ / เอกสาร" subtitle="เก็บสิ่งสำคัญของชุมชนไว้ให้ค้นหาได้ง่าย" icon={FileText} /></Route>
    <Route path="/settings"><SectionPage title="ตั้งค่า" subtitle="จัดการพื้นที่ทำงาน บทบาท และการแจ้งเตือน" icon={Settings} /></Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
