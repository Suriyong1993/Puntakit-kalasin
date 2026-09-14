import { dashboardSnapshot, members } from "../data/mockData";
import type { ChurchMember, DashboardSnapshot } from "../types/puntakit";

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  return dashboardSnapshot;
}

export async function listMembers(query = ""): Promise<ChurchMember[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return members;
  return members.filter((member) => [member.name, member.role, member.group, member.area, member.status].some((field) => field.toLowerCase().includes(normalized)));
}

export async function searchChurchContent(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const content = [
    ...dashboardSnapshot.activities.map((item) => ({ type: "กิจกรรม", title: item.title, meta: item.meta, href: "/" })),
    ...dashboardSnapshot.journey.map((item) => ({ type: "การสร้างสาวก", title: item.title, meta: item.detail, href: "/" })),
    ...members.map((member) => ({ type: "สมาชิก", title: member.name, meta: `${member.area} · ${member.group}`, href: "/members" })),
  ];
  return content.filter((item) => `${item.title} ${item.meta} ${item.type}`.toLowerCase().includes(normalized)).slice(0, 6);
}
