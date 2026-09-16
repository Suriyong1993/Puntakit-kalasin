import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Heart, Home as HomeIcon, Leaf, MapPin, RefreshCw, ShieldAlert, Sparkles, UserRoundPlus, Users } from "lucide-react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { authService, type SignedInProfile } from "@/services/auth";
import { dashboardService, type DashboardSnapshot } from "@/services/dashboard";
import { isSupabaseConfigured } from "@/services/supabase";
import { ICON_SIZE } from "@/lib/icon-sizes";
import type { FollowUpStatus, MemberRecord } from "@/types/database";

const followUpLabels: Record<FollowUpStatus, string> = {
  new: "รอติดต่อ",
  contacted: "ติดต่อแล้ว",
  in_progress: "กำลังติดตาม",
  stable: "ติดตามเรียบร้อย",
  needs_attention: "ต้องดูแล",
  inactive: "ไม่ได้ติดตาม",
};

function initials(name: string) { return name.trim().slice(0, 1) || "ส"; }
function tone(id: string) { return ["blue", "pink", "orange", "purple", "green"][id.charCodeAt(0) % 5]; }
function careTone(status: FollowUpStatus) { return status === "needs_attention" ? "attention" : status === "new" ? "orange" : "blue"; }

function Hero() {
  return <section className="hero card-surface">
    <img src="/manus-storage/puntakit-hero_d9170436.png" alt="ครอบครัวและชุมชนคริสตจักร Puntakit" />
    <div className="hero-wash" />
    <div className="hero-copy"><span className="eyebrow">PUNTAKIT • CHURCH COMMUNITY</span><h1>1 คน นำ 2 คน<br /><em>สู่พระคริสต์</em><br />และคริสตจักร</h1><p>เพราะคริสตจักร คือ บ้านของทุกคน</p><small>มัทธิว 28:19–20</small></div>
    <div className="hero-side-copy"><strong>มาร่วมกัน<br />สร้างสาวกว่า<br />ให้เติบโตในพระเจ้า</strong><Link href="/members">ดูแลสมาชิก <ArrowRight size={ICON_SIZE.xs} /></Link></div>
  </section>;
}

function MetricCard({ icon: Icon, label, value, suffix, tone: cardTone, href, description }: { icon: typeof Users; label: string; value: number; suffix: string; tone: string; href: string; description: string }) {
  return <Link href={href} className={`metric-card ${cardTone}`} aria-label={`${label} ${value} ${suffix}`}><div className="metric-icon"><Icon size={ICON_SIZE.xl} /></div><div className="metric-content"><span>{label}</span><div><strong>{value}</strong><b>{suffix}</b></div><small>{description}</small></div><ArrowRight className="metric-arrow" size={ICON_SIZE.lg} /></Link>;
}

function CareQueue({ people }: { people: MemberRecord[] }) {
  return <section className="care-queue card-surface"><div className="section-heading"><div><span className="mini-icon pink"><Heart size={ICON_SIZE.sm} /></span><h2>รายการคนที่ต้องดูแล</h2></div><Link href="/members" className="text-button">ดูสมาชิก <ArrowRight size={ICON_SIZE.xs} /></Link></div>{people.length ? <div className="care-list">{people.map((member) => <Link href="/members" className="care-item" key={member.id}><span className={`member-avatar ${tone(member.id)}`}>{initials(member.full_name)}</span><span className="care-copy"><strong>{member.full_name}</strong><small>{member.area?.name || "ยังไม่กำหนดพื้นที่"} · {member.group?.name || "ยังไม่เข้ากลุ่ม"}</small></span><span className={`care-tag ${careTone(member.follow_up_status)}`}>{followUpLabels[member.follow_up_status]}</span></Link>)}</div> : <div className="care-empty"><UserRoundPlus size={ICON_SIZE.xl} /><p>ยังไม่มีสมาชิกที่อยู่ในคิวดูแล</p></div>}</section>;
}

function AreaDistribution({ areas }: { areas: DashboardSnapshot["areas"] }) {
  const max = useMemo(() => Math.max(...areas.map((item) => item.value), 1), [areas]);
  return <section className="analytics card-surface"><div className="section-heading"><div><span className="mini-icon purple"><MapPin size={ICON_SIZE.sm} /></span><h2>สมาชิกตามพื้นที่</h2></div></div>{areas.length ? <div className="real-area-chart">{areas.map((area) => <div className="real-area-row" key={area.label}><span>{area.label}</span><div><i style={{ width: `${(area.value / max) * 100}%` }} /></div><b>{area.value}</b></div>)}</div> : <div className="inline-empty">ยังไม่มีข้อมูลพื้นที่</div>}</section>;
}

