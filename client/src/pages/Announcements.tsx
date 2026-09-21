import { useState } from "react";
import { AlertCircle, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ICON_SIZE } from "@/lib/icon-sizes";
import { useAuth } from "@/contexts/AuthContext";
import { useResource } from "@/hooks/useResource";
import { ApiError } from "@/lib/api";

interface Announcement {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  status: "draft" | "published";
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = { title: "", content: "", status: "draft" as Announcement["status"] };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function Announcements() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { items, isLoading, error, reload, create, update, remove } = useResource<Announcement>("/api/announcements");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, status: a.status });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await update(editing.id, form);
        toast.success("บันทึกการแก้ไขประกาศแล้ว");
      } else {
        await create(form);
        toast.success("เพิ่มประกาศแล้ว");
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
      toast.success("ลบประกาศแล้ว");
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
          <span className="eyebrow blue-eyebrow">COMMUNICATION</span>
          <h1>การประกาศ</h1>
          <p>จัดการประกาศข่าวสารสำหรับคริสตจักร</p>
        </div>
        {isAdmin && (
          <button className="primary-action" onClick={openCreate}>
            <Plus size={ICON_SIZE.sm} /> เพิ่มประกาศ
          </button>
        )}
      </div>

      <section className="member-panel card-surface">
        {isLoading ? (
          <div className="state-panel">
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <p>กำลังโหลดประกาศ...</p>
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
            <Megaphone size={ICON_SIZE["2xl"]} />
            <h3>ยังไม่มีประกาศ</h3>
            <p>{isAdmin ? "เริ่มเพิ่มประกาศแรกของคุณ" : "รอผู้ดูแลระบบเพิ่มประกาศ"}</p>
          </div>
        ) : (
          <div className="ministry-grid" style={{ padding: 16 }}>
            {items.map((a) => (
              <div className="entity-card" key={a.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <h3>{a.title}</h3>
                  <span className={`status-chip ${a.status === "published" ? "good" : "attention"}`}>
                    {a.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                  </span>
                </div>
                <p>{a.content}</p>
                <div className="entity-meta">
                  <span>เผยแพร่: {formatDate(a.publishDate)}</span>
                </div>
                {isAdmin && (
                  <div className="entity-actions">
                    <button className="cancel-button" onClick={() => openEdit(a)}>
                      <Pencil size={ICON_SIZE.sm} /> แก้ไข
                    </button>
                    <button className="danger-button" onClick={() => setDeleteTarget(a)}>
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
            <h3 style={{ margin: "0 0 14px" }}>{editing ? "แก้ไขประกาศ" : "เพิ่มประกาศ"}</h3>
            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="full-field">
                หัวข้อ
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label className="full-field">
                เนื้อหา
                <textarea
                  required
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </label>
              <label className="full-field">
                สถานะ
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Announcement["status"] })}
                >
                  <option value="draft">ฉบับร่าง</option>
                  <option value="published">เผยแพร่แล้ว</option>
                </select>
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
          title="ยืนยันการลบประกาศ"
          description={`ต้องการลบประกาศ "${deleteTarget.title}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
          isSubmitting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
