import { BarChart3, Building2, CalendarDays, Church, Heart, Megaphone, Sparkles, Users } from "lucide-react";
import type { ChurchMember, DashboardSnapshot, NavItem } from "../types/puntakit";
import { LayoutDashboard, FileText, Music2, Settings } from "lucide-react";

export const navItems: NavItem[] = [
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

export const dashboardSnapshot: DashboardSnapshot = {
  stats: [
    { id: "members", label: "สมาชิกทั้งหมด", value: 344, suffix: "คน", trend: "↑ +12", detail: "จากเดือนที่แล้ว", tone: "blue", icon: Users, href: "/members" },
    { id: "groups", label: "เข้าร่วมกลุ่ม", value: 210, suffix: "คน", trend: "61%", detail: "ของสมาชิกทั้งหมด", tone: "green", icon: Sparkles, href: "/groups" },
    { id: "attendance", label: "มาคริสตจักร", value: 178, suffix: "คน", trend: "52%", detail: "จากสัปดาห์ที่แล้ว", tone: "orange", icon: Church, href: "/church" },
    { id: "new-believers", label: "รับเชื่อใหม่", value: 28, suffix: "คน", trend: "↑ +6", detail: "ในปีนี้", tone: "purple", icon: Heart, href: "/ministries" },
  ],
  journey: [
    { id: "meet", number: "01", title: "พบคน", detail: "สร้างความสัมพันธ์", description: "เริ่มจากการมองเห็น ฟัง และอยู่เคียงข้างผู้คน", tone: "mint", icon: Users, count: 132 },
    { id: "share", number: "02", title: "ประกาศ", detail: "ข่าวประเสริฐ", description: "แบ่งปันความหวังด้วยภาษาที่จริงใจและเข้าใจง่าย", tone: "sky", icon: Megaphone, count: 84 },
    { id: "follow-up", number: "03", title: "นำมารับเชื่อ", detail: "และติดตาม", description: "มีคนเดินไปด้วยกันในช่วงเริ่มต้นของความเชื่อ", tone: "lilac", icon: Heart, count: 28 },
    { id: "church", number: "04", title: "มาคริสตจักร", detail: "คริสตจักร", description: "เชื่อมต่อกับครอบครัวใหญ่ของคริสตจักร", tone: "peach", icon: Church, count: 178 },
    { id: "house", number: "05", title: "เข้าสู่พันธกิจบ้าน", detail: "พบปะ / กลุ่ม", description: "เติบโตผ่านวงสนทนาเล็ก ๆ ที่ปลอดภัย", tone: "rose", icon: Building2, count: 210 },
    { id: "grow", number: "06", title: "เติบโต", detail: "เป็นสาวกและนำคนต่อไป", description: "ส่งต่อชีวิตและความหวังให้กับคนข้าง ๆ", tone: "mint", icon: Sparkles, count: 96 },
  ],
  activities: [
    { id: "a1", title: "กลุ่มบ้าน เมือง 1", meta: "มีผู้เข้าร่วม 12 คน", time: "2 ชม. ที่แล้ว", tone: "blue", icon: Users, detail: "วงสนทนาเรื่องการใช้ชีวิตด้วยความหวัง" },
    { id: "a2", title: "ประกาศข่าวประเสริฐ ที่ตลาดสด", meta: "มีผู้ฟัง 28 คน", time: "5 ชม. ที่แล้ว", tone: "orange", icon: Megaphone, detail: "ทีมพันธกิจออกไปพบปะผู้คนในชุมชน" },
    { id: "a3", title: "ผู้รับเชื่อใหม่", meta: "3 คน", time: "1 วันที่แล้ว", tone: "pink", icon: Heart, detail: "เริ่มกระบวนการติดตามและดูแลรายบุคคล" },
    { id: "a4", title: "ประชุมทีมพันธกิจ", meta: "วางแผนเดือนกันยายน", time: "1 วันที่แล้ว", tone: "purple", icon: CalendarDays, detail: "ทบทวนเป้าหมายและแบ่งปันเรื่องราวจากพื้นที่" },
  ],
  distribution: [
    { label: "เมือง 1", value: 132, tone: "blue" }, { label: "เมือง 2", value: 134, tone: "green" }, { label: "สมเด็จ", value: 180, tone: "orange" }, { label: "ท่าคันโท", value: 46, tone: "pink" }, { label: "บัวขาว", value: 37, tone: "purple" }, { label: "คำใหญ่", value: 40, tone: "blue" },
  ],
  status: [
    { label: "มาคริสตจักร", value: 300, target: 1350, tone: "blue", icon: Church },
    { label: "พันธกิจบ้าน", value: 1050, target: 1350, tone: "green", icon: Building2 },
  ],
  goal: { current: 569, target: 1050, label: "พันธกิจบ้าน" },
};

export const members: ChurchMember[] = [
  { id: "m1", name: "กนกวรรณ ใจดี", role: "ผู้นำกลุ่มบ้าน", group: "เมือง 1 / บ้านอบอุ่น", area: "เมือง 1", status: "เติบโตดี", avatar: "ก", lastSeen: "วันนี้ 09:42" },
  { id: "m2", name: "ธนกฤต แสงทอง", role: "สมาชิก", group: "เมือง 2 / เดินไปด้วยกัน", area: "เมือง 2", status: "ติดตามอยู่", avatar: "ธ", lastSeen: "เมื่อวาน 18:20" },
  { id: "m3", name: "พิมพ์ชนก มั่นคง", role: "สมาชิกใหม่", group: "ยังไม่เข้ากลุ่ม", area: "สมเด็จ", status: "รอติดตาม", avatar: "พ", lastSeen: "12 ก.ย. 2026" },
  { id: "m4", name: "ศุภชัย เติบโต", role: "ผู้รับใช้", group: "บ้านแห่งความหวัง", area: "ท่าคันโท", status: "เติบโตดี", avatar: "ศ", lastSeen: "วันนี้ 08:15" },
];
