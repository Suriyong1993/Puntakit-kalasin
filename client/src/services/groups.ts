import type { AreaOption, GroupOption } from "@/types/database";
import { getSupabaseClient } from "./supabase";

export type MinistryGroup = GroupOption & {
  location: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  notes: string | null;
  area?: { id: string; name: string } | null;
};

export const groupService = {
  async list(): Promise<MinistryGroup[]> {
    const { data, error } = await getSupabaseClient().from("ministry_groups").select("id, name, area_id, status, location, meeting_day, meeting_time, notes, area:areas(id, name)").order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as MinistryGroup[];
  },
  async create(input: { name: string; area_id: string; meeting_day?: string; meeting_time?: string; location?: string; notes?: string }) {
    const { data, error } = await getSupabaseClient().from("ministry_groups").insert({ ...input, status: "active" }).select("id, name, area_id, status, location, meeting_day, meeting_time, notes, area:areas(id, name)").single();
    if (error) throw new Error(error.message);
    return data as unknown as MinistryGroup;
  },
  async update(id: string, input: { name: string; area_id: string; status: GroupOption["status"]; meeting_day?: string; meeting_time?: string; location?: string; notes?: string }) {
    const { data, error } = await getSupabaseClient().from("ministry_groups").update(input).eq("id", id).select("id, name, area_id, status, location, meeting_day, meeting_time, notes, area:areas(id, name)").single();
    if (error) throw new Error(error.message);
    return data as unknown as MinistryGroup;
  },
  async areas(): Promise<AreaOption[]> {
    const { data, error } = await getSupabaseClient().from("areas").select("id, name, code").eq("active", true).order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
