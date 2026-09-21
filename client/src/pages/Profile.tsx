import { Award, CalendarDays, CheckCircle2, ChevronRight, Edit3, LogOut, Mail, MapPin, ShieldCheck, Users } from "lucide-react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { ICON_SIZE } from "@/lib/icon-sizes";

const details = [
  { label: "อีเมล", value: "admin@puntakit.org", icon: Mail },
  { label: "บทบาท", value: "ผู้ดูแลระบบ", icon: ShieldCheck },
  { label: "กลุ่ม / พื้นที่", value: "คริสตจักรกาฬสินธุ์", icon: MapPin },
  { label: "เข้าร่วมเมื่อ", value: "1 มกราคม 2024", icon: CalendarDays },
];

const stats = [
  { label: "สมาชิกที่ดูแล", value: "24", icon: Users, tone: "blue" },
  { label: "กิจกรรมที่เข้าร่วม", value: "18", icon: CalendarDays, tone: "orange" },
  { label: "ความก้าวหน้า", value: "86%", icon: Award, tone: "green" },
];

export default function Profile() {
  return (
    <AppLayout>
      <div className="profile-page">
        <div className="page-heading">
          <div><span className="eyebrow">ACCOUNT CENTER</span><h1>โปรไฟล์ส่วนตัว</h1><p>จัดการข้อมูลและติดตามการมีส่วนร่วมของคุณในชุมชน</p></div>
          <button className="primary-action" type="button"><Edit3 size={ICON_SIZE.sm} />แก้ไขข้อมูล</button>
        </div>
        <section className="profile-hero card-surface">
          <div className="profile-avatar">น</div>
          <div className="profile-identity"><div className="profile-name-row"><h2>นรินทร์ พันธกิจ</h2><span className="status-chip good"><CheckCircle2 size={12} /> ใช้งานอยู่</span></div><p>ผู้ดูแลระบบ · ทีมพันธกิจ</p><small>ดูแลการเติบโตของสมาชิกและชุมชนคริสตจักร</small></div>
          <div className="profile-hero-mark"><ShieldCheck size={34} /></div>
        </section>
        <div className="profile-grid">
          <section className="profile-panel card-surface"><div className="section-heading"><div><span className="mini-icon"><Users size={ICON_SIZE.sm} /></span><h2>ข้อมูลส่วนตัว</h2></div></div><div className="profile-details">{details.map(({ label, value, icon: Icon }) => <div className="profile-detail" key={label}><span className="profile-detail-icon"><Icon size={ICON_SIZE.sm} /></span><div><small>{label}</small><strong>{value}</strong></div></div>)}</div><button className="profile-link-button" type="button">แก้ไขข้อมูลส่วนตัว <ChevronRight size={ICON_SIZE.sm} /></button></section>
          <section className="profile-panel card-surface"><div className="section-heading"><div><span className="mini-icon green"><Award size={ICON_SIZE.sm} /></span><h2>การมีส่วนร่วม</h2></div><span className="profile-period">ปี 2026</span></div><div className="profile-stats">{stats.map(({ label, value, icon: Icon, tone }) => <div className={`profile-stat ${tone}`} key={label}><span><Icon size={ICON_SIZE.sm} /></span><strong>{value}</strong><small>{label}</small></div>)}</div><div className="profile-progress-label"><span>เป้าหมายการดูแลสมาชิก</span><strong>86%</strong></div><div className="profile-progress"><span style={{ width: "86%" }} /></div></section>
        </div>
        <section className="profile-footer card-surface"><div><span className="profile-footer-icon"><ShieldCheck size={ICON_SIZE.md} /></span><div><strong>บัญชีของคุณปลอดภัย</strong><small>ระบบปกป้องข้อมูลและสิทธิ์การเข้าถึงของคุณ</small></div></div><Link href="/" className="profile-logout"><LogOut size={ICON_SIZE.sm} /> ออกจากระบบ</Link></section>
      </div>
    </AppLayout>
  );
}

export { Profile };
