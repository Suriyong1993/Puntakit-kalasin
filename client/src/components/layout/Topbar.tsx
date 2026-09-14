import { Bell, ChevronDown, Menu, Search, X } from "lucide-react";
import { useState } from "react";

interface TopbarProps {
  onMenu: () => void;
}

export function Topbar({ onMenu }: TopbarProps) {
  const [query, setQuery] = useState("");

  return (
    <header className="topbar">
      <button className="menu-trigger" onClick={onMenu} aria-label="เปิดเมนู">
        <Menu />
      </button>

      <label className="searchbox">
        <Search size={20} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาสมาชิก กิจกรรม หรือประกาศ..."
          aria-label="ค้นหา"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="ล้างการค้นหา">
            <X size={16} />
          </button>
        )}
      </label>

      <div className="topbar-right">
        <button className="icon-button notification" aria-label="การแจ้งเตือน">
          <Bell size={20} />
          <b>3</b>
        </button>
        <div className="profile">
          <div className="avatar">น</div>
          <div>
            <small>ยินดีต้อนรับ</small>
            <strong>ทีมพันธกิจ</strong>
          </div>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  );
}
