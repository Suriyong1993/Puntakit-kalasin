import { Bell, ChevronDown, LogOut, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ICON_SIZE } from "@/lib/icon-sizes";
import { useAuth } from "@/contexts/AuthContext";

interface TopbarProps {
  onMenu: () => void;
}

export function Topbar({ onMenu }: TopbarProps) {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("ออกจากระบบแล้ว");
    setMenuOpen(false);
  };

  return (
    <header className="topbar">
      <button className="menu-trigger" onClick={onMenu} aria-label="เปิดเมนู">
        <Menu size={ICON_SIZE.lg} />
      </button>

      <label className="searchbox">
        <Search size={ICON_SIZE.md} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาสมาชิก กิจกรรม หรือประกาศ..."
          aria-label="ค้นหา"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="ล้างการค้นหา">
            <X size={ICON_SIZE.xs} />
          </button>
        )}
      </label>

      <div className="topbar-right">
        <button className="icon-button notification" aria-label="การแจ้งเตือน">
          <Bell size={ICON_SIZE.lg} />
          <b>3</b>
        </button>
        <div className="profile" style={{ position: "relative", cursor: "pointer" }} onClick={() => setMenuOpen((v) => !v)}>
          <div className="avatar">{user?.name?.slice(0, 1) ?? "?"}</div>
          <div>
            <small>ยินดีต้อนรับ</small>
            <strong>{user?.name ?? "ผู้ใช้งาน"}</strong>
          </div>
          <ChevronDown size={ICON_SIZE.xs} />
          {menuOpen && (
            <div
              className="modal-card"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 200,
                padding: 10,
                zIndex: 70,
              }}
            >
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 8px", wordBreak: "break-all" }}>{user?.email}</p>
              <button className="cancel-button" style={{ width: "100%", justifyContent: "center" }} onClick={handleLogout}>
                <LogOut size={ICON_SIZE.sm} /> ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
