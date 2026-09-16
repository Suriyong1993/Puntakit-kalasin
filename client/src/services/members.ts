import type {
  AreaOption,
  FollowUpStatus,
  GroupOption,
  MemberInput,
  MemberRecord,
  PaginatedMembers,
  SpiritualStatus,
} from "@/types/database";
import { getSupabaseClient } from "./supabase";

const MEMBER_SELECT = `
  id, full_name, nickname, phone, avatar_url, gender, birth_date, address,
  village, subdistrict, district, province, area_id, group_id, role,
  spiritual_status, follow_up_status, joined_at, last_contact_at, notes,
  active, created_at, updated_at,
  area:areas(id, name),
  group:ministry_groups(id, name)
`;

export type MemberListFilters = {
  query?: string;
  areaId?: string;
  groupId?: string;
  followUpStatus?: FollowUpStatus;
  spiritualStatus?: SpiritualStatus;
  active?: boolean;
  page?: number;
  pageSize?: number;
};

function normalizeNullable(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toPayload(input: MemberInput): MemberInput {
  return {
    ...input,
    full_name: input.full_name.trim(),
    nickname: normalizeNullable(input.nickname),
    phone: normalizeNullable(input.phone),
    address: normalizeNullable(input.address),
    village: normalizeNullable(input.village),
    subdistrict: normalizeNullable(input.subdistrict),
    district: normalizeNullable(input.district),
    province: normalizeNullable(input.province),
    area_id: input.area_id || null,
    group_id: input.group_id || null,
    notes: normalizeNullable(input.notes),
    birth_date: input.birth_date || null,
    last_contact_at: input.last_contact_at || null,
  };
}

function readableError(error: { message?: string } | null): Error {
  return new Error(error?.message || "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองอีกครั้ง");
}

export const memberService = {
  async list(filters: MemberListFilters = {}): Promise<PaginatedMembers> {
    const client = getSupabaseClient();
    const page = Math.max(filters.page ?? 0, 0);
    const pageSize = Math.min(Math.max(filters.pageSize ?? 12, 1), 100);
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = client
      .from("members")
      .select(MEMBER_SELECT, { count: "exact" })
      .order("joined_at", { ascending: false })
      .order("full_name", { ascending: true })
      .range(from, to);

    if (filters.query?.trim()) {
      query = query.ilike("full_name", `%${filters.query.trim()}%`);
    }
    if (filters.areaId) query = query.eq("area_id", filters.areaId);
    if (filters.groupId) query = query.eq("group_id", filters.groupId);
    if (filters.followUpStatus) query = query.eq("follow_up_status", filters.followUpStatus);
    if (filters.spiritualStatus) query = query.eq("spiritual_status", filters.spiritualStatus);
    if (filters.active !== undefined) query = query.eq("active", filters.active);

    const { data, error, count } = await query;
    if (error) throw readableError(error);

    return {
      data: (data ?? []) as unknown as MemberRecord[],
      count: count ?? 0,
    };
  },

  async create(input: MemberInput): Promise<MemberRecord> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("members")
      .insert(toPayload(input))
      .select(MEMBER_SELECT)
      .single();

    if (error) throw readableError(error);
    return data as unknown as MemberRecord;
  },

  async update(id: string, input: MemberInput): Promise<MemberRecord> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("members")
      .update(toPayload(input))
      .eq("id", id)
      .select(MEMBER_SELECT)
      .single();

    if (error) throw readableError(error);
    return data as unknown as MemberRecord;
  },

  async setActive(id: string, active: boolean): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from("members").update({ active }).eq("id", id);
    if (error) throw readableError(error);
  },
};

export const referenceService = {
  async listAreas(): Promise<AreaOption[]> {
    const { data, error } = await getSupabaseClient()
      .from("areas")
      .select("id, name, code")
      .eq("active", true)
      .order("name");
    if (error) throw readableError(error);
    return data ?? [];
  },

  async listGroups(areaId?: string): Promise<GroupOption[]> {
    let query = getSupabaseClient()
      .from("ministry_groups")
      .select("id, name, area_id, status")
      .eq("status", "active")
      .order("name");
    if (areaId) query = query.eq("area_id", areaId);
    const { data, error } = await query;
    if (error) throw readableError(error);
    return data ?? [];
  },
};
