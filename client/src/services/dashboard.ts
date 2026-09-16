import type { FollowUpStatus, MemberRecord } from "@/types/database";
import { getSupabaseClient } from "./supabase";

export type DashboardSnapshot = {
  totalMembers: number;
  groupedMembers: number;
  newBelievers: number;
  careCount: number;
  careQueue: MemberRecord[];
  areas: { label: string; value: number }[];
};

const CARE_STATUSES: FollowUpStatus[] = ["new", "in_progress", "needs_attention"];

export const dashboardService = {
  async snapshot(): Promise<DashboardSnapshot> {
    const client = getSupabaseClient();
    const [total, grouped, believers, care, careQueue, areaMembers] = await Promise.all([
      client.from("members").select("id", { count: "exact", head: true }).eq("active", true),
      client.from("members").select("id", { count: "exact", head: true }).eq("active", true).not("group_id", "is", null),
      client.from("members").select("id", { count: "exact", head: true }).eq("active", true).eq("spiritual_status", "new_believer"),
      client.from("members").select("id", { count: "exact", head: true }).eq("active", true).in("follow_up_status", CARE_STATUSES),
      client.from("members").select("id, full_name, nickname, phone, avatar_url, gender, birth_date, address, village, subdistrict, district, province, area_id, group_id, role, spiritual_status, follow_up_status, joined_at, last_contact_at, notes, active, created_at, updated_at, area:areas(id, name), group:ministry_groups(id, name)").eq("active", true).in("follow_up_status", CARE_STATUSES).order("last_contact_at", { ascending: true, nullsFirst: true }).limit(5),
      client.from("members").select("area:areas(name)").eq("active", true),
    ]);

    const firstError = [total, grouped, believers, care, careQueue, areaMembers].find((result) => result.error)?.error;
    if (firstError) throw new Error(firstError.message);

    const counts = new Map<string, number>();
    const areaRows = (areaMembers.data ?? []) as unknown as Array<{
      area: { name?: string } | null;
    }>;
    for (const record of areaRows) {
      const area = record.area?.name ?? "ยังไม่กำหนดพื้นที่";
      counts.set(area, (counts.get(area) ?? 0) + 1);
    }

    return {
      totalMembers: total.count ?? 0,
      groupedMembers: grouped.count ?? 0,
      newBelievers: believers.count ?? 0,
      careCount: care.count ?? 0,
      careQueue: (careQueue.data ?? []) as unknown as MemberRecord[],
      areas: Array.from(counts.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6),
    };
  },
};
