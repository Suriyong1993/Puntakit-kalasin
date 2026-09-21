import { useState } from "react";
import { AlertCircle, CalendarDays, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ICON_SIZE } from "@/lib/icon-sizes";
import { useAuth } from "@/contexts/AuthContext";
import { useResource } from "@/hooks/useResource";
import { ApiError } from "@/lib/api";

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  location: string | null;
  category: "worship" | "activity" | "meeting" | "other";
  status: "scheduled" | "cancelled" | "completed";
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABEL: Record<Event["category"], string> = {
  worship: "นมัสการ",
  activity: "กิจกรรม",
  meeting: "ประชุม",
  other: "อื่นๆ",
};

const STATUS_LABEL: Record<Event["status"], string> = {
  scheduled: "กำหนดการ",
  cancelled: "ยกเลิก",
  completed: "เสร็จสิ้น",
};

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  eventDate: "",
  location: "",
  category: "worship" as Event["category"],
  status: "scheduled" as Event["status"],
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Events() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { items, isLoading, error, reload, create, update, remove } = useResource<Event>("/api/events");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (ev: Event) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      eventDate: toLocalInput(ev.eventDate),
      location: ev.location ?? "",
      category: ev.category,
      status: ev.status,
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, eventDate: new Date(form.eventDate).toISOString() };
      if (editing) {
        await update(editing.id, payload);
        toast.success("บันทึกการแก้ไขกิจกรรมแล้ว");
      } else {
        await create(payload);
        toast.success("เพิ่มกิจกรรมแล้ว");
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
      toast.success("ลบกิจกรรมแล้ว");
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
          <span className="eyebrow blue-eyebrow">WORSHIP &amp; ACTIVITY</span>
          <h1>การนมัสการ / กิจกรรม</h1>
          <p>จัดตารางการนมัสการและกิจกรรมของคริสตจักร</p>
        </div>
        {isAdmin && (
          <button className="primary-action" onClick={openCreate}>
            <Plus size={ICON_SIZE.sm} /> เพิ่มกิจกรรม
          </button>
        )}
      </div>

      <section className="member-panel card-surface">
        {isLoading ? (
          <div className="state-panel">
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <p>กำลังโหลดกิจกรรม...</p>
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
        ) : items.length === 0 ? (
          <div className="state-panel">
            <CalendarDays size={ICON_SIZE["2xl"]} />
            <h3>ยังไม่มีกิจกรรม</h3>
            <p>{isAdmin ? "เริ่มเพิ่มกิจกรรมแรกของคุณ" : "รอผู้ดูแลระบบเพิ่มกิจกรรม"}</p>
          </div>
        ) : (
          <div className="event-grid" style={{ padding: 16 }}>
            {items.map((ev) => (
              <div className="entity-card" key={ev.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <h3>{ev.title}</h3>
                  <span className={`status-chip ${ev.status === "cancelled" ? "attention" : "good"}`}>
                    {STATUS_LABEL[ev.status]}
                  </span>
                </div>
                {ev.description && <p>{ev.description}</p>}
                <div className="entity-meta">
                  <span>
                    <CalendarDays size={ICON_SIZE.xs} /> {formatDateTime(ev.eventDate)}
                  </span>
                  {ev.location && (
                    <span>
                      <MapPin size={ICON_SIZE.xs} /> {ev.location}
                    </span>
                  )}
                  <span className="role-chip blue">{CATEGORY_LABEL[ev.category]}</span>
                </div>
                {isAdmin && (
                  <div className="entity-actions">
                    <button className="cancel-button" onClick={() => openEdit(ev)}>
                      <Pencil size={ICON_SIZE.sm} /> แก้ไข
                    </button>
                    <button className="danger-button" onClick={() => setDeleteTarget(ev)}>
                      <Trash2 size={ICON_SIZE.sm} /> ลบ
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 14px" }}>{editing ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}</h3>
            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="full-field">
                ชื่อกิจกรรม
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label>
                วันเวลา
                <input
                  type="datetime-local"
                  required
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                />
              </label>
              <label>
                สถานที่
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </label>
              <label>
                ประเภท
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Event["category"] })}
                >
                  <option value="worship">นมัสการ</option>
                  <option value="activity">กิจกรรม</option>
                  <option value="meeting">ประชุม</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </label>
              <label>
                สถานะ
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Event["status"] })}>
                  <option value="scheduled">กำหนดการ</option>
                  <option value="cancelled">ยกเลิก</option>
                  <option value="completed">เสร็จสิ้น</option>
                </select>
              </label>
              <label className="full-field">
                รายละเอียด
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
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
          title="ยืนยันการลบกิจกรรม"
          description={`ต้องการลบ "${deleteTarget.title}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
          isSubmitting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
