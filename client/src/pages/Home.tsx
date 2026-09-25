import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  Camera,
  Compass,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  HeartHandshake,
  Inbox as InboxIcon,
  ListTodo,
  MapPin,
  Megaphone,
  Plus,
  Search,
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

interface OperationsSubmission {
  id: string;
  status: string;
  rawText: string | null;
  createdAt: string;
}

interface OperationsFollowUp {
  id: string;
  title: string;
  dueAt: string | null;
  subjectMemberName: string | null;
  subjectGroupName: string | null;
}

interface OperationsInactiveGroup {
  id: string;
  name: string;
}

interface OperationsActivity {
  id: string;
  title: string;
  status: string;
  occurredAt: string;
  groupName: string | null;
}

interface OperationsData {
  pendingSubmissionsCount: number;
  pendingSubmissions: OperationsSubmission[];
  openFollowUpsCount: number;
  overdueFollowUpsCount: number;
  overdueFollowUps: OperationsFollowUp[];
  inactiveGroups: OperationsInactiveGroup[];
  recentActivity: OperationsActivity[];
}

const OPERATIONS_ROLES = ["super_admin", "admin", "staff", "ministry_leader"];

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 850;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{displayValue.toLocaleString()}</>;
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
  const pageRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [groups, setGroups] = useState<CareGroup[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [operations, setOperations] = useState<OperationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canSeeOperations = Boolean(user && OPERATIONS_ROLES.includes(user.role));

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

    const requests: [Promise<DashboardSummary>, Promise<CareGroup[]>, Promise<ChurchEvent[]>, Promise<OperationsData> | Promise<null>] = [
      api.get<DashboardSummary>("/api/dashboard/summary"),
      api.get<CareGroup[]>("/api/groups"),
      api.get<ChurchEvent[]>("/api/events"),
      canSeeOperations ? api.get<OperationsData>("/api/dashboard/operations") : Promise.resolve(null),
    ];

    Promise.allSettled(requests).then(([sumRes, grpRes, evtRes, opsRes]) => {
      if (!mounted) return;
      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
      if (grpRes.status === "fulfilled" && Array.isArray(grpRes.value)) setGroups(grpRes.value);
      if (evtRes.status === "fulfilled" && Array.isArray(evtRes.value)) setEvents(evtRes.value);
      if (opsRes.status === "fulfilled" && opsRes.value) setOperations(opsRes.value);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [canSeeOperations]);

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

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>("[data-scroll-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleSearch = () => {
    const query = searchQuery.trim();
    navigate(query ? `/members?search=${encodeURIComponent(query)}` : "/members");
  };

  return (
    <AppLayout>
      <div ref={pageRef}>
      {/* Reference-inspired discovery hero: search first, prices never appear here. */}
      <section data-scroll-reveal className="discovery-hero mb-7 overflow-hidden rounded-[24px]">
        <div className="discovery-hero-art" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl px-6 py-8 sm:px-10 sm:py-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold tracking-wide text-blue-800 backdrop-blur-sm">
            <Sparkles size={13} /> PUNTAKIT KALASIN
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#173b70] sm:text-[42px]">
            ค้นพบผู้คนและพันธกิจ
            <span className="block text-[#2f6fcc]">ที่กำลังเติบโตไปด้วยกัน</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            สวัสดีครับ {user?.name ?? "ทีมงานพันธกิจ"} — ค้นหาสมาชิก กลุ่มแคร์
            และกิจกรรมของคริสตจักรได้จากที่เดียว
          </p>
          <form
            className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-white/80 bg-white p-2 shadow-[0_12px_30px_rgba(23,59,112,0.12)]"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <Search className="ml-2 shrink-0 text-slate-400" size={20} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              placeholder="ค้นหาชื่อสมาชิก กลุ่ม หรือพื้นที่..."
              aria-label="ค้นหาสมาชิก กลุ่ม หรือพื้นที่"
            />
            <button type="submit" className="rounded-xl bg-[#2f6fcc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#235cb0] active:scale-[.98]">
              ค้นหา
            </button>
          </form>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <MapPin size={ICON_SIZE.xs} />
            <span>สำรวจพื้นที่พันธกิจของคุณ</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">เข้าถึงข้อมูลสำคัญได้อย่างรวดเร็วจากทางลัดด้านล่าง</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/members" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700">
            <UserPlus size={ICON_SIZE.sm} /> จัดการสมาชิก
          </Link>
          <Link href="/groups" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            <UsersRound size={ICON_SIZE.sm} className="text-slate-500" /> กลุ่มแคร์
          </Link>
        </div>
      </div>

      <div data-scroll-reveal className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { href: "/members", icon: Users, title: "สมาชิกของเรา", detail: "ดูแลความสัมพันธ์และการติดตาม", tint: "bg-blue-50 text-blue-700" },
          { href: "/groups", icon: Compass, title: "กลุ่มแคร์", detail: "เชื่อมโยงผู้คนในชุมชน", tint: "bg-emerald-50 text-emerald-700" },
          { href: "/events", icon: BookOpen, title: "กิจกรรมและการนมัสการ", detail: "ดูตารางและสิ่งที่กำลังจะเกิดขึ้น", tint: "bg-amber-50 text-amber-700" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(36,92,146,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(36,92,146,0.1)]">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.tint}`}><Icon size={20} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-800">{item.title}</strong><span className="mt-0.5 block truncate text-[11px] text-slate-500">{item.detail}</span></span>
              <ArrowUpRight size={17} className="shrink-0 text-slate-300 transition group-hover:text-blue-600" />
            </Link>
          );
        })}
      </div>

      {/* Operations: real aggregates over Mission Activity / Follow-up / Mission Inbox —
          what's waiting, what needs attention, what happened. Privileged roles only,
          matching the server-side gate on /api/dashboard/operations. */}
      {canSeeOperations && operations && (
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
            <Link
              href="/inbox"
              className="tailadmin-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                <InboxIcon size={ICON_SIZE.md} />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-slate-800">{operations.pendingSubmissionsCount}</div>
                <div className="text-[11px] text-slate-500 truncate">รอตรวจสอบในกล่องข้อมูลนำเข้า</div>
              </div>
            </Link>

            <Link
              href="/follow-up"
              className="tailadmin-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${
                  operations.overdueFollowUpsCount > 0 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                <ListTodo size={ICON_SIZE.md} />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-slate-800">
                  {operations.openFollowUpsCount}
                  {operations.overdueFollowUpsCount > 0 && (
                    <span className="text-xs font-semibold text-rose-600 ml-1">
                      ({operations.overdueFollowUpsCount} เลยกำหนด)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate">รายการติดตามที่ยังไม่เสร็จ</div>
              </div>
            </Link>

            <Link
              href="/groups"
              className="tailadmin-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 flex-shrink-0">
                <Clock size={ICON_SIZE.md} />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-slate-800">{operations.inactiveGroups.length}</div>
                <div className="text-[11px] text-slate-500 truncate">กลุ่มที่ไม่มีกิจกรรม 14 วันล่าสุด</div>
              </div>
            </Link>
          </div>

          {(operations.recentActivity.length > 0 || operations.overdueFollowUps.length > 0) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {operations.recentActivity.length > 0 && (
                <div className="tailadmin-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Camera size={13} /> กิจกรรมพันธกิจล่าสุด
                    </h3>
                    <Link href="/feed" className="text-[11px] font-semibold text-blue-600 hover:underline">
                      ดูฟีดทั้งหมด
                    </Link>
                  </div>
                  <ul className="space-y-1.5">
                    {operations.recentActivity.slice(0, 4).map((a) => (
                      <li key={a.id} className="text-xs text-slate-600 flex items-center justify-between gap-2">
                        <span className="truncate">{a.title}</span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">{a.groupName ?? "-"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {operations.overdueFollowUps.length > 0 && (
                <div className="tailadmin-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                      <AlertCircle size={13} /> ติดตามเลยกำหนด
                    </h3>
                    <Link href="/follow-up" className="text-[11px] font-semibold text-blue-600 hover:underline">
                      ดูทั้งหมด
                    </Link>
                  </div>
                  <ul className="space-y-1.5">
                    {operations.overdueFollowUps.slice(0, 4).map((f) => (
                      <li key={f.id} className="text-xs text-slate-600 flex items-center justify-between gap-2">
                        <span className="truncate">{f.title}</span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {f.subjectMemberName ?? f.subjectGroupName ?? "-"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
              <span className="text-2xl sm:text-3xl font-bold text-slate-800"><AnimatedNumber value={totalMembers} /></span>
            )}
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600">
              <TrendingUp size={12} />
              +<AnimatedNumber value={newThisMonth} /> คน
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
              <span className="text-2xl sm:text-3xl font-bold text-slate-800"><AnimatedNumber value={activeMembers} /></span>
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
              <span className="text-2xl sm:text-3xl font-bold text-slate-800"><AnimatedNumber value={followedUp} /></span>
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
              <span className="text-2xl sm:text-3xl font-bold text-slate-800"><AnimatedNumber value={needFollowUp} /></span>
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

      {/* Latest activity and important announcements */}
      <section data-scroll-reveal className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="tailadmin-card overflow-hidden border-blue-100">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600"><CalendarDays size={13} /> Activity pulse</span>
              <h2 className="mt-1 text-lg font-bold text-slate-800">กิจกรรมล่าสุด</h2>
              <p className="text-xs text-slate-500">สิ่งที่กำลังเกิดขึ้นในคริสตจักรและกลุ่มแคร์</p>
            </div>
            <Link href="/events" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50">ดูทั้งหมด <ArrowRight size={13} /></Link>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-3 sm:p-5">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
              <Link key={event.id} href="/events" className="group rounded-2xl bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-blue-50">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><CalendarDays size={17} /></div>
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 group-hover:text-blue-700">{event.title}</p>
                <p className="mt-2 text-[11px] text-slate-500">{new Date(event.eventDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </Link>
            )) : <div className="col-span-full rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-400">ยังไม่มีกิจกรรมที่กำหนดไว้</div>}
          </div>
        </div>

        <div className="tailadmin-card overflow-hidden border-amber-100">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600"><Megaphone size={13} /> Keep in touch</span>
              <h2 className="mt-1 text-lg font-bold text-slate-800">ประกาศสำคัญ</h2>
              <p className="text-xs text-slate-500">ข่าวสารที่ทีมงานอยากให้คุณไม่พลาด</p>
            </div>
            <Link href="/announcements" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50">ทั้งหมด <ArrowRight size={13} /></Link>
          </div>
          <div className="divide-y divide-slate-100 px-5 sm:px-6">
            {summary?.recentAnnouncements?.length ? summary.recentAnnouncements.slice(0, 3).map((announcement) => (
              <Link key={announcement.id} href="/announcements" className="group flex items-center gap-3 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Megaphone size={16} /></span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-semibold text-slate-800 group-hover:text-blue-700">{announcement.title}</strong><span className="mt-1 block text-[11px] text-slate-400">{new Date(announcement.publishDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                <ChevronRight size={15} className="shrink-0 text-slate-300 group-hover:text-blue-600" />
              </Link>
            )) : <div className="py-8 text-center text-xs text-slate-400">ยังไม่มีประกาศสำคัญในขณะนี้</div>}
          </div>
        </div>
      </section>

      {/* Main Grid: Chart + Vision Banner (Left 2/3) & Recent Activity (Right 1/3) */}
      <div data-scroll-reveal className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
      <div data-scroll-reveal className="tailadmin-card p-6 mb-6">
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
      </div>
    </AppLayout>
  );
}
