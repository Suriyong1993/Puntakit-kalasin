import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Church,
  FileText,
  Heart,
  Home as HomeIcon,
  LayoutDashboard,
  Menu,
  Megaphone,
  Music2,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

const navItems = [
  { label: "หน้าหลัก", href: "/", icon: LayoutDashboard },
  { label: "สมาชิก", href: "/members", icon: Users },
  { label: "การประกาศ", href: "/announcements", icon: Megaphone },
  { label: "การนมัสการ", href: "/worship", icon: Music2 },
  { label: "คริสตจักร", href: "/church", icon: Church },
  { label: "พันธกิจ", href: "/ministries", icon: Heart },
  { label: "รายงาน", href: "/reports", icon: BarChart3 },
  { label: "สื่อ / เอกสาร", href: "/media", icon: FileText },
  { label: "ตั้งค่า", href: "/settings", icon: Settings },
];

export const journey = [
  { n: "01", title: "พบคน", detail: "สร้างความสัมพันธ์", color: "mint", icon: Users },
  { n: "02", title: "ประกาศ", detail: "ข่าวประเสริฐ", color: "sky", icon: Megaphone },
  { n: "03", title: "นำมารับเชื่อ", detail: "และติดตาม", color: "lilac", icon: Heart },
  { n: "04", title: "มาคริสตจักร", detail: "คริสตจักร", color: "peach", icon: Church },
  { n: "05", title: "เข้าสู่พันธกิจบ้าน", detail: "พบปะ / กลุ่ม", color: "rose", icon: Building2 },
  { n: "06", title: "เติบโต", detail: "เป็นสาวกและนำคนต่อไป", color: "mint", icon: Sparkles },
];

export const activities = [
  { title: "กลุ่มบ้าน เมือง 1", meta: "มีผู้เข้าร่วม 12 คน", time: "2 ชม. ที่แล้ว", tone: "blue", icon: Users },
  { title: "ประกาศข่าวประเสริฐ ที่ตลาดสด", meta: "มีผู้ฟัง 28 คน", time: "5 ชม. ที่แล้ว", tone: "orange", icon: Megaphone },
  { title: "ผู้รับเชื่อใหม่", meta: "3 คน", time: "1 วันที่แล้ว", tone: "pink", icon: Heart },
  { title: "ประชุมทีมพันธกิจ", meta: "วางแผนเดือนกันยายน", time: "1 วันที่แล้ว", tone: "purple", icon: CalendarDays },
];

export const distribution = [
  { label: "เมือง 1", value: 132, tone: "blue" },
  { label: "เมือง 2", value: 134, tone: "green" },
  { label: "สมเด็จ", value: 180, tone: "orange" },
  { label: "ท่าคันโท", value: 46, tone: "pink" },
  { label: "บัวขาว", value: 37, tone: "purple" },
  { label: "คำใหญ่", value: 40, tone: "blue" },
];

function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const [location] = useLocation();
  return (
    <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`} aria-label="เมนูหลัก">
      <div className="sidebar-brand">
        <div className="brand-mark"><Church size={25} strokeWidth={2.4} /></div>
        <div><div className="brand-name">Puntakit</div><div className="brand-sub">CHURCH</div></div>
        <button className="icon-button mobile-close" onClick={onClose} aria-label="ปิดเมนู"><X size={20} /></button>
      </div>
      <div className="sidebar-section-label">พื้นที่ของคริสตจักร</div>
      <nav className="sidebar-nav">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = location === href;
          return <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`} onClick={onClose}>
            <Icon size={19} strokeWidth={active ? 2.5 : 2} /><span>{label}</span>{active && <span className="nav-dot" />}
          </Link>;
        })}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-verse">
        <div className="verse-leaf">✦</div>
        <p>“รักพระเจ้า<br />รักผู้คน<br />เปลี่ยนแปลงชุมชน”</p>
        <span>พันธกิจของเรา</span>
      </div>
      <div className="sidebar-footer"><div className="footer-cross">✝</div><span>บ้านของทุกคน</span></div>
    </aside>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const [search, setSearch] = useState("");
  const [notiOpen, setNotiOpen] = useState(false);
  return <header className="topbar">
    <button className="icon-button menu-button" onClick={onMenu} aria-label="เปิดเมนู"><Menu size={22} /></button>
    <label className="search-box"><Search size={19} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาสมาชิก กิจกรรม หรือประกาศ..." aria-label="ค้นหา" /></label>
    <div className="topbar-right">
      <div className="notification-wrap">
        <button className="icon-button notification-button" onClick={() => setNotiOpen((v) => !v)} aria-label="การแจ้งเตือน"><Bell size={20} /><span className="notification-badge">3</span></button>
        {notiOpen && <div className="notification-popover"><strong>การแจ้งเตือน</strong><span>มีสมาชิกใหม่ 3 คนรอการติดตาม</span><span>กิจกรรมกลุ่มบ้านเริ่มใน 2 ชั่วโมง</span></div>}
      </div>
      <div className="top-divider" />
      <div className="profile"><div className="avatar">น</div><div><strong>ยินดีต้อนรับ</strong><span>ทีมพันธกิจ</span></div><ChevronDown size={16} className="profile-chevron" /></div>
    </div>
  </header>;
}