export default function Home() {
  const [profile, setProfile] = useState<SignedInProfile | null | undefined>(undefined);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !profile) return;
    setLoading(true); setError(null);
    try { setSnapshot(await dashboardService.snapshot()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "ไม่สามารถโหลดข้อมูลภาพรวมได้"); }
    finally { setLoading(false); }
  }, [profile]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setProfile(null); return; }
    let cancelled = false;
    void authService.currentProfile().then((current) => { if (!cancelled) setProfile(current); }).catch((reason) => { if (!cancelled) { setError(reason instanceof Error ? reason.message : "ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้งานได้"); setProfile(null); } });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { void load(); }, [load]);

  const configuredMessage = !isSupabaseConfigured ? "หน้าหลักจะแสดงข้อมูลจริงหลังตั้งค่า Supabase และใช้ migration ของ Puntakit" : profile === undefined ? "กำลังตรวจสอบสิทธิ์ผู้ใช้งาน…" : !profile ? "กรุณาเข้าสู่ระบบด้วยบัญชีที่ได้รับสิทธิ์ เพื่อดูข้อมูลพันธกิจ" : null;

  return <AppLayout>
    <div className="welcome-row"><div><span className="eyebrow blue-eyebrow">PUNTAKIT MINISTRY OVERVIEW</span><h2>สวัสดีครับ {profile?.display_name || "ทีมพันธกิจ"}</h2></div><Link href="/members" className="primary-action"><Users size={ICON_SIZE.sm} /> ดูแลสมาชิก</Link></div>
    {configuredMessage ? <section className="data-state-card card-surface" role="status"><ShieldAlert size={ICON_SIZE["2xl"]} /><h2>ยังไม่พร้อมใช้งาน</h2><p>{configuredMessage}</p></section> : error ? <section className="data-state-card card-surface" role="alert"><ShieldAlert size={ICON_SIZE["2xl"]} /><h2>ไม่สามารถโหลดข้อมูลได้</h2><p>{error}</p><button className="blue-button" onClick={() => void load()}><RefreshCw size={ICON_SIZE.sm} /> ลองอีกครั้ง</button></section> : <div className="dashboard-grid"><div className="primary-column"><Hero />{loading || !snapshot ? <div className="dashboard-skeleton"><div /><div /><div /><div /></div> : <><div className="metrics-grid"><MetricCard icon={Users} label="สมาชิกทั้งหมด" value={snapshot.totalMembers} suffix="คน" tone="blue" href="/members" description="กำลังใช้งาน" /><MetricCard icon={HomeIcon} label="เข้าร่วมกลุ่ม" value={snapshot.groupedMembers} suffix="คน" tone="green" href="/members" description="มีการเชื่อมโยงกลุ่ม" /><MetricCard icon={Heart} label="รับเชื่อใหม่" value={snapshot.newBelievers} suffix="คน" tone="purple" href="/members" description="กำลังเติบโตในความเชื่อ" /><MetricCard icon={Sparkles} label="ต้องดูแล" value={snapshot.careCount} suffix="คน" tone="orange" href="/members" description="รอติดตามหรือกำลังติดตาม" /></div><section className="journey card-surface"><div className="section-heading"><div><span className="mini-icon"><Sparkles size={ICON_SIZE.sm} /></span><h2>เส้นทางการสร้างสาวก</h2></div><Link href="/members" className="text-button">เปิดรายชื่อ <ArrowRight size={ICON_SIZE.xs} /></Link></div><div className="journey-track">{["พบคน", "ประกาศ", "สนใจ", "รับเชื่อ", "เข้ากลุ่ม", "เติบโต"].map((label, index) => <div className="journey-wrap" key={label}><div className={`journey-step ${["mint", "sky", "lilac", "sun", "rose", "mint"][index]}`}><span className="step-number">{index + 1}</span><div className="step-illustration"><Leaf size={27} /></div><strong>{label}</strong><small>ติดตามตามข้อมูลจริง</small></div>{index < 5 && <ArrowRight className="journey-arrow" size={ICON_SIZE.lg} />}</div>)}</div></section><AreaDistribution areas={snapshot.areas} /></>}</div><aside className="right-column"><section className="mission-card card-surface"><div className="leaf-art"><Leaf size={57} /></div><span>พันธกิจบ้าน</span><h2>คือ ฐานสร้างคน</h2><p>ข้อมูลที่เห็นด้านซ้ายเชื่อมต่อกับฐานข้อมูลสมาชิกโดยตรง เพื่อให้ทีมดูแลคนได้ทันเวลา</p><Link href="/members" className="blue-button">จัดการสมาชิก <ArrowRight size={ICON_SIZE.xs} /></Link></section>{loading || !snapshot ? <div className="right-loading card-surface"><RefreshCw className="spin" size={ICON_SIZE.xl} /></div> : <CareQueue people={snapshot.careQueue} />}</aside></div>}
  </AppLayout>;
}
