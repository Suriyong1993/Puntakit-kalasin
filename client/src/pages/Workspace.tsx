import { BookOpen, Building2, CalendarDays, Church, FileBarChart, Megaphone, Settings, ShieldAlert, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { isSupabaseConfigured } from "@/services/supabase";
import { ICON_SIZE } from "@/lib/icon-sizes";

const pages: Record<string, { title: string; eyebrow: string; description: string; icon: typeof Megaphone; next: string }> = {
  "/announcements": { title: "การประกาศ", eyebrow: "CHURCH COMMUNICATION", description: "พื้นที่สำหรับร่าง ตรวจสอบ และเผยแพร่ข่าวสารของคริสตจักร", icon: Megaphone, next: "ประกาศจะเชื่อมกับตาราง announcements และสิทธิ์การเผยแพร่ในฐานข้อมูล" },
  "/worship": { title: "การนมัสการ", eyebrow: "WORSHIP & SERVICE", description: "จัดตารางนมัสการ เพลง พระวจนะ และทีมผู้รับใช้", icon: Church, next: "โครงสร้างกิจกรรมพร้อมรองรับตารางนมัสการในเฟสถัดไป" },
  "/church": { title: "คริสตจักร", eyebrow: "CHURCH PROFILE", description: "ข้อมูลวิสัยทัศน์ พันธกิจ ผู้นำ พื้นที่ และเวลานมัสการ", icon: Building2, next: "ข้อมูลคริสตจักรจะถูกจัดเก็บเป็นค่าระบบที่แก้ไขได้โดยผู้ดูแล" },
  "/ministries": { title: "พันธกิจ", eyebrow: "MINISTRY CATALOG", description: "จัดหมวดหมู่พันธกิจ ผู้นำ ตาราง และกิจกรรมที่เกี่ยวข้อง", icon: Sparkles, next: "ใช้กลุ่มพันธกิจและกิจกรรมจากฐานข้อมูลเป็นแกนกลาง" },
  "/media": { title: "สื่อ / เอกสาร", eyebrow: "MEDIA LIBRARY", description: "ค้นหาและจัดการเอกสาร แบบฟอร์ม รูปภาพ และสื่ออบรม", icon: BookOpen, next: "ตาราง media พร้อมเชื่อม storage และสิทธิ์การเข้าถึง" },
  "/settings": { title: "ตั้งค่า", eyebrow: "SYSTEM SETTINGS", description: "บัญชี ผู้ใช้งาน บทบาท พื้นที่ และการแจ้งเตือน", icon: Settings, next: "การจัดการผู้ใช้และบทบาทจะเปิดเฉพาะ super_admin และ admin" },
};

export default function Workspace() {
 const [location] = useLocation(); const page = pages[location] ?? pages["/church"]; const Icon = page.icon;
 return <AppLayout><div className="workspace-page"><div className="page-heading"><div><span className="eyebrow blue-eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.description}</p></div>{location === "/announcements" && <Link className="primary-action" href="/profile">ดูสิทธิ์การเผยแพร่</Link>}</div><section className="workspace-hero card-surface"><div className="workspace-icon"><Icon size={ICON_SIZE["2xl"]}/></div><div><h2>{isSupabaseConfigured ? "พร้อมเชื่อมต่อข้อมูลจริง" : "เตรียมพื้นที่สำหรับข้อมูลจริง"}</h2><p>{page.next}</p></div></section><div className="workspace-cards"><article className="workspace-card card-surface"><CalendarDays size={ICON_SIZE.lg}/><h3>โครงสร้างพร้อมใช้งาน</h3><p>ใช้ข้อมูลจาก Supabase และ Row Level Security เมื่อมีการตั้งค่าระบบ</p></article><article className="workspace-card card-surface"><FileBarChart size={ICON_SIZE.lg}/><h3>ทำงานร่วมกับรายงาน</h3><p>เชื่อมต่อข้อมูลกับสมาชิก กลุ่มพันธกิจ และรายงานประจำสัปดาห์</p></article><article className="workspace-card card-surface"><ShieldAlert size={ICON_SIZE.lg}/><h3>ไม่สร้างข้อมูลปลอม</h3><p>เมื่อยังไม่มีข้อมูล ระบบจะแสดงสถานะว่างแทนการคาดเดาตัวเลข</p></article></div></div></AppLayout>;
}
