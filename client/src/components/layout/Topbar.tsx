import { Bell, ChevronDown, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { ICON_SIZE } from "@/lib/icon-sizes";

interface TopbarProps {
  onMenu: () => void;
}

export function Topbar({ onMenu }: TopbarProps) {
  const [query, setQuery] = useState("");

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
        <Link href="/profile" className="profile" aria-label="เปิดโปรไฟล์ส่วนตัว">
          <div className="avatar">น</div>
          <div>
            <small>ยินดีต้อนรับ</small>
            <strong>ทีมพันธกิจ</strong>
          </div>
          <ChevronDown size={ICON_SIZE.xs} />
        </Link>
      </div>
    </header>
  );
}
