import { z } from "zod";

export const memberInputSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง").max(200).optional().or(z.literal("")),
  role: z.string().trim().min(1).max(100).default("สมาชิก"),
  area: z.string().trim().max(200).optional().or(z.literal("")),
  group: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["ติดตามแล้ว", "ต้องติดตาม"]).default("ต้องติดตาม"),
  joinedAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type MemberInput = z.infer<typeof memberInputSchema>;

export const announcementInputSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อ").max(300),
  content: z.string().trim().min(1, "กรุณากรอกเนื้อหา").max(10000),
  publishDate: z.coerce.date().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

export const eventInputSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกชื่องาน").max(300),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  eventDate: z.coerce.date(),
  location: z.string().trim().max(300).optional().or(z.literal("")),
  category: z.enum(["worship", "activity", "meeting", "other"]).default("worship"),
  status: z.enum(["scheduled", "cancelled", "completed"]).default("scheduled"),
});
export type EventInput = z.infer<typeof eventInputSchema>;

export const ministryInputSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อพันธกิจ").max(200),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  leader: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});
export type MinistryInput = z.infer<typeof ministryInputSchema>;

export const churchProfileInputSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อคริสตจักร").max(300),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง").max(200).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
});
export type ChurchProfileInput = z.infer<typeof churchProfileInputSchema>;

export const registerInputSchema = z.object({
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(200),
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(200),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});
export type LoginInput = z.infer<typeof loginInputSchema>;
