import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  HeartHandshake,
  Megaphone,
  Plus,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { ICON_SIZE } from "@/lib/icon-sizes";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentMember {
  id: string;
  name: string;
  nickname: string | null;
  role: string;
  area: string | null;
  status: string;
  joinedAt: string;
}

interface RecentAnnouncement {
  id: string;
  title: string;
  publishDate: string;
  status: string;
}

interface DashboardSummary {
  totalMembers: number;
  newThisMonth: number;
  needFollowUp: number;
  followedUp: number;
  activeMembers: number;
  recentMembers?: RecentMember[];
  recentAnnouncements?: RecentAnnouncement[];
}

interface CareGroup {
  id: string;
  name: string;
  status: string;
  memberCount?: number;
}

interface ChurchEvent {
  id: string;
  title: string;
  eventDate: string;
  category: string;
  status: string;
}

// Discipleship Journey Steps (single blue-family palette per design.md — avoid rainbow)
const journeySteps = [
  { n: "1", title: "พบคน", detail: "สร้างความสัมพันธ์และมิตรภาพ", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { n: "2", title: "ประกาศ", detail: "แบ่งปันข่าวประเสริฐด้วยความรัก", icon: Megaphone, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { n: "3", title: "นำรับเชื่อ", detail: "ต้อนรับและติดตามดูแลใกล้ชิด", icon: Heart, color: "text-blue-700 bg-blue-50 border-blue-200" },
  { n: "4", title: "นมัสการ", detail: "ร่วมสามัคคีธรรมที่คริสตจักร", icon: Building2, color: "text-blue-700 bg-blue-50 border-blue-200" },
  { n: "5", title: "เข้ากลุ่มแคร์", detail: "ผูกพันในครอบครัวแห่งความเชื่อ", icon: UsersRound, color: "text-blue-800 bg-blue-50 border-blue-200" },
  { n: "6", title: "สร้างสาวก", detail: "เติบโตและพร้อมส่งต่อพระพร", icon: Sparkles, color: "text-blue-800 bg-blue-50 border-blue-200" },
];

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [groups, setGroups] = useState<CareGroup[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect member role directly to Member PWA
  useEffect(() => {
    if (user?.role === "member") {
      navigate("/app");
    }
  }, [user, navigate]);

  // Load real data from APIs
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    Promise.allSettled([
      api.get<DashboardSummary>("/api/dashboard/summary"),
      api.get<CareGroup[]>("/api/groups"),
      api.get<ChurchEvent[]>("/api/events"),
    ]).then(([sumRes, grpRes, evtRes]) => {
      if (!mounted) return;
      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
      if (grpRes.status === "fulfilled" && Array.isArray(grpRes.value)) setGroups(grpRes.value);
      if (evtRes.status === "fulfilled" && Array.isArray(evtRes.value)) setEvents(evtRes.value);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const totalMembers = summary?.totalMembers ?? 0;
  const newThisMonth = summary?.newThisMonth ?? 0;
  const activeMembers = summary?.activeMembers ?? 0;
  const followedUp = summary?.followedUp ?? 0;
  const needFollowUp = summary?.needFollowUp ?? 0;
  const activeRatio = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;

  // Chart data from real metrics
  const chartData = useMemo(() => {
    return [
      { name: "สมาชิกทั้งหมด", count: totalMembers, fill: "#3B82F6" },
      { name: "สมาชิกประจำ", count: activeMembers, fill: "#10B981" },
      { name: "ติดตามแล้ว", count: followedUp, fill: "#6366F1" },
      { name: "ต้องติดตาม", count: needFollowUp, fill: "#F59E0B" },
      { name: "มาใหม่เดือนนี้", count: newThisMonth, fill: "#EC4899" },
    ];
  }, [totalMembers, activeMembers, followedUp, needFollowUp, newThisMonth]);

  const activeGroupsCount = groups.filter((g) => g.status === "active").length || groups.length;
  const upcomingEvents = events.filter((e) => e.status === "scheduled").slice(0, 3);

  return (
    <AppLayout>
      {/* Top Welcome & Quick Actions Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <Sparkles size={ICON_SIZE.xs} />
            <span>PUNTAKIT KALASIN DASHBOARD</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            สวัสดีครับ, {user?.name ?? "ทีมงานพันธกิจ"} 👋
          </h1>
          <p className="text-xs text-slate-500">
            ภาพรวมการบริหารสมาชิกและพันธกิจคริสตจักรประจำวัน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/members"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={ICON_SIZE.sm} />
            <span>จัดการสมาชิก</span>
          </Link>
          <Link
            href="/groups"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <UsersRound size={ICON_SIZE.sm} className="text-slate-500" />
            <span>กลุ่มแคร์</span>
          </Link>
        </div>
      </div>

      {/* TailAdmin 4-Card KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Card 1: Total Members */}
        <div className="tailadmin-card p-5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              สมาชิกทั้งหมด
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={ICON_SIZE.md} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-slate-800">{totalMembers.toLocaleString()}</span>
            )}
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600">
              <TrendingUp size={12} />
              +{newThisMonth} คน
            </span>
            <span className="text-slate-400">เพิ่มขึ้นเดือนนี้</span>
          </div>
        </div>

        {/* Card 2: Active Members */}
        <div className="tailadmin-card p-5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              สมาชิกประจำ
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck size={ICON_SIZE.md} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-slate-800">{activeMembers.toLocaleString()}</span>
            )}
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">
              {activeRatio}% ของทั้งหมด
            </span>
            <span className="text-slate-400">ผูกพันต่อเนื่อง</span>
          </div>
        </div>

        {/* Card 3: Followed Up */}
        <div className="tailadmin-card p-5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ติดตามแล้ว
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <HeartHandshake size={ICON_SIZE.md} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-slate-800">{followedUp.toLocaleString()}</span>
            )}
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>ได้รับการดูแลและอภิบาล</span>
          </div>
        </div>

        {/* Card 4: Need Follow-Up */}
        <div className="tailadmin-card p-5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ต้องติดตามดูแล
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle size={ICON_SIZE.md} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-slate-800">{needFollowUp.toLocaleString()}</span>
            )}
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {needFollowUp > 0 ? (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-600">
                ต้องการการเยี่ยมเยียน
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600">
                ดูแลครบถ้วนแล้ว
              </span>
            )}
            <Link href="/members" className="ml-auto text-blue-600 hover:underline">
              ดูรายชื่อ →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + Vision Banner (Left 2/3) & Recent Activity (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Church Vision Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--navy)] to-[var(--blue)] p-6 sm:p-8 text-white shadow-sm">
            <div className="relative z-10 max-w-xl">
              <span className="inline-block rounded-full bg-blue-500/30 px-3 py-1 text-[11px] font-semibold text-blue-300 backdrop-blur-xs mb-3">
                นิมิตและพันธกิจคริสตจักร
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
                1 คน นำ 2 คน
                <span className="block text-amber-300">สู่พระคริสต์ และคริสตจักร</span>
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                "เพราะคริสตจักร คือ บ้านของทุกคน ร่วมสร้างสาวกให้เติบโตในพระวจนะและความรัก"
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
                <Link
                  href="/members"
                  className="rounded-xl bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-400 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus size={ICON_SIZE.xs} />
                  <span>เพิ่มสมาชิกใหม่</span>
                </Link>
                <Link
                  href="/attendance"
                  className="rounded-xl bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-xs inline-flex items-center gap-1.5"
                >
                  <UserCheck size={ICON_SIZE.xs} />
                  <span>เช็คชื่อการเข้าร่วม</span>
                </Link>
              </div>
            </div>
            {/* Background Decorative Pattern */}
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="pointer-events-none absolute right-12 top-6 opacity-15 hidden sm:block">
              <Sparkles size={140} />
            </div>
          </div>

          {/* Member Overview Analytics Chart (TailAdmin Card Style) */}
          <div className="tailadmin-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  ภาพรวมสถานะสมาชิก (Member Distribution)
                </h3>
                <p className="text-xs text-slate-500">
                  ข้อมูลสถิติสมาชิกตามสถานะการติดตามจริงในระบบ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <BarChart3 size={ICON_SIZE.xs} className="text-blue-600" />
                  กลุ่มแคร์ที่เปิด: {activeGroupsCount} กลุ่ม
                </span>
              </div>
            </div>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={{ stroke: "#CBD5E1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      borderRadius: "0.75rem",
                      border: "none",
                      color: "#F8FAFC",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                    }}
                    formatter={(value: any) => [`${value ?? 0} คน`, "จำนวน"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={38} fill="var(--blue)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Recent Members & Announcements */}
        <div className="space-y-6">
          {/* Recent Members List */}
          <div className="tailadmin-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">สมาชิกเข้าใหม่ล่าสุด</h3>
                <p className="text-[11px] text-slate-500">สมาชิกลงทะเบียนล่าสุดในระบบ</p>
              </div>
              <Link href="/members" className="text-xs font-semibold text-blue-600 hover:underline">
                ดูทั้งหมด
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {summary?.recentMembers && summary.recentMembers.length > 0 ? (
                summary.recentMembers.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {m.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {m.name} {m.nickname ? `(${m.nickname})` : ""}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {m.area ? `พื้นที่: ${m.area}` : m.role}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        m.status === "ติดตามแล้ว"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <UserRound size={32} className="mx-auto text-slate-300 mb-2" />
                  <p>ยังไม่มีข้อมูลสมาชิกใหม่</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="tailadmin-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">ข่าวสารและประกาศ</h3>
                <p className="text-[11px] text-slate-500">ประชาสัมพันธ์ของคริสตจักร</p>
              </div>
              <Link href="/announcements" className="text-xs font-semibold text-blue-600 hover:underline">
                ดูทั้งหมด
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {summary?.recentAnnouncements && summary.recentAnnouncements.length > 0 ? (
                summary.recentAnnouncements.map((a) => (
                  <div key={a.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-800 truncate hover:text-blue-600 transition-colors">
                        {a.title}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          a.status === "published"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {a.status === "published" ? "เผยแพร่แล้ว" : "ร่าง"}
                      </span>
                    </div>
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock size={11} />
                      {new Date(a.publishDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Megaphone size={32} className="mx-auto text-slate-300 mb-2" />
                  <p>ยังไม่มีประกาศในขณะนี้</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events Mini Widget */}
          <div className="tailadmin-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">การนมัสการและกิจกรรม</h3>
              <Link href="/events" className="text-xs font-semibold text-blue-600 hover:underline">
                ตารางทั้งหมด
              </Link>
            </div>

            <div className="mt-3 space-y-2">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-semibold text-xs">
                      <CalendarDays size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{e.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(e.eventDate).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-xs text-slate-400">
                  ไม่มีกิจกรรมที่กำหนดไว้ในเร็วๆ นี้
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discipleship Journey (6 Steps) - TailAdmin Modern Grid */}
      <div className="tailadmin-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              6 ขั้นตอนสู่การสร้างสาวก (Discipleship Pathway)
            </h3>
            <p className="text-xs text-slate-500">
              กระบวนการนำผู้คนเข้าสู่พระคุณพระเจ้าและการเติบโตในพันธกิจคริสตจักร
            </p>
          </div>
          <Link
            href="/members"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            <span>ติดตามสมาชิก</span>
            <ChevronRight size={ICON_SIZE.xs} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {journeySteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.n}
                className="relative flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-xs duration-200"
              >
                <span className="absolute top-2.5 left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                  {step.n}
                </span>
                <div className={`mt-2 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border ${step.color}`}>
                  <Icon size={24} />
                </div>
                <h4 className="text-xs font-bold text-slate-800">{step.title}</h4>
                <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">{step.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
