import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-area">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="dashboard">{children}</main>
      </div>
    </div>
  );
}
