import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Heart,
  MapPin,
  Pencil,
  Search,
  SlidersHorizontal,
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
import { useResource } from "@/hooks/useResource";
import { ApiError } from "@/lib/api";

interface Member {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string;
  area: string | null;
  group: string | null;
  status: "ติดตามแล้ว" | "ต้องติดตาม";
  joinedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  role: "สมาชิก",
  area: "",
  group: "",
  status: "ต้องติดตาม" as Member["status"],
  notes: "",
};

const tones = ["blue", "pink", "orange", "purple", "green"] as const;
function toneFor(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return tones[sum % tones.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function Members() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { items: members, isLoading, error, reload, create, update, remove } = useResource<Member>("/api/members");

  const [query, setQuery] = useState("");
  const [area, setArea] = useState("ทั้งหมด");
  const [status, setStatus] = useState("ทั้งหมด");
  const [role, setRole] = useState("ทั้งหมด");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(
    () =>
      members.filter((m) => {
        const hay = `${m.name} ${m.role} ${m.area ?? ""} ${m.group ?? ""}`.toLowerCase();
        return (
          (!query || hay.includes(query.toLowerCase())) &&
          (area === "ทั้งหมด" || m.area === area) &&
          (status === "ทั้งหมด" || m.status === status) &&
          (role === "ทั้งหมด" || m.role === role)
        );
      }),
    [members, query, area, status, role]
  );

  const uniqueAreas = Array.from(new Set(members.map((m) => m.area).filter(Boolean))) as string[];
  const uniqueRoles = Array.from(new Set(members.map((m) => m.role)));

  const hasFilter = query || area !== "ทั้งหมด" || status !== "ทั้งหมด" || role !== "ทั้งหมด";
  const clearFilters = () => {
    setQuery("");
    setArea("ทั้งหมด");
    setStatus("ทั้งหมด");
    setRole("ทั้งหมด");
  };

  const followedUp = members.filter((m) => m.status === "ติดตามแล้ว").length;
  const addedThisMonth = members.filter((m) => {
    const d = new Date(m.joinedAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({
      name: m.name,
      phone: m.phone ?? "",
      email: m.email ?? "",
      role: m.role,
      area: m.area ?? "",
      group: m.group ?? "",
      status: m.status,
      notes: m.notes ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await update(editing.id, form);
        toast.success("บันทึกการแก้ไขสมาชิกแล้ว");
      } else {
        await create(form);
        toast.success("เพิ่มสมาชิกแล้ว");
      }
      setFormOpen(false);
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
      await remove(deleteTarget.id);
      toast.success("ลบสมาชิกแล้ว");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-heading">
        <div>
          <span className="eyebrow blue-eyebrow">PEOPLE &amp; COMMUNITY</span>
          <h1>สมาชิก</h1>
          <p>จัดการข้อมูลสมาชิกและติดตามการเติบโตของคนในคริสตจักร</p>
        </div>
        {isAdmin && (
          <button className="primary-action" onClick={openCreate}>
            <UserPlus size={ICON_SIZE.sm} /> เพิ่มสมาชิก
          </button>
        )}
      </div>

      <div className="member-summary">
        <div className="summary-card blue">
          <span className="summary-icon">
            <Users size={ICON_SIZE.lg} />
          </span>
          <div>
            <small>สมาชิกทั้งหมด</small>
            <strong>{members.length}</strong>
            <span>คน</span>
          </div>
        </div>
        <div className="summary-card green">
          <span className="summary-icon">
            <Heart size={ICON_SIZE.lg} />
          </span>
          <div>
            <small>ติดตามแล้ว</small>
            <strong>{followedUp}</strong>
            <span>คน</span>
          </div>
        </div>
        <div className="summary-card orange">
          <span className="summary-icon">
            <CalendarDays size={ICON_SIZE.lg} />
          </span>
          <div>
            <small>เพิ่มในเดือนนี้</small>
            <strong>{addedThisMonth}</strong>
            <span>คน</span>
          </div>
        </div>
        <div className="summary-card purple">
          <span className="summary-icon">
            <MapPin size={ICON_SIZE.lg} />
          </span>
          <div>
            <small>พื้นที่ทั้งหมด</small>
            <strong>{uniqueAreas.length}</strong>
            <span>พื้นที่</span>
          </div>
        </div>
      </div>

      <section className="member-panel card-surface">
        {isLoading ? (
          <div className="state-panel">
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <p>กำลังโหลดข้อมูลสมาชิก...</p>
          </div>
        ) : error ? (
          <div className="state-panel error-panel">
            <AlertCircle size={ICON_SIZE["2xl"]} />
            <h3>โหลดข้อมูลไม่สำเร็จ</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={reload}>
              ลองใหม่
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="state-panel">
            <Users size={ICON_SIZE["2xl"]} />
            <h3>ยังไม่มีข้อมูลสมาชิก</h3>
            <p>{isAdmin ? "เริ่มเพิ่มสมาชิกคนแรกของคุณ" : "รอผู้ดูแลระบบเพิ่มข้อมูลสมาชิก"}</p>
          </div>
        ) : (
          <>
            <div className="member-toolbar">
              <label className="member-search">
                <Search size={ICON_SIZE.md} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาชื่อสมาชิก กลุ่ม หรือพื้นที่..."
                  aria-label="ค้นหาสมาชิก"
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="ล้างการค้นหา">
                    <X size={ICON_SIZE.xs} />
                  </button>
                )}
              </label>

              <div className="filter-label">
                <SlidersHorizontal size={ICON_SIZE.sm} /> ตัวกรอง
              </div>

              <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="กรองพื้นที่">
                <option value="ทั้งหมด">ทุกพื้นที่</option>
                {uniqueAreas.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>

              <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="กรองสถานะ">
                <option value="ทั้งหมด">ทุกสถานะ</option>
                <option>ติดตามแล้ว</option>
                <option>ต้องติดตาม</option>
              </select>

              <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="กรองบทบาท">
                <option value="ทั้งหมด">ทุกบทบาท</option>
                {uniqueRoles.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="active-filter-row">
              <span>
                แสดง {filtered.length} จาก {members.length} รายการ
              </span>
              {hasFilter && <button onClick={clearFilters}>ล้างตัวกรองทั้งหมด</button>}
            </div>

            <div className="member-table-wrap">
              <table className="member-table">
                <thead>
                  <tr>
                    <th>สมาชิก</th>
                    <th>บทบาท</th>
                    <th>พื้นที่</th>
                    <th>กลุ่ม</th>
                    <th>สถานะ</th>
                    <th>เข้าร่วมเมื่อ</th>
                    {isAdmin && <th />}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((member) => {
                    const tone = toneFor(member.name);
                    return (
                      <tr key={member.id}>
                        <td>
                          <div className="member-name">
                            <span className={`member-avatar ${tone}`}>{member.name.slice(0, 1)}</span>
                            <div>
                              <strong>{member.name}</strong>
                              <small>{member.role}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-chip ${tone}`}>{member.role}</span>
                        </td>
                        <td>{member.area ?? "-"}</td>
                        <td>{member.group ?? "-"}</td>
                        <td>
                          <span className={`status-chip ${member.status === "ติดตามแล้ว" ? "good" : "attention"}`}>
                            {member.status}
                          </span>
                        </td>
                        <td>{formatDate(member.joinedAt)}</td>
                        {isAdmin && (
                          <td>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                className="row-menu"
                                aria-label={`แก้ไข ${member.name}`}
                                onClick={() => openEdit(member)}
                              >
                                <Pencil size={ICON_SIZE.md} />
                              </button>
                              <button
                                className="row-menu"
                                aria-label={`ลบ ${member.name}`}
                                onClick={() => setDeleteTarget(member)}
                              >
                                <Trash2 size={ICON_SIZE.md} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="empty-members">
                  <Users size={ICON_SIZE["2xl"]} />
                  <h3>ไม่พบสมาชิก</h3>
                  <p>ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง</p>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 14px" }}>{editing ? "แก้ไขสมาชิก" : "เพิ่มสมาชิก"}</h3>
            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="full-field">
                ชื่อ-นามสกุล
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                เบอร์โทร
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label>
                อีเมล
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label>
                บทบาท
                <input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </label>
              <label>
                สถานะ
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Member["status"] })}>
                  <option>ติดตามแล้ว</option>
                  <option>ต้องติดตาม</option>
                </select>
              </label>
              <label>
                พื้นที่
                <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
              </label>
              <label>
                กลุ่ม
                <input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} />
              </label>
              <label className="full-field">
                หมายเหตุ
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
              <div className="modal-actions full-field">
                <button type="button" className="cancel-button" onClick={() => setFormOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="primary-action" disabled={submitting}>
                  {submitting ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="ยืนยันการลบสมาชิก"
          description={`ต้องการลบ "${deleteTarget.name}" ออกจากรายชื่อสมาชิกใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
          isSubmitting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
