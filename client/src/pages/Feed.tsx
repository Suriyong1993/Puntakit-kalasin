import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  MapPin,
  Plus,
  UsersRound,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListSkeleton } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, type ApiMeta } from "@/lib/api";
import {
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_OPTIONS,
  type FeedActivity,
} from "@/lib/mission-activity";
import type { MissionActivityType } from "@shared/schema";

interface GroupOption {
  id: string;
  name: string;
  area: string | null;
}

interface MemberOption {
  id: string;
  name: string;
  nickname: string | null;
}

const FILTERS: Array<{ value: MissionActivityType | "all"; label: string }> = [
  { value: "all", label: "ทั้งหมด" },
  { value: "house_mission", label: "พันธกิจบ้าน" },
  { value: "bible_study", label: "พระคำ" },
  { value: "prayer", label: "อธิษฐาน" },
  { value: "mission_visit", label: "เยี่ยมเยียน" },
  { value: "testimony", label: "คำพยาน" },
  { value: "outreach", label: "กิจกรรม" },
];

function localDateTimeValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function Feed() {
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [activeType, setActiveType] = useState<MissionActivityType | "all">(
    "all"
  );
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({
    type: "house_mission" as MissionActivityType,
    occurredAt: localDateTimeValue(),
    title: "",
    story: "",
    groupId: "",
    locationText: "",
  });

  useEffect(() => {
    api
      .get<GroupOption[]>("/api/groups")
      .then(setGroups)
      .catch(() => setGroups([]));
    api
      .getWithMeta<MemberOption[]>("/api/members?limit=100")
      .then(response => setMembers(response.data ?? []))
      .catch(() => setMembers([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ limit: "20" });
    if (activeType !== "all") params.set("type", activeType);
    if (selectedGroupId) params.set("groupId", selectedGroupId);

    setIsLoading(true);
    setError("");
    api
      .getWithMeta<FeedActivity[]>(`/api/activities?${params.toString()}`)
      .then(response => {
        if (cancelled) return;
        setActivities(response.data ?? []);
        setMeta(response.meta ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "ไม่สามารถโหลดกิจกรรมได้"
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeType, selectedGroupId, refreshKey]);

  const groupedActivities = useMemo(() => {
    return activities.reduce<Record<string, FeedActivity[]>>(
      (result, activity) => {
        const key = new Intl.DateTimeFormat("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(activity.occurredAt));
        (result[key] ??= []).push(activity);
        return result;
      },
      {}
    );
  }, [activities]);

  async function createActivity(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await api.post<FeedActivity>("/api/activities", {
        ...form,
        occurredAt: new Date(form.occurredAt).toISOString(),
        groupId: form.groupId || null,
        source: "manual",
        visibility: form.groupId ? "group" : "private",
        participants: selectedParticipantIds,
        media: [],
      });
      toast.success("บันทึกกิจกรรมแล้ว รอผู้ดูแลตรวจสอบก่อนเผยแพร่");
      setForm({
        type: "house_mission",
        occurredAt: localDateTimeValue(),
        title: "",
        story: "",
        groupId: "",
        locationText: "",
      });
      setSelectedParticipantIds([]);
      setShowComposer(false);
      setRefreshKey(value => value + 1);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "บันทึกกิจกรรมไม่สำเร็จ"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-[21px] border border-[#E4ECF4] bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2F6FCC]">
              MINISTRY ACTIVITY
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#17324D] sm:text-3xl">
              กิจกรรมพันธกิจ
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7C93]">
              เห็นว่าพันธกิจเกิดอะไรขึ้น เกิดที่ไหน และใครมีส่วนร่วม —
              กิจกรรมใหม่จะรอตรวจสอบก่อนกลายเป็นข้อมูลทางการ
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setShowComposer(value => !value)}
            className="rounded-xl bg-[#2F6FCC] text-white hover:bg-[#173B70]"
          >
            <Plus className="mr-2 h-4 w-4" />
            บันทึกกิจกรรม
          </Button>
        </section>

        {showComposer && (
          <form
            onSubmit={createActivity}
            className="rounded-[21px] border border-[#CFE0F3] bg-[#F7FBFF] p-5 shadow-sm sm:p-7"
          >
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2F6FCC]">
                CAPTURE ONCE
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#17324D]">
                บันทึกเรื่องที่เกิดขึ้นจริง
              </h2>
              <p className="mt-1 text-sm text-[#6B7C93]">
                เริ่มจากเรื่องและบริบทสั้น ๆ ก่อน ไม่ต้องกรอกแบบรายงานยาว
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[#17324D]">
                ประเภทกิจกรรม
                <select
                  value={form.type}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      type: event.target.value as MissionActivityType,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-[#E4ECF4] bg-white px-3 text-sm outline-none focus:border-[#2F6FCC] focus:ring-2 focus:ring-[#2F6FCC]/15"
                >
                  {ACTIVITY_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-[#17324D]">
                วันที่และเวลา
                <input
                  type="datetime-local"
                  value={form.occurredAt}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      occurredAt: event.target.value,
                    }))
                  }
                  required
                  className="h-10 w-full rounded-xl border border-[#E4ECF4] bg-white px-3 text-sm outline-none focus:border-[#2F6FCC] focus:ring-2 focus:ring-[#2F6FCC]/15"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#17324D]">
                หัวข้อ
                <input
                  value={form.title}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  required
                  placeholder="เช่น พันธกิจบ้านแม่กุลวันนี้"
                  className="h-10 w-full rounded-xl border border-[#E4ECF4] bg-white px-3 text-sm outline-none focus:border-[#2F6FCC] focus:ring-2 focus:ring-[#2F6FCC]/15"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#17324D]">
                กลุ่ม
                <select
                  value={form.groupId}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      groupId: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-[#E4ECF4] bg-white px-3 text-sm outline-none focus:border-[#2F6FCC] focus:ring-2 focus:ring-[#2F6FCC]/15"
                >
                  <option value="">ยังไม่ระบุกลุ่ม</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                      {group.area ? ` · ${group.area}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-[#17324D] md:col-span-2">
                สถานที่
                <input
                  value={form.locationText}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      locationText: event.target.value,
                    }))
                  }
                  placeholder="เช่น บ้านแม่กุล หรือ ตลาดสดเมืองกาฬสินธุ์"
                  className="h-10 w-full rounded-xl border border-[#E4ECF4] bg-white px-3 text-sm outline-none focus:border-[#2F6FCC] focus:ring-2 focus:ring-[#2F6FCC]/15"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#17324D] md:col-span-2">
                ผู้มีส่วนร่วม
                <select
                  multiple
                  value={selectedParticipantIds}
                  onChange={event =>
                    setSelectedParticipantIds(
                      Array.from(
                        event.target.selectedOptions,
                        option => option.value
                      )
                    )
                  }
                  className="min-h-28 w-full rounded-xl border border-[#E4ECF4] bg-white px-3 py-2 text-sm outline-none focus:border-[#2F6FCC] focus:ring-2 focus:ring-[#2F6FCC]/15"
                  aria-label="เลือกผู้มีส่วนร่วมในกิจกรรม"
                >
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                      {member.nickname ? ` (${member.nickname})` : ""}
                    </option>
                  ))}
                </select>
                <span className="block text-xs font-normal text-[#6B7C93]">
                  กด Ctrl หรือ Command เพื่อเลือกหลายคน
                </span>
              </label>
              <label className="space-y-2 text-sm font-medium text-[#17324D] md:col-span-2">
                เรื่องราว
                <Textarea
                  value={form.story}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      story: event.target.value,
                    }))
                  }
                  required
                  rows={4}
                  placeholder="วันนี้ได้พบใคร ทำอะไร และมีสิ่งไหนที่ควรติดตามต่อ"
                  className="rounded-xl border-[#E4ECF4] bg-white"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowComposer(false)}
                className="rounded-xl"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-[#173B70] text-white hover:bg-[#2F6FCC]"
              >
                {isSaving ? "กำลังบันทึก..." : "ส่งตรวจสอบ"}
              </Button>
            </div>
          </form>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map(filter => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveType(filter.value)}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                    activeType === filter.value
                      ? "border-[#2F6FCC] bg-[#2F6FCC] text-white"
                      : "border-[#E4ECF4] bg-white text-[#6B7C93] hover:border-[#A8C7E8] hover:text-[#173B70]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <select
              value={selectedGroupId}
              onChange={event => setSelectedGroupId(event.target.value)}
              aria-label="กรองตามกลุ่ม"
              className="h-10 rounded-xl border border-[#E4ECF4] bg-white px-3 text-xs text-[#17324D] outline-none focus:border-[#2F6FCC]"
            >
              <option value="">ทุกกลุ่ม</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <ListSkeleton count={4} />
          ) : error ? (
            <div className="rounded-[18px] border border-red-100 bg-red-50 p-8 text-center text-sm text-red-700">
              {error}
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-[21px] border border-dashed border-[#BFD3E8] bg-white p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5FC] text-[#2F6FCC]">
                <ImageIcon className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-base font-bold text-[#17324D]">
                ยังไม่มีกิจกรรมที่เผยแพร่
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7C93]">
                เริ่มจากบันทึกสิ่งที่เกิดขึ้นจริง
                แล้วให้ผู้นำตรวจสอบก่อนเผยแพร่เป็นกิจกรรมทางการ
              </p>
            </div>
          ) : (
            <div className="space-y-7">
              {Object.entries(groupedActivities).map(([day, dayActivities]) => (
                <div key={day} className="space-y-3">
                  <h2 className="px-1 text-sm font-bold text-[#6B7C93]">
                    {day}
                  </h2>
                  {dayActivities.map(activity => (
                    <FeedCard key={activity.id} activity={activity} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {meta && meta.total > activities.length && (
            <p className="text-center text-xs text-[#6B7C93]">
              แสดง {activities.length} จาก {meta.total} กิจกรรม
            </p>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function FeedCard({ activity }: { activity: FeedActivity }) {
  const heroMedia = activity.media.find(item => item.type === "image");
  const participantNames = activity.participants
    .slice(0, 3)
    .map(participant => participant.name)
    .join(" · ");

  return (
    <article className="overflow-hidden rounded-[21px] border border-[#E4ECF4] bg-white shadow-sm transition-shadow hover:shadow-md">
      {heroMedia && (
        <Link href={`/activities/${activity.id}`} className="block">
          <img
            src={heroMedia.url}
            alt={heroMedia.caption || activity.title}
            className="h-56 w-full object-cover sm:h-72"
            loading="lazy"
          />
        </Link>
      )}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF5FC] text-xl">
              {ACTIVITY_TYPE_ICONS[activity.type]}
            </div>
            <div className="min-w-0">
              <Link
                href={`/activities/${activity.id}`}
                className="text-base font-bold text-[#17324D] hover:text-[#2F6FCC]"
              >
                {activity.title}
              </Link>
              <p className="mt-1 text-xs text-[#6B7C93]">
                {activity.creatorName || "ทีมพันธกิจ"} ·{" "}
                {ACTIVITY_TYPE_LABELS[activity.type]}
              </p>
            </div>
          </div>
          {activity.status === "published" && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ECF9F2] px-2.5 py-1 text-[11px] font-semibold text-[#218B5A]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              ยืนยันแล้ว
            </span>
          )}
        </div>

        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#38516B]">
          {activity.story}
        </p>

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#EEF3F8] pt-4 text-xs text-[#6B7C93]">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {new Intl.DateTimeFormat("th-TH", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(activity.occurredAt))}
          </span>
          {(activity.groupName || activity.groupArea) && (
            <span className="inline-flex items-center gap-1.5">
              <UsersRound className="h-3.5 w-3.5" />
              {activity.groupName || activity.groupArea}
            </span>
          )}
          {activity.locationText && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {activity.locationText}
            </span>
          )}
          {activity.participants.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <UsersRound className="h-3.5 w-3.5" />
              {activity.participants.length} คน
              {participantNames ? ` · ${participantNames}` : ""}
            </span>
          )}
          <span className="ml-auto text-[#2F6FCC]">ดูรายละเอียด →</span>
        </div>
      </div>
    </article>
  );
}
