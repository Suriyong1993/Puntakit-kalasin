import { useEffect, useState } from "react";
import { AlertCircle, Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ICON_SIZE } from "@/lib/icon-sizes";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";

interface ChurchProfile {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  updatedAt: string;
}

const EMPTY_FORM = { name: "", address: "", phone: "", email: "", description: "" };

export default function Church() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    api
      .get<ChurchProfile | null>("/api/church-profile")
      .then((data) => {
        if (data) {
          setForm({
            name: data.name,
            address: data.address ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            description: data.description ?? "",
          });
          setUpdatedAt(data.updatedAt);
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await api.put<ChurchProfile>("/api/church-profile", form);
      setUpdatedAt(saved.updatedAt);
      toast.success("บันทึกข้อมูลคริสตจักรแล้ว");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-heading">
        <div>
          <span className="eyebrow blue-eyebrow">CHURCH PROFILE</span>
          <h1>ข้อมูลคริสตจักร</h1>
          <p>ข้อมูลพื้นฐานของคริสตจักรที่แสดงต่อสมาชิกและผู้เยี่ยมชม</p>
        </div>
      </div>

      <section className="member-panel card-surface" style={{ padding: 20 }}>
        {isLoading ? (
          <div className="state-panel">
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <p>กำลังโหลดข้อมูลคริสตจักร...</p>
          </div>
        ) : error ? (
          <div className="state-panel error-panel">
            <AlertCircle size={ICON_SIZE["2xl"]} />
            <h3>โหลดข้อมูลไม่สำเร็จ</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={load}>
              ลองใหม่
            </button>
          </div>
        ) : (
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="full-field">
              ชื่อคริสตจักร
              <input
                required
                disabled={!isAdmin}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              เบอร์โทร
              <input disabled={!isAdmin} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              อีเมล
              <input
                type="email"
                disabled={!isAdmin}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="full-field">
              ที่อยู่
              <input disabled={!isAdmin} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </label>
            <label className="full-field">
              รายละเอียด
              <textarea
                rows={5}
                disabled={!isAdmin}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            {updatedAt && (
              <p className="full-field" style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                <Building2 size={ICON_SIZE.xs} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
                อัปเดตล่าสุด: {new Date(updatedAt).toLocaleString("th-TH")}
              </p>
            )}
            {isAdmin && (
              <div className="modal-actions full-field">
                <button type="submit" className="primary-action" disabled={saving}>
                  <Save size={ICON_SIZE.sm} /> {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            )}
          </form>
        )}
      </section>
    </AppLayout>
  );
}
