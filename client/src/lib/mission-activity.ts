import type {
  MissionActivityMediaType,
  MissionActivityStatus,
  MissionActivityType,
  MissionActivityVisibility,
} from "@shared/schema";

export interface FeedParticipant {
  id: string;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
  role: string;
}

export interface FeedMedia {
  id: string;
  type: MissionActivityMediaType;
  url: string;
  caption: string | null;
  sortOrder: number;
}

export interface FeedActivity {
  id: string;
  type: MissionActivityType;
  status: MissionActivityStatus;
  source: string;
  visibility: MissionActivityVisibility;
  occurredAt: string;
  title: string;
  story: string;
  locationText: string | null;
  latitude: string | null;
  longitude: string | null;
  groupId: string | null;
  groupName: string | null;
  groupArea: string | null;
  createdById: string;
  creatorName: string | null;
  verifiedById: string | null;
  verifiedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  participants: FeedParticipant[];
  media: FeedMedia[];
}

export const ACTIVITY_TYPE_LABELS: Record<MissionActivityType, string> = {
  mission_visit: "เยี่ยมเยียน",
  house_mission: "พันธกิจบ้าน",
  bible_study: "พระคำ",
  prayer: "อธิษฐาน",
  worship: "นมัสการ",
  fellowship: "สามัคคีธรรม",
  testimony: "คำพยาน",
  evangelism: "ประกาศ",
  pastoral_visit: "อภิบาล",
  outreach: "ออกพื้นที่",
  ministry_update: "อัปเดตพันธกิจ",
  other: "กิจกรรมอื่น",
};

export const ACTIVITY_TYPE_ICONS: Record<MissionActivityType, string> = {
  mission_visit: "🤝",
  house_mission: "🏠",
  bible_study: "📖",
  prayer: "🙏",
  worship: "🎵",
  fellowship: "☕",
  testimony: "✨",
  evangelism: "📣",
  pastoral_visit: "💛",
  outreach: "🌱",
  ministry_update: "📝",
  other: "•",
};

export const ACTIVITY_TYPE_OPTIONS: Array<{
  value: MissionActivityType;
  label: string;
}> = [
  { value: "house_mission", label: "พันธกิจบ้าน" },
  { value: "bible_study", label: "พระคำ" },
  { value: "prayer", label: "อธิษฐาน" },
  { value: "mission_visit", label: "เยี่ยมเยียน" },
  { value: "testimony", label: "คำพยาน" },
  { value: "outreach", label: "ออกพื้นที่" },
  { value: "worship", label: "นมัสการ" },
  { value: "fellowship", label: "สามัคคีธรรม" },
  { value: "evangelism", label: "ประกาศ" },
  { value: "pastoral_visit", label: "อภิบาล" },
  { value: "ministry_update", label: "อัปเดตพันธกิจ" },
  { value: "other", label: "อื่น ๆ" },
];

export function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatActivityDay(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
