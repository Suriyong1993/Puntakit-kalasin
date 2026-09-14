import {
  BarChart3,
  Building2,
  Folder,
  Heart,
  Home as HomeIcon,
  Megaphone,
  Music2,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { Logo } from "./Logo";

export const navItems = [
  { label: "หน้าหลัก", icon: HomeIcon },
  { label: "สมาชิก", icon: Users },
  { label: "การประกาศ", icon: Megaphone },
  { label: "การนมัสการ", icon: Music2 },
  { label: "คริสตจักร", icon: Building2 },
  { label: "พันธกิจ", icon: Heart },
  { label: "รายงาน", icon: BarChart3 },
  { label: "สื่อ / เอกสาร", icon: Folder },
  { label: "ตั้งค่า", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  active: string;
  setActive: (label: string) => void;
}

export function Sidebar({ open, onClose, active, setActive }: SidebarProps) {
  const [, navigate] = useLocation();

  return (
    <aside className={`sidebar ${open ? "is-open" : ""}`}>
      <div className="sidebar-top">
        <Logo />
        <button className="mobile-close" onClick={onClose} aria-label="ปิดเมนู">
          <X />
        </button>
      </div>

      <nav className="nav-list" aria-label="เมนูหลัก">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${active === label ? "active" : ""}`}
            onClick={() => {
              setActive(label);
              onClose();
              if (label === "สมาชิก") navigate("/members");
              else if (label === "หน้าหลัก") navigate("/");
            }}
          >
            <Icon size={21} />
            <span>{label}</span>
            {active === label && <span className="nav-dot" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-message">
        <Sparkles size={17} />
        <p>"รักพระเจ้า<br />รักผู้คน<br />เปลี่ยนแปลงชุมชน"</p>
        <div className="sidebar-hill">
          <span>✦</span>
        </div>
      </div>
    </aside>
  );
}
