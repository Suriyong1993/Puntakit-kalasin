import type { MinistryReport, ReportStatus } from "@/types/database";
import { getSupabaseClient } from "./supabase";

export type ReportInput = {
  group_id: string;
  report_date: string;
  participants_count: number;
  new_visitors: number;
  new_believers: number;
  activities?: string;
  sermon_topic?: string;
  bible_verse?: string;
  received?: string;
  application?: string;
  prayer_requests?: string;
  notes?: string;
  status: ReportStatus;
};

const REPORT_SELECT = "id, group_id, report_date, participants_count, new_visitors, new_believers, activities, sermon_topic, bible_verse, received, application, prayer_requests, notes, status, created_at, updated_at, group:ministry_groups(id, name)";

export const reportService = {
  async list(): Promise<MinistryReport[]> {
    const { data, error } = await getSupabaseClient().from("ministry_reports").select(REPORT_SELECT).order("report_date", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as MinistryReport[];
  },
  async create(input: ReportInput): Promise<MinistryReport> {
    const { data, error } = await getSupabaseClient().from("ministry_reports").insert(input).select(REPORT_SELECT).single();
    if (error) throw new Error(error.message);
    return data as unknown as MinistryReport;
  },
};
