import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ICON_SIZE } from "@/lib/icon-sizes";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface TopbarProps {
  onMenu: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  pastor: "ศิษยาภิบาล",
  staff: "เจ้าหน้าที่",
  leader: "ผู้นำกลุ่มแคร์",
  member: "สมาชิก",
};

export function Topbar({ onMenu }: TopbarProps) {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("ออกจากระบบแล้ว");
    setMenuOpen(false);
    navigate("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Navigate to members search with query
    navigate(`/members?search=${encodeURIComponent(query.trim())}`);
  };

  const roleText = (user?.role && ROLE_LABEL[user.role]) || "ผู้ใช้งาน";

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Left section: Hamburger toggle on mobile + search bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onMenu}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="เปิดเมนู"
        >
          <Menu size={ICON_SIZE.lg} />
        </button>

        {/* TailAdmin Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 text-slate-400">
              <Search size={ICON_SIZE.sm} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาสมาชิก กิจกรรม หรือกลุ่มแคร์..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-9 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              aria-label="ค้นหา"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
                aria-label="ล้างการค้นหา"
              >
                <X size={ICON_SIZE.xs} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right section: Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => toggleTheme?.()}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600"
          aria-label={theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
          title={theme === "dark" ? "โหมดสว่าง" : "โหมดมืด"}
        >
          {theme === "dark" ? <Sun size={ICON_SIZE.md} /> : <Moon size={ICON_SIZE.md} />}
        </button>
        {/* Notification Button */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600"
          aria-label="การแจ้งเตือน"
          onClick={() => toast.info("ไม่มีการแจ้งเตือนใหม่")}
        >
          <Bell size={ICON_SIZE.md} />
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
            0
          </span>
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-slate-100 sm:px-3 sm:py-2"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-xs">
              {user?.name?.trim().slice(0, 1) || "?"}
            </div>
            <div className="hidden text-left sm:block">
              <span className="block text-xs font-semibold text-slate-800 leading-tight">
                {user?.name ?? "ผู้ใช้งาน"}
              </span>
              <span className="block text-[11px] font-medium text-slate-500">
                {roleText}
              </span>
            </div>
            <ChevronDown
              size={ICON_SIZE.xs}
              className={`hidden text-slate-400 transition-transform sm:block ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* TailAdmin Dropdown Popover */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Info Header */}
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user?.name ?? "ผู้ใช้งาน"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email ?? ""}
                </p>
                <span className="mt-1 inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  {roleText}
                </span>
              </div>

              {/* Menu Links */}
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <UserRound size={ICON_SIZE.sm} className="text-slate-500" />
                  <span>โปรไฟล์ส่วนตัว</span>
                </Link>

                <Link
                  href="/app"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Sparkles size={ICON_SIZE.sm} className="text-blue-500" />
                  <span>สลับไปหน้าแอพสมาชิก (PWA)</span>
                </Link>
              </div>

              {/* Logout Button */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={ICON_SIZE.sm} className="text-rose-500" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
