import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Sidebar, Topbar } from "./Home";

export default function SectionPage({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: LucideIcon }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="app-shell"><Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="shell-main"><Topbar query="" results={[]} onQueryChange={() => undefined} onMenu={() => setMobileOpen(true)} /><main className="dashboard"><div className="welcome-row"><div><span className="kicker">PUNTAKIT / พื้นที่การทำงาน</span><h1>{title} <span>✦</span></h1><p>{subtitle}</p></div><button className="primary-button"><Icon size={17} /> เพิ่มรายการ <ChevronRight size={16} /></button></div><section className="surface empty-page"><div className="empty-icon"><Icon size={30} /></div><h2>พื้นที่สำหรับทีมของคุณ</h2><p>หน้านี้พร้อมเชื่อมต่อกับข้อมูลจริงของคริสตจักรในขั้นตอนถัดไป</p><button className="outline-button">ดูแนวทางการใช้งาน <ArrowRight size={15} /></button></section></main></div></div>;
}
