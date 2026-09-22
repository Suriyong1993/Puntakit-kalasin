import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  HeartHandshake,
  Home as HomeIcon,
  Megaphone,
  Settings,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { ICON_SIZE } from "@/lib/icon-sizes";
import { Logo } from "./Logo";

export const navItems = [
  { label: "หน้าหลัก", path: "/", icon: HomeIcon },
  { label: "แอพสมาชิก (PWA)", path: "/app", icon: Sparkles },
  { label: "สมาชิก", path: "/members", icon: Users },
  { label: "กลุ่มแคร์", path: "/groups", icon: UsersRound },
  { label: "เช็คชื่อ/เข้าร่วม", path: "/attendance", icon: UserCheck },
  { label: "การประกาศ", path: "/announcements", icon: Megaphone },
  { label: "การนมัสการ", path: "/events", icon: CalendarDays },
  { label: "คริสตจักร", path: "/church", icon: Building2 },
  { label: "พันธกิจ", path: "/ministries", icon: HeartHandshake },
  { label: "รายงาน", path: "/reports", icon: BarChart3 },
  { label: "สื่อ/เอกสาร", path: "/media", icon: BookOpen },
  { label: "ตั้งค่า", path: "/settings", icon: Settings },
  { label: "โปรไฟล์", path: "/profile", icon: UserRound },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();

  return (
    <aside className={`sidebar ${open ? "is-open" : ""}`}>
      <div className="sidebar-top">
        <Logo />
        <button className="mobile-close" onClick={onClose} aria-label="ปิดเมนู">
          <X size={ICON_SIZE.lg} />
        </button>
      </div>

      <nav className="nav-list" aria-label="เมนูหลัก">
        {navItems.map(({ label, path, icon: Icon }) => {
          const active = location === path;
          return (
            <button
              key={label}
              className={`nav-item ${active ? "active" : ""}`}
              onClick={() => {
                onClose();
                navigate(path);
              }}
            >
              <Icon size={ICON_SIZE.lg} />
              <span>{label}</span>
              {active && <span className="nav-dot" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-message">
        <Sparkles size={ICON_SIZE.sm} />
        <p>"รักพระเจ้า<br />รักผู้คน<br />เปลี่ยนแปลงชุมชน"</p>
        <div className="sidebar-hill">
          <span>✦</span>
        </div>
      </div>
    </aside>
  );
}
