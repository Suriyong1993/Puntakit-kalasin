import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  Cross,
  Folder,
  Heart,
  Home as HomeIcon,
  Leaf,
  Megaphone,
  Menu,
  Music2,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

const navItems = [
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

const metrics = [
  { label: "สมาชิกทั้งหมด", value: "344", suffix: "คน", trend: "↑ +12 คน", tone: "blue", icon: Users },
  { label: "เข้าร่วมกลุ่ม", value: "210", suffix: "คน", trend: "61%", tone: "green", icon: Leaf },
  { label: "มาคริสตจักร", value: "178", suffix: "คน", trend: "52%", tone: "orange", icon: Building2 },
  { label: "รับเชื่อใหม่", value: "28", suffix: "คน", trend: "↑ +6 คน", tone: "purple", icon: Heart },
];

const journey = [
  { n: "1", title: "พบคน", detail: "สร้างความสัมพันธ์", icon: Users, tone: "mint" },
  { n: "2", title: "ประกาศ", detail: "ข่าวประเสริฐ", icon: Megaphone, tone: "sky" },
  { n: "3", title: "นำมารับเชื่อ", detail: "และติดตาม", icon: Heart, tone: "lilac" },
  { n: "4", title: "มาคริสตจักร", detail: "(คริสตจักร)", icon: Building2, tone: "sun" },
  { n: "5", title: "เข้าสู่พันธกิจบ้าน", detail: "(พบปะ / กลุ่ม)", icon: Users, tone: "rose" },
  { n: "6", title: "เติบโต", detail: "เป็นสาวกและนำคนต่อไป", icon: Leaf, tone: "mint" },
];

const activities = [
  { title: "กลุ่มบ้าน เมือง 1", meta: "มีผู้เข้าร่วม 12 คน", time: "2 ชม. ที่แล้ว", icon: Users, tone: "blue" },
  { title: "ประกาศข่าวประเสริฐ ที่ตลาดสด", meta: "มีผู้ฟัง 28 คน", time: "5 ชม. ที่แล้ว", icon: Megaphone, tone: "orange" },
  { title: "ผู้รับเชื่อใหม่", meta: "3 คน", time: "1 วันที่แล้ว", icon: Heart, tone: "pink" },
  { title: "ประชุมทีมพันธกิจ", meta: "วางแผนเดือนกันยายน", time: "1 วันที่แล้ว", icon: Users, tone: "purple" },
];

const chart = [132, 134, 180, 46, 37, 40];
const chartLabels = ["เมือง 1", "เมือง 2", "สมเด็จ", "ท่าคันโท", "บัวขาว", "คำใหญ่"];

function Logo() {
  return <div className="brand"><div className="brand-mark"><Cross size={29} strokeWidth={3.4} /><span /></div><div><strong>Puntakit</strong><small>CHURCH</small></div></div>;
}

function Sidebar({ open, onClose, active, setActive }: { open: boolean; onClose: () => void; active: string; setActive: (label: string) => void }) {
  return <aside className={`sidebar ${open ? "is-open" : ""}`}>
    <div className="sidebar-top"><Logo /><button className="mobile-close" onClick={onClose} aria-label="ปิดเมนู"><X /></button></div>
    <nav className="nav-list" aria-label="เมนูหลัก">
      {navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => { setActive(label); onClose(); }}><Icon size={21} /><span>{label}</span>{active === label && <span className="nav-dot" />}</button>)}
    </nav>
    <div className="sidebar-message"><Sparkles size={17} /><p>“รักพระเจ้า<br />รักผู้คน<br />เปลี่ยนแปลงชุมชน”</p><div className="sidebar-hill"><span>✦</span></div></div>
  </aside>;
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const [query, setQuery] = useState("");
  return <header className="topbar"><button className="menu-trigger" onClick={onMenu} aria-label="เปิดเมนู"><Menu /></button><label className="searchbox"><Search size={20} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาสมาชิก กิจกรรม หรือประกาศ..." aria-label="ค้นหา" />{query && <button onClick={() => setQuery("")} aria-label="ล้างการค้นหา"><X size={16} /></button>}</label><div className="topbar-right"><button className="icon-button notification" aria-label="การแจ้งเตือน"><Bell size={20} /><b>3</b></button><div className="profile"><div className="avatar">น</div><div><small>ยินดีต้อนรับ</small><strong>ทีมพันธกิจ</strong></div><ChevronDown size={15} /></div></div></header>;
}

function Hero() {
  return <section className="hero card-surface"><img src="/manus-storage/puntakit-hero_d9170436.png" alt="ครอบครัวและชุมชนคริสตจักร Puntakit" /><div className="hero-wash" /><div className="hero-copy"><span className="eyebrow">PUNTAKIT • CHURCH COMMUNITY</span><h1>1 คน นำ 2 คน<br /><em>สู่พระคริสต์</em><br />และคริสตจักร</h1><p>เพราะคริสตจักร คือ บ้านของทุกคน</p><small>มัทธิว 28:19–20</small></div><div className="hero-side-copy"><strong>มาร่วมกัน<br />สร้างสาวกว่า<br />ให้เติบโตในพระเจ้า</strong><button>เริ่มต้นวันนี้ <ArrowRight size={15} /></button></div></section>;
}

function MetricCard({ item }: { item: typeof metrics[number] }) {
  const Icon = item.icon;
  return <button className={`metric-card ${item.tone}`}><div className="metric-icon"><Icon size={25} /></div><div className="metric-content"><span>{item.label}</span><div><strong>{item.value}</strong><b>{item.suffix}</b></div><small className={item.trend.includes("↑") ? "up" : ""}>{item.trend}</small></div><ChevronRight className="metric-arrow" size={20} /></button>;
}