function HeroBanner() {
  return <section className="hero-card">
    <img src="/manus-storage/puntakit-hero_22958e7d.jpg" alt="สมาชิกคริสตจักรใช้เวลาร่วมกัน" />
    <div className="hero-overlay" />
    <div className="hero-copy"><div className="eyebrow"><span /> เป้าหมายของเรา</div><h1>1 คน นำ 2 คน<br /><em>สู่พระคริสต์</em><br />และคริสตจักร</h1><p>“เพราะคริสตจักร คือ บ้านของทุกคน”</p><small>มัทธิว 28:19–20</small></div>
    <div className="hero-callout"><Sparkles size={18} /><strong>มาร่วมกัน<br />สร้างสาวกว่า<br />ให้เติบโตในพระเจ้า</strong><button>เริ่มต้นวันนี้ <ArrowRight size={15} /></button></div>
  </section>;
}

function StatCard({ icon: Icon, label, value, detail, tone, trend }: { icon: typeof Users; label: string; value: string; detail: string; tone: string; trend: string }) {
  return <div className={`stat-card ${tone}`}><div className="stat-top"><div className="stat-icon"><Icon size={21} /></div><span className="stat-action"><ArrowRight size={16} /></span></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-detail"><b>{trend}</b> {detail}</span></div>;
}

function Journey() {
  return <section className="surface journey-card"><div className="section-heading"><div><span className="kicker">เส้นทางการเติบโต</span><h2>6 ขั้นตอนสู่การสร้างสาวก</h2></div><button className="text-button">ดูภาพรวม <ArrowRight size={15} /></button></div><div className="journey-track">{journey.map((item, index) => { const Icon = item.icon; return <div className="journey-step-wrap" key={item.n}><div className={`journey-step ${item.color}`}><div className="journey-number">{item.n}</div><div className="journey-icon"><Icon size={19} /></div><strong>{item.title}</strong><span>{item.detail}</span></div>{index < journey.length - 1 && <ChevronRight className="journey-arrow" size={21} />}</div>; })}</div></section>;
}

function GoalCard() {
  const percent = 54;
  return <section className="surface goal-card"><div className="section-heading compact"><div><span className="kicker">เป้าหมายร่วมกัน</span><h2>เป้าหมาย 2026</h2></div><Target size={22} className="goal-target" /></div><div className="goal-ring" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}><div><strong>1,050</strong><span>คน<br />พันธกิจบ้าน</span></div></div><div className="goal-legend"><div><span className="legend-dot green" /><span>ปัจจุบัน</span><b>569 คน <small>(54%)</small></b></div><div><span className="legend-dot pink" /><span>ยังขาด</span><b>481 คน <small>(46%)</small></b></div></div></section>;
}

function Activities() {
  return <section className="surface activities-card"><div className="section-heading compact"><div><span className="kicker">ความเคลื่อนไหว</span><h2>กิจกรรมล่าสุด</h2></div><button className="text-button">ดูทั้งหมด <ArrowRight size={15} /></button></div><div className="activity-list">{activities.map(({ title, meta, time, tone, icon: Icon }) => <div className="activity-item" key={title}><div className={`activity-icon ${tone}`}><Icon size={17} /></div><div className="activity-content"><strong>{title}</strong><span>{meta}</span></div><time>{time}</time></div>)}</div></section>;
}

function StatusCard() {
  return <section className="surface status-card"><div className="section-heading compact"><div><span className="kicker">ภาพรวมสุขภาพคริสตจักร</span><h2>สรุปสถานะปัจจุบัน</h2></div><span className="date-chip">13 ก.ย. 2026</span></div><div className="status-grid"><div className="status-tile blue"><Church size={20} /><span>มาคริสตจักร</span><strong>300 <small>คน</small></strong><em>เป้าหมาย 1,350 คน</em></div><div className="status-tile green"><Building2 size={20} /><span>พันธกิจบ้าน</span><strong>1,050 <small>คน</small></strong><em>เป้าหมาย 1,350 คน</em></div></div><div className="status-total"><span>รวมทั้งหมด</span><strong>1,350 <small>คน</small></strong></div></section>;
}

