import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  CalendarDays,
  Download,
  Edit3,
  Heart,
  Loader2,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { authService, canDeactivateMembers, canManageMembers, type SignedInProfile } from "@/services/auth";
import { memberService, referenceService } from "@/services/members";
import { isSupabaseConfigured } from "@/services/supabase";
import type {
  AreaOption,
  FollowUpStatus,
  GroupOption,
  MemberInput,
  MemberRecord,
  SpiritualStatus,
} from "@/types/database";
import { ICON_SIZE } from "@/lib/icon-sizes";

const PAGE_SIZE = 12;

const memberSchema = z.object({
  full_name: z.string().trim().min(2, "กรุณากรอกชื่อ-นามสกุลอย่างน้อย 2 ตัวอักษร").max(160),
  nickname: z.string().max(80).optional(),
  phone: z.string().max(30).optional(),
  gender: z.enum(["male", "female", "other", "unspecified"]).optional(),
  birth_date: z.string().optional(),
  address: z.string().max(500).optional(),
  village: z.string().max(120).optional(),
  subdistrict: z.string().max(120).optional(),
  district: z.string().max(120).optional(),
  province: z.string().max(120).optional(),
  area_id: z.string().uuid().optional().or(z.literal("")),
  group_id: z.string().uuid().optional().or(z.literal("")),
  role: z.string().trim().min(1, "กรุณาเลือกบทบาท").max(80),
  spiritual_status: z.enum(["visitor", "interested", "new_believer", "member", "leader", "volunteer"]),
  follow_up_status: z.enum(["new", "contacted", "in_progress", "stable", "needs_attention", "inactive"]),
  joined_at: z.string().min(1, "กรุณาเลือกวันที่เข้าร่วม"),
  last_contact_at: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

const roleOptions = ["สมาชิก", "ผู้รับเชื่อใหม่", "อาสาสมัคร", "ผู้นำกลุ่มบ้าน", "ผู้ประสานงาน"];
const spiritualLabels: Record<SpiritualStatus, string> = {
  visitor: "ผู้มาเยี่ยม",
  interested: "ผู้สนใจ",
  new_believer: "ผู้รับเชื่อใหม่",
  member: "สมาชิก",
  leader: "ผู้นำ",
  volunteer: "อาสาสมัคร",
};
const followUpLabels: Record<FollowUpStatus, string> = {
  new: "รอติดต่อ",
  contacted: "ติดต่อแล้ว",
  in_progress: "กำลังติดตาม",
  stable: "ติดตามเรียบร้อย",
  needs_attention: "ต้องดูแล",
  inactive: "ไม่ได้ติดตาม",
};

function dateForInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toFormValues(member?: MemberRecord): MemberFormValues {
  return {
    full_name: member?.full_name ?? "",
    nickname: member?.nickname ?? "",
    phone: member?.phone ?? "",
    gender: member?.gender ?? "unspecified",
    birth_date: dateForInput(member?.birth_date),
    address: member?.address ?? "",
    village: member?.village ?? "",
    subdistrict: member?.subdistrict ?? "",
    district: member?.district ?? "",
    province: member?.province ?? "",
    area_id: member?.area_id ?? "",
    group_id: member?.group_id ?? "",
    role: member?.role ?? "สมาชิก",
    spiritual_status: member?.spiritual_status ?? "visitor",
    follow_up_status: member?.follow_up_status ?? "new",
    joined_at: dateForInput(member?.joined_at) || new Date().toISOString().slice(0, 10),
    last_contact_at: dateForInput(member?.last_contact_at),
    notes: member?.notes ?? "",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
}

function initials(name: string) {
  return name.trim().slice(0, 1) || "ส";
}

function avatarTone(id: string) {
  return ["blue", "pink", "orange", "purple", "green"][id.charCodeAt(0) % 5];
}

function statusTone(status: FollowUpStatus) {
  return status === "stable" || status === "contacted" ? "good" : "attention";
}

function memberToInput(values: MemberFormValues): MemberInput {
  return {
    ...values,
    nickname: values.nickname || null,
    phone: values.phone || null,
    gender: values.gender || null,
    birth_date: values.birth_date || null,
    address: values.address || null,
    village: values.village || null,
    subdistrict: values.subdistrict || null,
    district: values.district || null,
    province: values.province || null,
    area_id: values.area_id || null,
    group_id: values.group_id || null,
    last_contact_at: values.last_contact_at || null,
    notes: values.notes || null,
  };
}

type MemberFormDialogProps = {
  member?: MemberRecord;
  areas: AreaOption[];
  groups: GroupOption[];
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function MemberFormDialog({ member, areas, groups, onClose, onSaved }: MemberFormDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: toFormValues(member),
  });
  const selectedArea = form.watch("area_id");
  const availableGroups = groups.filter((group) => !selectedArea || group.area_id === selectedArea);

  const submit = form.handleSubmit(async (values) => {
    try {
      setSaveError(null);
      const input = memberToInput(values);
      if (member) {
        await memberService.update(member.id, input);
        toast.success("บันทึกการแก้ไขสมาชิกแล้ว");
      } else {
        await memberService.create(input);
        toast.success("เพิ่มสมาชิกใหม่เรียบร้อยแล้ว");
      }
      await onSaved();
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลสมาชิกได้");
    }
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="member-form-dialog" aria-describedby="member-form-description">
        <DialogHeader>
          <DialogTitle>{member ? "แก้ไขข้อมูลสมาชิก" : "เพิ่มสมาชิก"}</DialogTitle>
          <DialogDescription id="member-form-description">
            กรอกข้อมูลที่จำเป็นก่อนบันทึก ระบบจะแจ้งเตือนเมื่อข้อมูลยังไม่ครบถ้วน
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="member-form" noValidate>
          <section>
            <h3>ข้อมูลพื้นฐาน</h3>
            <div className="member-form-grid">
              <label className="member-field required">
                <span>ชื่อ-นามสกุล</span>
                <input {...form.register("full_name")} autoFocus aria-invalid={Boolean(form.formState.errors.full_name)} />
                {form.formState.errors.full_name && <small>{form.formState.errors.full_name.message}</small>}
              </label>
              <label className="member-field">
                <span>ชื่อเล่น</span>
                <input {...form.register("nickname")} />
              </label>
              <label className="member-field">
                <span>โทรศัพท์</span>
                <input {...form.register("phone")} inputMode="tel" />
              </label>
              <label className="member-field">
                <span>เพศ</span>
                <select {...form.register("gender")}>
                  <option value="unspecified">ไม่ระบุ</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">อื่น ๆ</option>
                </select>
              </label>
              <label className="member-field">
                <span>วันเกิด</span>
                <input type="date" {...form.register("birth_date")} />
              </label>
              <label className="member-field required">
                <span>วันที่เข้าร่วม</span>
                <input type="date" {...form.register("joined_at")} aria-invalid={Boolean(form.formState.errors.joined_at)} />
                {form.formState.errors.joined_at && <small>{form.formState.errors.joined_at.message}</small>}
              </label>
            </div>
          </section>

          <section>
            <h3>พื้นที่และการเติบโต</h3>
            <div className="member-form-grid">
              <label className="member-field">
                <span>พื้นที่</span>
                <select {...form.register("area_id")}>
                  <option value="">ยังไม่กำหนด</option>
                  {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                </select>
              </label>
              <label className="member-field">
                <span>กลุ่มพันธกิจ</span>
                <select {...form.register("group_id")}>
                  <option value="">ยังไม่กำหนด</option>
                  {availableGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              </label>
              <label className="member-field required">
                <span>บทบาท</span>
                <select {...form.register("role")} aria-invalid={Boolean(form.formState.errors.role)}>
                  {roleOptions.map((role) => <option key={role}>{role}</option>)}
                </select>
              </label>
              <label className="member-field">
                <span>สถานะฝ่ายวิญญาณ</span>
                <select {...form.register("spiritual_status")}>
                  {(Object.entries(spiritualLabels) as [SpiritualStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="member-field">
                <span>สถานะการติดตาม</span>
                <select {...form.register("follow_up_status")}>
                  {(Object.entries(followUpLabels) as [FollowUpStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="member-field">
                <span>ติดต่อครั้งล่าสุด</span>
                <input type="date" {...form.register("last_contact_at")} />
              </label>
            </div>
          </section>

          <section>
            <h3>ที่อยู่และบันทึก</h3>
            <div className="member-form-grid">
              <label className="member-field full">
                <span>ที่อยู่</span>
                <input {...form.register("address")} />
              </label>
              <label className="member-field"><span>หมู่บ้าน</span><input {...form.register("village")} /></label>
              <label className="member-field"><span>ตำบล</span><input {...form.register("subdistrict")} /></label>
              <label className="member-field"><span>อำเภอ</span><input {...form.register("district")} /></label>
              <label className="member-field"><span>จังหวัด</span><input {...form.register("province")} /></label>
              <label className="member-field full">
                <span>บันทึกการดูแล</span>
                <textarea rows={3} {...form.register("notes")} />
              </label>
            </div>
          </section>

          {saveError && <div className="member-form-error" role="alert"><ShieldAlert size={ICON_SIZE.sm} /> {saveError}</div>}
          <footer className="member-form-actions">
            <button type="button" className="cancel-button" onClick={onClose} disabled={form.formState.isSubmitting}>ยกเลิก</button>
            <button type="submit" className="blue-button" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <><Loader2 className="spin" size={ICON_SIZE.sm} /> กำลังบันทึก</> : <><UserCheck size={ICON_SIZE.sm} /> {member ? "บันทึกการแก้ไข" : "บันทึกสมาชิก"}</>}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type MemberDrawerProps = {
  member: MemberRecord;
  canManage: boolean;
  canDeactivate: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
};

function MemberDetailDrawer({ member, canManage, canDeactivate, onClose, onEdit, onDeactivate }: MemberDrawerProps) {
  return (
    <Drawer open onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent className="member-drawer">
        <DrawerHeader className="member-drawer-header">
          <div className={`member-detail-avatar ${avatarTone(member.id)}`}>{initials(member.full_name)}</div>
          <div>
            <DrawerTitle>{member.full_name}</DrawerTitle>
            <DrawerDescription>{member.nickname ? `“${member.nickname}” · ` : ""}{member.role}</DrawerDescription>
          </div>
          <button className="member-drawer-close" onClick={onClose} aria-label="ปิดรายละเอียด"><X size={ICON_SIZE.md} /></button>
        </DrawerHeader>
        <div className="member-drawer-scroll">
          <div className="member-detail-badges">
            <span className={`status-chip ${statusTone(member.follow_up_status)}`}>{followUpLabels[member.follow_up_status]}</span>
            <span className="role-chip blue">{spiritualLabels[member.spiritual_status]}</span>
          </div>
          <section className="member-detail-section">
            <h3>ข้อมูลติดต่อ</h3>
            <p><Phone size={ICON_SIZE.sm} /> {member.phone || "ยังไม่มีเบอร์โทรศัพท์"}</p>
            <p><MapPin size={ICON_SIZE.sm} /> {[member.village, member.subdistrict, member.district, member.province].filter(Boolean).join(" · ") || "ยังไม่มีข้อมูลที่อยู่"}</p>
          </section>
          <section className="member-detail-section">
            <h3>พื้นที่และกลุ่มพันธกิจ</h3>
            <dl>
              <div><dt>พื้นที่</dt><dd>{member.area?.name || "ยังไม่กำหนด"}</dd></div>
              <div><dt>กลุ่ม</dt><dd>{member.group?.name || "ยังไม่เข้ากลุ่ม"}</dd></div>
              <div><dt>เข้าร่วมเมื่อ</dt><dd>{formatDate(member.joined_at)}</dd></div>
              <div><dt>ติดต่อครั้งล่าสุด</dt><dd>{formatDate(member.last_contact_at)}</dd></div>
            </dl>
          </section>
          <section className="member-detail-section">
            <h3>เส้นทางการเติบโต</h3>
            <div className="member-journey" aria-label={`สถานะปัจจุบัน ${spiritualLabels[member.spiritual_status]}`}>
              {(["visitor", "interested", "new_believer", "member", "leader"] as SpiritualStatus[]).map((stage) => (
                <span key={stage} className={stage === member.spiritual_status ? "current" : ""}>{spiritualLabels[stage]}</span>
              ))}
            </div>
          </section>
          {member.notes && <section className="member-detail-section"><h3>บันทึกการดูแล</h3><p className="member-notes">{member.notes}</p></section>}
        </div>
        {canManage && <footer className="member-drawer-actions">
          <button className="cancel-button" onClick={onEdit}><Edit3 size={ICON_SIZE.sm} /> แก้ไข</button>
          {canDeactivate && <button className="danger-button" onClick={onDeactivate}>{member.active ? "ปิดการใช้งาน" : "เปิดใช้งานอีกครั้ง"}</button>}
        </footer>}
      </DrawerContent>
    </Drawer>
  );
}

function downloadCsv(records: MemberRecord[]) {
  const lines = [
    ["ชื่อ", "บทบาท", "พื้นที่", "กลุ่ม", "สถานะติดตาม", "เข้าร่วมเมื่อ"],
    ...records.map((member) => [member.full_name, member.role, member.area?.name ?? "", member.group?.name ?? "", followUpLabels[member.follow_up_status], member.joined_at]),
  ];
  const csv = "\ufeff" + lines.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "puntakit-members.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Members() {
  const [profile, setProfile] = useState<SignedInProfile | null | undefined>(undefined);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [records, setRecords] = useState<MemberRecord[]>([]);
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState("");
  const [areaId, setAreaId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus | "">("");
  const [active, setActive] = useState<"active" | "inactive">("active");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMember, setFormMember] = useState<MemberRecord | null | undefined>(undefined);
  const [selected, setSelected] = useState<MemberRecord | null>(null);
  const [pendingActivation, setPendingActivation] = useState<MemberRecord | null>(null);

  const canManage = canManageMembers(profile?.role);
  const canDeactivate = canDeactivateMembers(profile?.role);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const loadMembers = useCallback(async () => {
    if (!isSupabaseConfigured || !profile) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await memberService.list({
        query,
        areaId: areaId || undefined,
        groupId: groupId || undefined,
        followUpStatus: followUpStatus || undefined,
        active: active === "active",
        page,
        pageSize: PAGE_SIZE,
      });
      setRecords(result.data);
      setCount(result.count);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "ไม่สามารถโหลดรายชื่อสมาชิกได้");
    } finally {
      setIsLoading(false);
    }
  }, [active, areaId, followUpStatus, groupId, page, profile, query]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void authService.currentProfile()
      .then((current) => { if (!cancelled) setProfile(current); })
      .catch((error) => { if (!cancelled) { setLoadError(error instanceof Error ? error.message : "ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้งานได้"); setProfile(null); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!profile) return;
    void Promise.all([referenceService.listAreas(), referenceService.listGroups()])
      .then(([nextAreas, nextGroups]) => { setAreas(nextAreas); setGroups(nextGroups); })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลอ้างอิงได้"));
  }, [profile]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);
  useEffect(() => { setPage(0); }, [query, areaId, groupId, followUpStatus, active]);

  const clearFilters = () => {
    setQuery(""); setAreaId(""); setGroupId(""); setFollowUpStatus(""); setActive("active");
  };
  const hasFilter = Boolean(query || areaId || groupId || followUpStatus || active === "inactive");
  const filteredGroups = groups.filter((group) => !areaId || group.area_id === areaId);
  const caringNow = useMemo(() => records.filter((member) => member.follow_up_status === "needs_attention").length, [records]);
  const uniqueAreasInPage = useMemo(() => new Set(records.map((member) => member.area_id).filter(Boolean)).size, [records]);

  const onSaved = async () => { await loadMembers(); };
  const confirmActivation = async () => {
    if (!pendingActivation) return;
    try {
      await memberService.setActive(pendingActivation.id, !pendingActivation.active);
      toast.success(pendingActivation.active ? "ปิดการใช้งานสมาชิกแล้ว" : "เปิดใช้งานสมาชิกแล้ว");
      setSelected(null);
      await loadMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ไม่สามารถอัปเดตสถานะสมาชิกได้");
    } finally {
      setPendingActivation(null);
    }
  };

  const configurationMessage = !isSupabaseConfigured
    ? "ระบบสมาชิกพร้อมเชื่อมต่อฐานข้อมูลแล้ว แต่ยังไม่ได้ตั้งค่า Supabase สำหรับสภาพแวดล้อมนี้"
    : profile === undefined
      ? "กำลังตรวจสอบสิทธิ์ผู้ใช้งาน…"
      : !profile
        ? "กรุณาเข้าสู่ระบบด้วยบัญชี Supabase ที่ได้รับสิทธิ์ก่อนจัดการข้อมูลสมาชิก"
        : null;

  return (
    <AppLayout>
      <div className="page-heading">
        <div>
          <span className="eyebrow blue-eyebrow">PEOPLE &amp; COMMUNITY</span>
          <h1>สมาชิก</h1>
          <p>จัดการข้อมูลสมาชิก ติดตามการเติบโต และดูแลความสัมพันธ์ในคริสตจักร</p>
        </div>
        {canManage && <button className="primary-action" onClick={() => setFormMember(null)}><UserPlus size={ICON_SIZE.sm} /> เพิ่มสมาชิก</button>}
      </div>

      {configurationMessage ? (
        <section className="data-state-card card-surface" role="status">
          <ShieldAlert size={ICON_SIZE["2xl"]} />
          <h2>ยังไม่พร้อมใช้งาน</h2>
          <p>{configurationMessage}</p>
          <p className="data-state-note">ตั้งค่า <code>VITE_SUPABASE_URL</code> และ <code>VITE_SUPABASE_ANON_KEY</code> หลังจากใช้ migration ของ Puntakit ในโครงการ Supabase แล้ว</p>
        </section>
      ) : <>
        <div className="member-summary">
          <div className="summary-card blue"><span className="summary-icon"><Users size={ICON_SIZE.lg} /></span><div><small>สมาชิกที่พบ</small><strong>{count}</strong><span>รายการ</span></div></div>
          <div className="summary-card green"><span className="summary-icon"><UserCheck size={ICON_SIZE.lg} /></span><div><small>สถานะใช้งาน</small><strong>{active === "active" ? count : 0}</strong><span>คน</span></div></div>
          <div className="summary-card orange"><span className="summary-icon"><Heart size={ICON_SIZE.lg} /></span><div><small>ต้องดูแลในหน้านี้</small><strong>{caringNow}</strong><span>คน</span></div></div>
          <div className="summary-card purple"><span className="summary-icon"><MapPin size={ICON_SIZE.lg} /></span><div><small>พื้นที่ในหน้านี้</small><strong>{uniqueAreasInPage}</strong><span>พื้นที่</span></div></div>
        </div>

        <section className="member-panel card-surface">
          <div className="member-toolbar">
            <label className="member-search"><Search size={ICON_SIZE.md} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อสมาชิก..." aria-label="ค้นหาสมาชิก" />{query && <button onClick={() => setQuery("")} aria-label="ล้างการค้นหา"><X size={ICON_SIZE.xs} /></button>}</label>
            <div className="filter-label"><SlidersHorizontal size={ICON_SIZE.sm} /> ตัวกรอง</div>
            <select value={areaId} onChange={(event) => setAreaId(event.target.value)} aria-label="กรองพื้นที่"><option value="">ทุกพื้นที่</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>
            <select value={groupId} onChange={(event) => setGroupId(event.target.value)} aria-label="กรองกลุ่ม"><option value="">ทุกกลุ่ม</option>{filteredGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
            <select value={followUpStatus} onChange={(event) => setFollowUpStatus(event.target.value as FollowUpStatus | "")} aria-label="กรองการติดตาม"><option value="">ทุกสถานะติดตาม</option>{(Object.entries(followUpLabels) as [FollowUpStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={active} onChange={(event) => setActive(event.target.value as "active" | "inactive")} aria-label="กรองสถานะการใช้งาน"><option value="active">กำลังใช้งาน</option><option value="inactive">ปิดการใช้งาน</option></select>
          </div>
          <div className="active-filter-row"><span>แสดง {records.length} จาก {count} รายการ</span><div className="member-list-actions"><button onClick={() => downloadCsv(records)} disabled={!records.length}><Download size={ICON_SIZE.xs} /> CSV</button><button onClick={() => window.print()}><Printer size={ICON_SIZE.xs} /> พิมพ์</button>{hasFilter && <button onClick={clearFilters}>ล้างตัวกรอง</button>}</div></div>

          {loadError ? <div className="member-error-state" role="alert"><ShieldAlert size={ICON_SIZE.xl} /><div><strong>ไม่สามารถโหลดข้อมูลได้</strong><p>{loadError}</p></div><button className="blue-button" onClick={() => void loadMembers()}><RefreshCw size={ICON_SIZE.xs} /> ลองอีกครั้ง</button></div> : isLoading ? <MemberSkeleton /> : records.length === 0 ? <div className="empty-members"><Users size={ICON_SIZE["2xl"]} /><h3>ยังไม่พบสมาชิก</h3><p>{hasFilter ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง" : "เริ่มต้นโดยการเพิ่มสมาชิกคนแรกของคริสตจักร"}</p>{canManage && !hasFilter && <button className="blue-button" onClick={() => setFormMember(null)}><Plus size={ICON_SIZE.sm} /> เพิ่มสมาชิก</button>}</div> : <>
            <div className="member-table-wrap"><table className="member-table"><thead><tr><th>สมาชิก</th><th>บทบาท</th><th>พื้นที่</th><th>กลุ่ม</th><th>สถานะ</th><th>เข้าร่วมเมื่อ</th><th><span className="sr-only">ดูรายละเอียด</span></th></tr></thead><tbody>{records.map((member) => <tr key={member.id} onClick={() => setSelected(member)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setSelected(member)}><td><div className="member-name"><span className={`member-avatar ${avatarTone(member.id)}`}>{initials(member.full_name)}</span><div><strong>{member.full_name}</strong><small>{member.nickname || spiritualLabels[member.spiritual_status]}</small></div></div></td><td><span className={`role-chip ${avatarTone(member.id)}`}>{member.role}</span></td><td>{member.area?.name || "—"}</td><td>{member.group?.name || "ยังไม่เข้ากลุ่ม"}</td><td><span className={`status-chip ${statusTone(member.follow_up_status)}`}>{followUpLabels[member.follow_up_status]}</span></td><td>{formatDate(member.joined_at)}</td><td><button className="row-menu" aria-label={`ดู ${member.full_name}`} onClick={(event) => { event.stopPropagation(); setSelected(member); }}><MoreHorizontal size={ICON_SIZE.md} /></button></td></tr>)}</tbody></table></div>
            <div className="member-mobile-list">{records.map((member) => <button key={member.id} className="member-mobile-card" onClick={() => setSelected(member)}><span className={`member-avatar ${avatarTone(member.id)}`}>{initials(member.full_name)}</span><span className="member-mobile-main"><strong>{member.full_name}</strong><small>{member.area?.name || "ไม่ระบุพื้นที่"} · {member.group?.name || "ยังไม่เข้ากลุ่ม"}</small></span><span className={`status-chip ${statusTone(member.follow_up_status)}`}>{followUpLabels[member.follow_up_status]}</span></button>)}</div>
            <nav className="members-pagination" aria-label="แบ่งหน้ารายชื่อสมาชิก"><button onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={page === 0}>ก่อนหน้า</button><span>หน้า {page + 1} จาก {pageCount}</span><button onClick={() => setPage((current) => Math.min(current + 1, pageCount - 1))} disabled={page >= pageCount - 1}>ถัดไป</button></nav>
          </>}
        </section>
      </>}

      {formMember !== undefined && <MemberFormDialog member={formMember ?? undefined} areas={areas} groups={groups} onClose={() => setFormMember(undefined)} onSaved={onSaved} />}
      {selected && <MemberDetailDrawer member={selected} canManage={canManage} canDeactivate={canDeactivate} onClose={() => setSelected(null)} onEdit={() => { setFormMember(selected); setSelected(null); }} onDeactivate={() => setPendingActivation(selected)} />}
      <AlertDialog open={Boolean(pendingActivation)} onOpenChange={(open) => !open && setPendingActivation(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{pendingActivation?.active ? "ปิดการใช้งานสมาชิก?" : "เปิดใช้งานสมาชิกอีกครั้ง?"}</AlertDialogTitle><AlertDialogDescription>{pendingActivation?.active ? `สมาชิก ${pendingActivation.full_name} จะไม่ปรากฏในรายการใช้งานปกติ ข้อมูลและประวัติยังคงอยู่` : `สมาชิก ${pendingActivation?.full_name ?? ""} จะกลับมาอยู่ในรายการใช้งานปกติ`}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>ยกเลิก</AlertDialogCancel><AlertDialogAction className={pendingActivation?.active ? "bg-red-600 hover:bg-red-700" : ""} onClick={() => void confirmActivation()}>{pendingActivation?.active ? "ปิดการใช้งาน" : "เปิดใช้งาน"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </AppLayout>
  );
}

function MemberSkeleton() {
  return <div className="member-skeleton" aria-label="กำลังโหลดรายชื่อสมาชิก"><div /><div /><div /><div /><div /></div>;
}
