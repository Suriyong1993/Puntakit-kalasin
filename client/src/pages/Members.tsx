import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Heart,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ICON_SIZE } from "@/lib/icon-sizes";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError, type ApiMeta } from "@/lib/api";
import type { Gender, MembershipStatus } from "@shared/schema";

interface Member {
  id: string;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
  gender: Gender | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  lineId: string | null;
  address: string | null;
  role: string;
  area: string | null;
  group: string | null;
  membershipStatus: MembershipStatus;
  status: "ติดตามแล้ว" | "ต้องติดตาม";
  assignedLeaderId: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  consentGiven: boolean;
  joinedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = {
  name: "",
  nickname: "",
  gender: "" as Gender | "",
  birthDate: "",
  phone: "",
  email: "",
  lineId: "",
  address: "",
  role: "สมาชิก",
  area: "",
  group: "",
  membershipStatus: "visitor" as MembershipStatus,
  status: "ต้องติดตาม" as Member["status"],
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  consentGiven: false,
  notes: "",
};

const tones = ["blue", "pink", "orange", "purple", "green"] as const;
function toneFor(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return tones[sum % tones.length];
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, { label: string; tone: string }> = {
  active: { label: "สมาชิกประจำ", tone: "green" },
  visitor: { label: "ผู้สนใจ/เยี่ยมเยียน", tone: "blue" },
  candidate: { label: "ผู้เตรียมรับเชื่อ", tone: "orange" },
  transferred: { label: "ย้ายคริสตจักร", tone: "purple" },
  inactive: { label: "ขาดการติดต่อ", tone: "pink" },
};

export default function Members() {
  const { user } = useAuth();
  const canManage =
    user?.role === "super_admin" ||
    user?.role === "admin" ||
    user?.role === "staff" ||
    user?.role === "ministry_leader" ||
    user?.role === "group_leader";
  const canDelete = user?.role === "super_admin" || user?.role === "admin";

  const [members, setMembers] = useState<Member[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [area, setArea] = useState("ทั้งหมด");
  const [status, setStatus] = useState("ทั้งหมด");
  const [membershipStatus, setMembershipStatus] = useState("ทั้งหมด");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMembers = useCallback(
    async (pageToLoad: number = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("limit", "15");
        if (query.trim()) params.set("search", query.trim());
        if (area !== "ทั้งหมด") params.set("area", area);
        if (status !== "ทั้งหมด") params.set("status", status);
        if (membershipStatus !== "ทั้งหมด") params.set("membershipStatus", membershipStatus);

        const res = await api.getWithMeta<Member[]>(`/api/members?${params.toString()}`);
        setMembers(res.data || []);
        if (res.meta) setMeta(res.meta);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "โหลดข้อมูลสมาชิกไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    },
    [query, area, status, membershipStatus]
  );

  useEffect(() => {
    loadMembers(1);
  }, [loadMembers]);

  // Check duplicate phone or email as user types
  useEffect(() => {
    if (!formOpen) return;
    const checkTimer = setTimeout(async () => {
      const phone = form.phone.trim();
      const email = form.email.trim();
      if (!phone && !email) {
        setDuplicateWarning(null);
        return;
      }
      try {
        const params = new URLSearchParams();
        if (phone) params.set("phone", phone);
        if (email) params.set("email", email);
        if (editing) params.set("excludeId", editing.id);
        const res = await api.get<{
          isDuplicate: boolean;
          conflictField?: string;
          existingMemberName?: string;
        }>(`/api/members/check-duplicate?${params.toString()}`);
        if (res.isDuplicate) {
          const fieldLabel = res.conflictField === "phone" ? "เบอร์โทรศัพท์" : "อีเมล";
          setDuplicateWarning(`คำเตือน: ${fieldLabel}นี้ตรงกับ "${res.existingMemberName}"`);
        } else {
          setDuplicateWarning(null);
        }
      } catch {
        // ignore duplicate check errors
      }
    }, 400);

    return () => clearTimeout(checkTimer);
  }, [form.phone, form.email, formOpen, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDuplicateWarning(null);
    setFormOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({
      name: m.name,
      nickname: m.nickname ?? "",
      gender: m.gender ?? "",
      birthDate: m.birthDate ? m.birthDate.split("T")[0] : "",
      phone: m.phone ?? "",
      email: m.email ?? "",
      lineId: m.lineId ?? "",
      address: m.address ?? "",
      role: m.role,
      area: m.area ?? "",
      group: m.group ?? "",
      membershipStatus: m.membershipStatus ?? "visitor",
      status: m.status,
      emergencyContactName: m.emergencyContactName ?? "",
      emergencyContactPhone: m.emergencyContactPhone ?? "",
      emergencyContactRelation: m.emergencyContactRelation ?? "",
      consentGiven: m.consentGiven ?? false,
      notes: m.notes ?? "",
    });
    setDuplicateWarning(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        gender: form.gender ? form.gender : null,
        birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : null,
      };

      if (editing) {
        await api.put(`/api/members/${editing.id}`, payload);
        toast.success("บันทึกการแก้ไขสมาชิกแล้ว");
      } else {
        await api.post("/api/members", payload);
        toast.success("เพิ่มสมาชิกใหม่เรียบร้อยแล้ว");
      }
      setFormOpen(false);
      loadMembers(meta.page);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/members/${deleteTarget.id}`);
      toast.success("ลบสมาชิกแล้ว (สามารถกู้คืนได้)");
      setDeleteTarget(null);
      loadMembers(meta.page);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = () => {
    window.open("/api/members/export/csv", "_blank");
    toast.info("กำลังเริ่มดาวน์โหลดไฟล์ CSV...");
  };

  const followedUpCount = members.filter((m) => m.status === "ติดตามแล้ว").length;
  const needFollowUpCount = members.filter((m) => m.status === "ต้องติดตาม").length;

  return (
    <AppLayout>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CHURCH MEMBERS</span>
          <h1>จัดการสมาชิก</h1>
          <p>ข้อมูลสมาชิก การจัดกลุ่มย่อย และกระบวนการติดตามความเชื่อ</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="cancel-button" type="button" onClick={handleExportCsv}>
            <Download size={ICON_SIZE.sm} /> Export CSV
          </button>
          {canManage && (
            <button className="primary-action" type="button" onClick={openCreate}>
              <UserPlus size={ICON_SIZE.sm} /> เพิ่มสมาชิก
            </button>
          )}
        </div>
      </div>

      <div className="member-summary">
        <div className="summary-card blue">
          <div className="summary-icon">
            <Users size={ICON_SIZE.lg} />
          </div>
          <div>
            <small>สมาชิกในระบบ</small>
            <strong>{meta.total}</strong>
            <span>คน</span>
          </div>
        </div>
        <div className="summary-card green">
          <div className="summary-icon">
            <Heart size={ICON_SIZE.lg} />
          </div>
          <div>
            <small>ติดตามแล้ว</small>
            <strong>{followedUpCount}</strong>
            <span>คนในหน้านี้</span>
          </div>
        </div>
        <div className="summary-card orange">
          <div className="summary-icon">
            <AlertCircle size={ICON_SIZE.lg} />
          </div>
          <div>
            <small>ต้องติดตาม</small>
            <strong>{needFollowUpCount}</strong>
            <span>คนในหน้านี้</span>
          </div>
        </div>
        <div className="summary-card purple">
          <div className="summary-icon">
            <CalendarDays size={ICON_SIZE.lg} />
          </div>
          <div>
            <small>หน้าปัจจุบัน</small>
            <strong>{meta.page}</strong>
            <span>จาก {meta.totalPages} หน้า</span>
          </div>
        </div>
      </div>

      <section className="member-panel card-surface">
        <div className="member-toolbar">
          <label className="member-search">
            <Search size={ICON_SIZE.md} />
            <input
              placeholder="ค้นหาชื่อ, ชื่อเล่น, เบอร์โทร หรืออีเมล..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X size={ICON_SIZE.xs} />
              </button>
            )}
          </label>

          <span className="filter-label">สถานะ:</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="ติดตามแล้ว">ติดตามแล้ว</option>
            <option value="ต้องติดตาม">ต้องติดตาม</option>
          </select>

          <span className="filter-label">ประเภทสมาชิก:</span>
          <select value={membershipStatus} onChange={(e) => setMembershipStatus(e.target.value)}>
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="active">สมาชิกประจำ</option>
            <option value="visitor">ผู้สนใจ/เยี่ยมเยียน</option>
            <option value="candidate">ผู้เตรียมรับเชื่อ</option>
            <option value="transferred">ย้ายคริสตจักร</option>
            <option value="inactive">ขาดการติดต่อ</option>
          </select>
        </div>

        {error && (
          <div className="state-panel error-panel">
            <AlertCircle size={ICON_SIZE.xl} />
            <h3>เกิดข้อผิดพลาด</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={() => loadMembers(meta.page)}>
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {isLoading && !error && (
          <div className="state-panel">
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <p>กำลังโหลดรายชื่อสมาชิก...</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="member-table-wrap">
              <table className="member-table">
                <thead>
                  <tr>
                    <th>สมาชิก</th>
                    <th>เพศ / วันเกิด</th>
                    <th>เบอร์โทร</th>
                    <th>สถานะสมาชิก</th>
                    <th>พื้นที่ / กลุ่ม</th>
                    <th>การติดตาม</th>
                    <th>วันที่เริ่ม</th>
                    <th style={{ textAlign: "right" }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const tone = toneFor(m.name);
                    const memInfo = MEMBERSHIP_STATUS_LABELS[m.membershipStatus] || {
                      label: m.membershipStatus,
                      tone: "blue",
                    };
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="member-name">
                            <span className={`member-avatar ${tone}`}>{m.name.slice(0, 1)}</span>
                            <div>
                              <strong>
                                {m.name} {m.nickname ? `(${m.nickname})` : ""}
                              </strong>
                              <small>{m.email || m.role}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span>{m.gender === "male" ? "ชาย" : m.gender === "female" ? "หญิง" : "-"}</span>
                          <small style={{ display: "block", color: "#8b9aa9" }}>{formatDate(m.birthDate)}</small>
                        </td>
                        <td>{m.phone || "-"}</td>
                        <td>
                          <span className={`role-chip ${memInfo.tone}`}>{memInfo.label}</span>
                        </td>
                        <td>
                          <div>{m.area || "-"}</div>
                          <small style={{ color: "#8b9aa9" }}>{m.group || "ยังไม่มีกลุ่ม"}</small>
                        </td>
                        <td>
                          <span className={`status-chip ${m.status === "ติดตามแล้ว" ? "good" : "attention"}`}>
                            {m.status}
                          </span>
                        </td>
                        <td>{formatDate(m.joinedAt)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="row-menu"
                            onClick={() => setSelectedMember(m)}
                            title="ดูข้อมูลละเอียด"
                            aria-label="ดูข้อมูลละเอียด"
                          >
                            <Eye size={ICON_SIZE.sm} />
                          </button>
                          {canManage && (
                            <button
                              className="row-menu"
                              onClick={() => openEdit(m)}
                              title="แก้ไขข้อมูล"
                              aria-label="แก้ไขข้อมูล"
                            >
                              <Pencil size={ICON_SIZE.sm} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="row-menu"
                              style={{ color: "#c23b4d" }}
                              onClick={() => setDeleteTarget(m)}
                              title="ลบสมาชิก"
                              aria-label="ลบสมาชิก"
                            >
                              <Trash2 size={ICON_SIZE.sm} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {members.length === 0 && (
                <div className="empty-members">
                  <Users size={ICON_SIZE["2xl"]} />
                  <h3>ไม่พบสมาชิก</h3>
                  <p>ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 4px 10px",
                  fontSize: 12,
                  color: "var(--muted)",
                }}
              >
                <span>
                  แสดงผล {members.length} รายการ (จากทั้งหมด {meta.total} รายการ)
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    className="cancel-button"
                    disabled={meta.page <= 1}
                    onClick={() => loadMembers(meta.page - 1)}
                  >
                    <ChevronLeft size={ICON_SIZE.sm} /> ก่อนหน้า
                  </button>
                  <span style={{ padding: "0 8px" }}>
                    หน้า {meta.page} / {meta.totalPages}
                  </span>
                  <button
                    className="cancel-button"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => loadMembers(meta.page + 1)}
                  >
                    ถัดไป <ChevronRight size={ICON_SIZE.sm} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Create / Edit Modal */}
      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <h2>{editing ? "แก้ไขข้อมูลสมาชิก" : "เพิ่มสมาชิกใหม่"}</h2>
              <button onClick={() => setFormOpen(false)}>
                <X size={ICON_SIZE.sm} />
              </button>
            </div>

            {duplicateWarning && (
              <div
                style={{
                  background: "#fff2d9",
                  color: "#a05b10",
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <form className="form-grid" onSubmit={handleSubmit}>
              {/* Section 1: ข้อมูลพื้นฐาน */}
              <label>
                ชื่อ-นามสกุล *
                <input
                  required
                  placeholder="เช่น สมชาย สุขเกษม"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                ชื่อเล่น
                <input
                  placeholder="เช่น ต้น"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                />
              </label>
              <label>
                เพศ
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </label>
              <label>
                วันเกิด
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </label>

              {/* Section 2: การติดต่อ */}
              <label>
                เบอร์โทรศัพท์
                <input
                  placeholder="081-234-5678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label>
                อีเมล
                <input
                  type="email"
                  placeholder="member@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label>
                LINE ID
                <input
                  placeholder="ไอดีไลน์สำหรับติดต่อ"
                  value={form.lineId}
                  onChange={(e) => setForm({ ...form, lineId: e.target.value })}
                />
              </label>
              <label>
                สถานะสมาชิก
                <select
                  value={form.membershipStatus}
                  onChange={(e) =>
                    setForm({ ...form, membershipStatus: e.target.value as MembershipStatus })
                  }
                >
                  <option value="visitor">ผู้สนใจ/เยี่ยมเยียน</option>
                  <option value="active">สมาชิกประจำ</option>
                  <option value="candidate">ผู้เตรียมรับเชื่อ</option>
                  <option value="transferred">ย้ายคริสตจักร</option>
                  <option value="inactive">ขาดการติดต่อ</option>
                </select>
              </label>
              <label className="full-field">
                ที่อยู่ปัจจุบัน
                <input
                  placeholder="บ้านเลขที่ หมู่บ้าน ตำบล อำเภอ จังหวัด"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </label>

              {/* Section 3: พันธกิจ & กลุ่ม */}
              <label>
                พื้นที่ (Area)
                <input
                  placeholder="เช่น อ.เมืองกาฬสินธุ์"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                />
              </label>
              <label>
                กลุ่มย่อย (Cell Group)
                <input
                  placeholder="เช่น กลุ่มบ้านสันติสุข"
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                />
              </label>
              <label>
                สถานะการดูแล
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Member["status"] })}
                >
                  <option value="ต้องติดตาม">ต้องติดตาม</option>
                  <option value="ติดตามแล้ว">ติดตามแล้ว</option>
                </select>
              </label>
              <label>
                บทบาทในคริสตจักร
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </label>

              {/* Section 4: ผู้ติดต่อฉุกเฉิน */}
              <label>
                ผู้ติดต่อฉุกเฉิน
                <input
                  placeholder="ชื่อ-นามสกุล"
                  value={form.emergencyContactName}
                  onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                />
              </label>
              <label>
                เบอร์โทรฉุกเฉิน
                <input
                  placeholder="เบอร์โทรติดต่อฉุกเฉิน"
                  value={form.emergencyContactPhone}
                  onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                />
              </label>

              {/* Section 5: PDPA & หมายเหตุภายใน */}
              <label className="full-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={form.consentGiven}
                  onChange={(e) => setForm({ ...form, consentGiven: e.target.checked })}
                />
                <span>ยินยอมให้คริสตจักรเก็บรวบรวมและใช้ข้อมูลส่วนบุคคลตามนโยบายคุ้มครองข้อมูล (PDPA Consent)</span>
              </label>

              <label className="full-field">
                บันทึกฝ่ายอภิบาล (Pastoral Notes - เฉพาะเจ้าหน้าที่)
                <textarea
                  rows={3}
                  placeholder="ข้อมูลคำอธิษฐาน ความต้องการฝ่ายวิญญาณ หรือบันทึกการเยี่ยมเยียน..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>

              <div className="modal-actions full-field">
                <button type="button" className="cancel-button" onClick={() => setFormOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="primary-action" disabled={submitting}>
                  {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detailed Profile View */}
      {selectedMember && (
        <div className="modal-backdrop" onClick={() => setSelectedMember(null)}>
          <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <h2>ข้อมูลสมาชิกโดยละเอียด</h2>
              <button onClick={() => setSelectedMember(null)}>
                <X size={ICON_SIZE.sm} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px",
                background: "#f4f8fc",
                borderRadius: 14,
                marginBottom: 16,
              }}
            >
              <div
                className={`member-avatar ${toneFor(selectedMember.name)}`}
                style={{ width: 56, height: 56, fontSize: 24, borderRadius: 16 }}
              >
                {selectedMember.name.slice(0, 1)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, color: "var(--ink)" }}>
                  {selectedMember.name} {selectedMember.nickname ? `(${selectedMember.nickname})` : ""}
                </h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span className="role-chip blue">{selectedMember.role}</span>
                  <span className="role-chip green">
                    {MEMBERSHIP_STATUS_LABELS[selectedMember.membershipStatus]?.label || selectedMember.membershipStatus}
                  </span>
                  <span className={`status-chip ${selectedMember.status === "ติดตามแล้ว" ? "good" : "attention"}`}>
                    {selectedMember.status}
                  </span>
                  {selectedMember.consentGiven && (
                    <span style={{ fontSize: 10, color: "#1e9b68", display: "flex", alignItems: "center", gap: 3 }}>
                      <ShieldCheck size={12} /> ยินยอม PDPA แล้ว
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 12 }}>
              <div style={{ background: "#fff", border: "1px solid #edf2f6", borderRadius: 12, padding: 12 }}>
                <strong style={{ display: "block", color: "var(--ink)", marginBottom: 8 }}>ข้อมูลการติดต่อ</strong>
                <p style={{ margin: "4px 0", color: "#60758c" }}>เบอร์โทร: <b>{selectedMember.phone || "ไม่มีข้อมูล"}</b></p>
                <p style={{ margin: "4px 0", color: "#60758c" }}>อีเมล: <b>{selectedMember.email || "ไม่มีข้อมูล"}</b></p>
                <p style={{ margin: "4px 0", color: "#60758c" }}>LINE ID: <b>{selectedMember.lineId || "ไม่มีข้อมูล"}</b></p>
                <p style={{ margin: "4px 0", color: "#60758c" }}>ที่อยู่: <b>{selectedMember.address || "ไม่มีข้อมูล"}</b></p>
              </div>

              <div style={{ background: "#fff", border: "1px solid #edf2f6", borderRadius: 12, padding: 12 }}>
                <strong style={{ display: "block", color: "var(--ink)", marginBottom: 8 }}>ข้อมูลคริสตจักร & ฉุกเฉิน</strong>
                <p style={{ margin: "4px 0", color: "#60758c" }}>พื้นที่: <b>{selectedMember.area || "-"}</b></p>
                <p style={{ margin: "4px 0", color: "#60758c" }}>กลุ่มย่อย: <b>{selectedMember.group || "ยังไม่มีกลุ่ม"}</b></p>
                <p style={{ margin: "4px 0", color: "#60758c" }}>วันที่เข้าร่วม: <b>{formatDate(selectedMember.joinedAt)}</b></p>
                <p style={{ margin: "4px 0", color: "#60758c" }}>ผู้ติดต่อฉุกเฉิน: <b>{selectedMember.emergencyContactName ? `${selectedMember.emergencyContactName} (${selectedMember.emergencyContactPhone || "-"})` : "ไม่มีข้อมูล"}</b></p>
              </div>
            </div>

            {selectedMember.notes && (
              <div style={{ marginTop: 14, background: "#fdfbf7", border: "1px solid #f0e6d2", borderRadius: 12, padding: 12 }}>
                <strong style={{ display: "block", color: "#9a6a16", marginBottom: 4, fontSize: 11 }}>บันทึกฝ่ายอภิบาล (Pastoral Care Notes)</strong>
                <p style={{ margin: 0, fontSize: 12, color: "#594827", lineHeight: 1.5 }}>{selectedMember.notes}</p>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="cancel-button" onClick={() => setSelectedMember(null)}>
                ปิดหน้าต่าง
              </button>
              {canManage && (
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => {
                    const target = selectedMember;
                    setSelectedMember(null);
                    openEdit(target);
                  }}
                >
                  <Pencil size={ICON_SIZE.sm} /> แก้ไขข้อมูลนี้
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Soft Delete */}
      {deleteTarget && (
        <ConfirmDialog
          title="ยืนยันการลบสมาชิก"
          description={`ต้องการลบ "${deleteTarget.name}" ออกจากรายชื่อสมาชิกใช่หรือไม่? (ข้อมูลจะถูกย้ายไปถังขยะและสามารถกู้คืนได้)`}
          isSubmitting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
