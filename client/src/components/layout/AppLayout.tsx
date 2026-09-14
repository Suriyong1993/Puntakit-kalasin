import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppLayoutProps {
  activeNav: string;
  children: React.ReactNode;
}

export function AppLayout({ activeNav, children }: AppLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(activeNav);

  return (
    <div className="app-shell">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active={active}
        setActive={setActive}
      />
      <div className="main-area">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="dashboard">{children}</main>
      </div>
    </div>
  );
}
