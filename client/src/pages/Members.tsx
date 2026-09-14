import { useEffect, useState } from "react";
import { ArrowRight, Search, UserPlus, Users } from "lucide-react";
import { Sidebar, Topbar } from "./Home";
import { listMembers } from "../services/puntakitService";
import type { ChurchMember } from "../types/puntakit";

const statusClass: Record<ChurchMember["status"], string> = { "เติบโตดี": "member-status growth", "ติดตามอยู่": "member-status follow", "รอติดตาม": "member-status waiting" };

export default function Members() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ChurchMember[]>([]);
  const [selected, setSelected] = useState<ChurchMember | null>(null);
  useEffect(() => { listMembers(query).then(setItems); }, [query]);
  return <div className="app-shell"><Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="shell-main"><Topbar query={query} results={[]} onQueryChange={setQuery} onMenu={() => setMobileOpen(true)} /><main className="dashboard"><div className="welcome-row"><div><span className="kicker">PUNTAKIT / ผู้คน</span><h1>สมาชิก <span>✦</span></h1><p>เห็นผู้คน เข้าใจเรื่องราว และดูแลกันได้ดีขึ้น</p></div><button className="primary-button"><UserPlus size={17} /> เพิ่มสมาชิก <ArrowRight size={16} /></button></div><section className="surface members-page"><div className="members-toolbar"><div><span className="kicker">รายชื่อทั้งหมด</span><h2>{items.length} คนที่แสดงอยู่</h2></div><label className="member-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อ กลุ่ม หรือพื้นที่..." aria-label="ค้นหาสมาชิก" /></label></div><div className="member-list">{items.map((member) => <button className={`member-row ${selected?.id === member.id ? "selected" : ""}`} key={member.id} onClick={() => setSelected(member)}><div className="member-avatar">{member.avatar}</div><div className="member-identity"><strong>{member.name}</strong><span>{member.role}</span></div><div className="member-group"><strong>{member.group}</strong><span>{member.area}</span></div><span className={statusClass[member.status]}>{member.status}</span><time>{member.lastSeen}</time><ArrowRight size={17} className="member-arrow" /></button>)}{!items.length && <div className="members-empty"><Users size={28} /><strong>ยังไม่พบสมาชิก</strong><span>ลองค้นหาด้วยคำอื่น</span></div>}</div>{selected && <div className="member-detail"><div className="member-avatar large">{selected.avatar}</div><div><span className="kicker">กำลังดูแล</span><h3>{selected.name}</h3><p>{selected.group} · {selected.area}</p></div><button className="outline-button" onClick={() => setSelected(null)}>ปิด</button></div>}</section></main></div></div>;
}
