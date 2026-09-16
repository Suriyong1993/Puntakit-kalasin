export type AppRole =
  | "super_admin"
  | "admin"
  | "area_leader"
  | "ministry_leader"
  | "group_leader"
  | "member"
  | "viewer";

export type FollowUpStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "stable"
  | "needs_attention"
  | "inactive";

export type SpiritualStatus =
  | "visitor"
  | "interested"
  | "new_believer"
  | "member"
  | "leader"
  | "volunteer";

export type MemberStatus = "active" | "inactive";

export type CurrentProfile = {
  id: string;
  display_name: string;
  email: string | null;
  role: AppRole;
  active: boolean;
};

export type AreaOption = {
  id: string;
  name: string;
  code: string;
};

export type GroupOption = {
  id: string;
  name: string;
  area_id: string;
  status: "active" | "inactive" | "pending" | "closed";
};

export type MemberRecord = {
  id: string;
  full_name: string;
  nickname: string | null;
  phone: string | null;
  avatar_url: string | null;
  gender: "male" | "female" | "other" | "unspecified" | null;
  birth_date: string | null;
  address: string | null;
  village: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  area_id: string | null;
  group_id: string | null;
  role: string;
  spiritual_status: SpiritualStatus;
  follow_up_status: FollowUpStatus;
  joined_at: string;
  last_contact_at: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  area?: Pick<AreaOption, "id" | "name"> | null;
  group?: Pick<GroupOption, "id" | "name"> | null;
};

export type MemberInput = {
  full_name: string;
  nickname?: string | null;
  phone?: string | null;
  gender?: "male" | "female" | "other" | "unspecified" | null;
  birth_date?: string | null;
  address?: string | null;
  village?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  area_id?: string | null;
  group_id?: string | null;
  role: string;
  spiritual_status: SpiritualStatus;
  follow_up_status: FollowUpStatus;
  joined_at: string;
  last_contact_at?: string | null;
  notes?: string | null;
};

export type ReportStatus = "draft" | "submitted" | "reviewed" | "approved" | "returned";

export type MinistryReport = {
  id: string;
  group_id: string;
  report_date: string;
  participants_count: number;
  new_visitors: number;
  new_believers: number;
  activities: string | null;
  sermon_topic: string | null;
  bible_verse: string | null;
  received: string | null;
  application: string | null;
  prayer_requests: string | null;
  notes: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  group?: { id: string; name: string } | null;
};

export type PaginatedMembers = {
  data: MemberRecord[];
  count: number;
};

/**
 * Minimal typed Supabase model for the tables queried by the first production
 * slice. Expand it as each feature is wired to the migration.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: CurrentProfile & {
          avatar_url: string | null;
          phone: string | null;
          area_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<CurrentProfile> & { id: string; display_name: string };
        Update: Partial<CurrentProfile>;
        Relationships: [];
      };
      areas: {
        Row: AreaOption & {
          description: string | null;
          leader_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<AreaOption> & { name: string; code: string };
        Update: Partial<AreaOption>;
        Relationships: [];
      };
      ministry_groups: {
        Row: GroupOption & {
          leader_id: string | null;
          coordinator_id: string | null;
          meeting_day: string | null;
          meeting_time: string | null;
          location: string | null;
          village: string | null;
          subdistrict: string | null;
          district: string | null;
          province: string | null;
          latitude: number | null;
          longitude: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<GroupOption> & {
          name: string;
          area_id: string;
          meeting_day?: string;
          meeting_time?: string;
          location?: string;
          notes?: string;
        };
        Update: Partial<GroupOption> & {
          meeting_day?: string;
          meeting_time?: string;
          location?: string;
          notes?: string;
        };
        Relationships: [];
      };
      members: {
        Row: MemberRecord;
        Insert: MemberInput;
        Update: Partial<MemberInput> & { active?: boolean };
        Relationships: [];
      };
      ministry_reports: {
        Row: MinistryReport;
        Insert: {
          group_id: string;
          report_date: string;
          participants_count: number;
          new_visitors: number;
          new_believers: number;
          activities?: string | null;
          sermon_topic?: string | null;
          bible_verse?: string | null;
          received?: string | null;
          application?: string | null;
          prayer_requests?: string | null;
          notes?: string | null;
          status: ReportStatus;
        };
        Update: Partial<{
          participants_count: number;
          new_visitors: number;
          new_believers: number;
          activities: string | null;
          sermon_topic: string | null;
          bible_verse: string | null;
          received: string | null;
          application: string | null;
          prayer_requests: string | null;
          notes: string | null;
          status: ReportStatus;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      follow_up_status: FollowUpStatus;
      spiritual_status: SpiritualStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
