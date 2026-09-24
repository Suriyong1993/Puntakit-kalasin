import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Archive,
  CheckCircle2,
  Clock3,
  MapPin,
  UsersRound,
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListSkeleton } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import {
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_LABELS,
  formatActivityDate,
  type FeedActivity,
} from "@/lib/mission-activity";
import { useAuth } from "@/contexts/AuthContext";

const OPERATIONAL_ROLES = new Set([
  "super_admin",
  "admin",
  "staff",
  "ministry_leader",
  "group_leader",
]);

export default function ActivityDetail() {
  const [, params] = useRoute("/activities/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activity, setActivity] = useState<FeedActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    api
      .get<FeedActivity>(`/api/activities/${params.id}`)
      .then(setActivity)
      .catch((err: unknown) =>
        setError(
          err instanceof ApiError ? err.message : "ไม่สามารถโหลดกิจกรรมได้"
        )
      )
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  async function mutate(action: "publish" | "archive") {
    if (!activity) return;
    setIsMutating(true);
    try {
      const updated = await api.post<FeedActivity>(
        `/api/activities/${activity.id}/${action}`
      );
      setActivity(updated);
      toast.success(
        action === "publish" ? "เผยแพร่กิจกรรมแล้ว" : "เก็บกิจกรรมถาวรแล้ว"
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setIsMutating(false);
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <ListSkeleton count={3} />
      </AppLayout>
    );
  }

  if (error || !activity) {
    return (
      <AppLayout>
        <div className="rounded-[21px] border border-red-100 bg-red-50 p-10 text-center text-sm text-red-700">
          {error || "ไม่พบกิจกรรมที่ต้องการดู"}
          <div className="mt-4">
            <Link href="/feed" className="font-semibold text-[#2F6FCC]">
              กลับไปดูกิจกรรม
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const canReview = Boolean(user && OPERATIONAL_ROLES.has(user.role));

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-5">
        <button
          type="button"
          onClick={() => navigate("/feed")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#2F6FCC] hover:text-[#173B70]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปที่กิจกรรม
        </button>

        <article className="overflow-hidden rounded-[21px] border border-[#E4ECF4] bg-white shadow-sm">
          {activity.media.length > 0 && (
            <div className="grid gap-1 sm:grid-cols-2">
              {activity.media.map(media =>
                media.type === "image" ? (
                  <img
                    key={media.id}
                    src={media.url}
                    alt={media.caption || activity.title}
                    className="h-64 w-full object-cover sm:h-80"
                  />
                ) : (
                  <a
                    key={media.id}
                    href={media.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-64 items-center justify-center bg-[#F4F8FC] text-sm font-semibold text-[#2F6FCC]"
                  >
                    เปิดสื่อประกอบ
                  </a>
                )
              )}
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF5FC] text-2xl">
                  {ACTIVITY_TYPE_ICONS[activity.type]}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2F6FCC]">
                    {ACTIVITY_TYPE_LABELS[activity.type]}
                  </p>
                  <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#17324D]">
                    {activity.title}
                  </h1>
                  <p className="mt-2 text-sm text-[#6B7C93]">
                    โดย {activity.creatorName || "ทีมพันธกิจ"} ·{" "}
                    {formatActivityDate(activity.occurredAt)}
                  </p>
                </div>
              </div>
              {activity.status === "published" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECF9F2] px-3 py-1.5 text-xs font-semibold text-[#218B5A]">
                  <CheckCircle2 className="h-4 w-4" />
                  ยืนยันแล้ว
                </span>
              )}
            </div>

            <p className="mt-7 whitespace-pre-line text-base leading-8 text-[#38516B]">
              {activity.story}
            </p>

            <div className="mt-7 grid gap-3 border-t border-[#EEF3F8] pt-5 sm:grid-cols-2">
              {activity.groupName && (
                <InfoRow
                  icon={<UsersRound className="h-4 w-4" />}
                  label="กลุ่ม"
                  value={activity.groupName}
                />
              )}
              {activity.locationText && (
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="สถานที่"
                  value={activity.locationText}
                />
              )}
              <InfoRow
                icon={<Clock3 className="h-4 w-4" />}
                label="สถานะ"
                value={
                  activity.status === "published" ? "เผยแพร่แล้ว" : "รอตรวจสอบ"
                }
              />
              {activity.participants.length > 0 && (
                <InfoRow
                  icon={<UsersRound className="h-4 w-4" />}
                  label="ผู้มีส่วนร่วม"
                  value={activity.participants
                    .map(participant => participant.name)
                    .join(" · ")}
                />
              )}
            </div>

            {canReview && activity.status !== "archived" && (
              <div className="mt-7 flex flex-wrap justify-end gap-2 border-t border-[#EEF3F8] pt-5">
                {activity.status !== "published" && (
                  <Button
                    type="button"
                    disabled={isMutating}
                    onClick={() => mutate("publish")}
                    className="rounded-xl bg-[#27AE72] text-white hover:bg-[#218B5A]"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    ยืนยันและเผยแพร่
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isMutating}
                  onClick={() => mutate("archive")}
                  className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  เก็บถาวร
                </Button>
              </div>
            )}
          </div>
        </article>
      </div>
    </AppLayout>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-[#F7FAFD] p-3.5">
      <span className="mt-0.5 text-[#2F6FCC]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#6B7C93]">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-[#17324D]">
          {value}
        </p>
      </div>
    </div>
  );
}