function Journey() {
  return <section className="journey card-surface"><div className="section-heading"><div><span className="mini-icon"><Sparkles size={16} /></span><h2>6 ขั้นตอนสู่การสร้างสาวก</h2></div><button className="text-button">ดูรายละเอียด <ArrowRight size={15} /></button></div><div className="journey-track">{journey.map((step, i) => { const Icon = step.icon; return <div className="journey-wrap" key={step.n}><button className={`journey-step ${step.tone}`}><span className="step-number">{step.n}</span><div className="step-illustration"><Icon size={31} /></div><strong>{step.title}</strong><small>{step.detail}</small></button>{i < journey.length - 1 && <ChevronRight className="journey-arrow" size={20} />}</div>; })}</div></section>;
}

function GoalCard() {
  return <section className="goal-card card-surface"><div className="section-heading"><div><span className="mini-icon pink"><Target size={16} /></span><h2>เป้าหมาย 2026</h2></div><button className="more-button" aria-label="เมนูเพิ่มเติม">•••</button></div><div className="goal-ring" role="img" aria-label="ทำได้ 54 เปอร์เซ็นต์ จากเป้าหมาย 1050 คน"><div><strong>1,050</strong><span>คน</span><small>พันธกิจบ้าน</small></div></div><div className="goal-legend"><div><span className="legend-dot green-dot" /><span>ปัจจุบัน</span><b>569 คน <small>(54%)</small></b></div><div><span className="legend-dot pink-dot" /><span>ยังขาด</span><b>481 คน <small>(46%)</small></b></div></div></section>;
}

function Activities() {
  return <section className="activities card-surface"><div className="section-heading"><div><span className="mini-icon blue"><Users size={16} /></span><h2>กิจกรรมล่าสุด</h2></div><button className="text-button">ดูทั้งหมด <ArrowRight size={15} /></button></div><div>{activities.map((item) => { const Icon = item.icon; return <button className="activity-item" key={item.title}><span className={`activity-icon ${item.tone}`}><Icon size={18} /></span><span className="activity-copy"><strong>{item.title}</strong><small>{item.meta}</small></span><time>{item.time}</time></button>; })}</div></section>;
}

function ChurchStatus() {
  return <section className="status card-surface"><div className="section-heading"><div><span className="mini-icon blue"><Building2 size={16} /></span><h2>สรุปสถานะปัจจุบัน</h2><small>(13 ก.ย. 2026)</small></div></div><div className="status-grid"><div className="status-tile blue-tile"><Building2 /><span>มาคริสตจักร</span><strong>300 <small>คน</small></strong><em>เป้าหมาย 1,350 คน</em></div><div className="status-tile green-tile"><HomeIcon /><span>พันธกิจบ้าน</span><strong>1,050 <small>คน</small></strong><em>เป้าหมาย 1,350 คน</em></div></div><div className="status-total">รวมทั้งหมด <strong>1,350</strong> คน</div></section>;
}

function Analytics() {
  const max = useMemo(() => Math.max(...chart), []);
  return <section className="analytics card-surface"><div className="section-heading"><div><span className="mini-icon purple"><BarChart3 size={16} /></span><h2>สมาชิกตามพื้นที่</h2></div><button className="select-button">ทั้งหมด <ChevronDown size={14} /></button></div><div className="chart" aria-label="กราฟสมาชิกตามพื้นที่">{chart.map((value, i) => <div className="bar-col" key={chartLabels[i]}><span>{value}</span><div className="bar-track"><div className="bar" style={{ height: `${(value / max) * 100}%`, background: `var(--chart-${i + 1})` }} /></div><small>{chartLabels[i]}</small></div>)}</div></section>;
}

function Inspiration() {
  return <section className="inspiration card-surface"><img src="/manus-storage/puntakit-bible_6f94bd0e.png" alt="พระคัมภีร์ท่ามกลางแสงอาทิตย์" /><div className="inspiration-copy"><span>พันธกิจของเรา</span><h2>ไปทั่วโลก<br />และประกาศข่าวประเสริฐ<br />แก่คนทั้งปวง</h2><small>มัทธิว 28:19</small></div></section>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("หน้าหลัก");
  return <div className="app-shell"><Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active={active} setActive={setActive} /><div className="main-area"><Topbar onMenu={() => setMenuOpen(true)} /><main className="dashboard"><div className="welcome-row"><div><span className="eyebrow blue-eyebrow">วันจันทร์ที่ 14 กันยายน 2026</span><h2>สวัสดีครับ ทีมพันธกิจ <span>👋</span></h2></div><button className="primary-action"><Sparkles size={16} /> สร้างกิจกรรมใหม่</button></div><div className="dashboard-grid"><div className="primary-column"><Hero /><div className="metrics-grid">{metrics.map((item) => <MetricCard item={item} key={item.label} />)}</div><Journey /><div className="lower-grid"><ChurchStatus /><Analytics /></div></div><aside className="right-column"><section className="mission-card card-surface"><div className="leaf-art"><Leaf size={57} /></div><span>พันธกิจบ้าน</span><h2>คือ ฐานสร้างคน</h2><p>คริสตจักร คือ บ้านแห่งการผูกพัน<br />เติบโต และรับใช้</p><button className="blue-button">อ่านเพิ่มเติม <ArrowRight size={15} /></button></section><GoalCard /><Activities /><Inspiration /></aside></div></main></div></div>;
}