function DistributionChart() {
  const max = useMemo(() => Math.max(...distribution.map((d) => d.value)), []);
  return <section className="surface chart-card"><div className="section-heading compact"><div><span className="kicker">ข้อมูลเพื่อการดูแล</span><h2>สมาชิกตามพื้นที่</h2></div><button className="select-button">ทั้งหมด <ChevronDown size={15} /></button></div><div className="bars" role="img" aria-label="กราฟสมาชิกตามพื้นที่">{distribution.map((d) => <div className="bar-column" key={d.label}><span className="bar-value">{d.value}</span><div className={`bar ${d.tone}`} style={{ height: `${(d.value / max) * 100}%` }} /><span className="bar-label">{d.label}</span></div>)}</div></section>;
}

function MissionBanner() {
  return <section className="mission-banner"><img src="/manus-storage/puntakit-mission_49f2fd20.jpg" alt="พระคัมภีร์และแสงอาทิตย์" /><div className="mission-overlay" /><div className="mission-copy"><span>พระบัญชาที่ยังดำเนินต่อไป</span><h2>“ไปทั่วโลก<br />และประกาศข่าวประเสริฐ<br />แก่คนทั้งปวง”</h2><small>มัทธิว 28:19</small></div></section>;
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="app-shell"><Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /><div className={`shell-main ${mobileOpen ? "dimmed" : ""}`}><Topbar onMenu={() => setMobileOpen(true)} /><main className="dashboard"><div className="welcome-row"><div><span className="kicker">วันอาทิตย์ที่ 13 กันยายน 2026</span><h1>สวัสดีครับ ทีมพันธกิจ <span>✦</span></h1><p>มาดูกันว่า วันนี้เราจะดูแลผู้คนให้เติบโตได้อย่างไร</p></div><button className="primary-button"><Activity size={17} /> บันทึกกิจกรรม <ChevronRight size={16} /></button></div><div className="dashboard-grid"><div className="main-column"><HeroBanner /><div className="stat-grid"><StatCard icon={Users} label="สมาชิกทั้งหมด" value="344 คน" detail="จากเดือนที่แล้ว" trend="↑ +12" tone="blue" /><StatCard icon={Sparkles} label="เข้าร่วมกลุ่ม" value="210 คน" detail="ของสมาชิกทั้งหมด" trend="61%" tone="green" /><StatCard icon={Church} label="มาคริสตจักร" value="178 คน" detail="จากสัปดาห์ที่แล้ว" trend="52%" tone="orange" /><StatCard icon={Heart} label="รับเชื่อใหม่" value="28 คน" detail="ในปีนี้" trend="↑ +6" tone="purple" /></div><Journey /><div className="bottom-grid"><StatusCard /><DistributionChart /></div></div><div className="side-column"><section className="surface mission-card"><div className="mission-card-top"><span className="kicker">หัวใจของพันธกิจ</span><div className="plant">✦</div></div><h2>พันธกิจบ้าน<br />คือ ฐานสร้างคน</h2><p>คริสตจักร คือ บ้านแห่งการผูกพัน เติบโต และรับใช้</p><button className="outline-button">อ่านเพิ่มเติม <ArrowRight size={15} /></button></section><GoalCard /><Activities /><MissionBanner /></div></div></main></div></div>;
}

export function SectionPage({ title, subtitle, icon: Icon = FileText }: { title: string; subtitle: string; icon?: typeof FileText }) {
  return <div className="app-shell"><Sidebar mobileOpen={false} onClose={() => undefined} /><div className="shell-main"><Topbar onMenu={() => undefined} /><main className="dashboard"><div className="welcome-row"><div><span className="kicker">PUNTAKIT / พื้นที่การทำงาน</span><h1>{title} <span>✦</span></h1><p>{subtitle}</p></div><button className="primary-button"><Icon size={17} /> เพิ่มรายการ <ChevronRight size={16} /></button></div><section className="surface empty-page"><div className="empty-icon"><Icon size={30} /></div><h2>พื้นที่สำหรับทีมของคุณ</h2><p>หน้านี้พร้อมเชื่อมต่อกับข้อมูลจริงของคริสตจักรในขั้นตอนถัดไป</p><button className="outline-button">ดูแนวทางการใช้งาน <ArrowRight size={15} /></button></section></main></div></div>;
}
