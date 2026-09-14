import type { LucideIcon } from "lucide-react";

export type AccentTone = "blue" | "green" | "orange" | "purple" | "pink";
export type JourneyTone = "mint" | "sky" | "lilac" | "peach" | "rose";

export interface NavItem { label: string; href: string; icon: LucideIcon }
export interface StatMetric { id: string; label: string; value: number; suffix: string; trend: string; detail: string; tone: AccentTone; icon: LucideIcon; href: string }
export interface JourneyStage { id: string; number: string; title: string; detail: string; description: string; tone: JourneyTone; icon: LucideIcon; count: number }
export interface ChurchActivity { id: string; title: string; meta: string; time: string; tone: AccentTone; icon: LucideIcon; detail: string }
export interface DistributionPoint { label: string; value: number; tone: AccentTone }
export interface ChurchStatusMetric { label: string; value: number; target: number; tone: AccentTone; icon: LucideIcon }
export interface ChurchMember { id: string; name: string; role: string; group: string; area: string; status: "ติดตามอยู่" | "เติบโตดี" | "รอติดตาม"; avatar: string; lastSeen: string }
export interface DashboardSnapshot { stats: StatMetric[]; journey: JourneyStage[]; activities: ChurchActivity[]; distribution: DistributionPoint[]; status: ChurchStatusMetric[]; goal: { current: number; target: number; label: string } }
