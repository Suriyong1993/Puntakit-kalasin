import { useState } from "react";
import { useLocation } from "wouter";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { ICON_SIZE } from "@/lib/icon-sizes";
import { Logo } from "@/components/layout/Logo";

export default function Login() {
  const { login, user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("เข้าสู่ระบบสำเร็จ");
      navigate("/");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">
          <Logo />
        </div>
        <h1>เข้าสู่ระบบ</h1>
        <p className="login-sub">เข้าสู่ระบบเพื่อจัดการข้อมูลคริสตจักรพันธกิจกาฬสินธุ์</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="full-field">
            อีเมล
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="full-field">
            รหัสผ่าน
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          {error && (
            <p className="full-field field-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-action modal-full-button full-field" type="submit" disabled={submitting}>
            <LogIn size={ICON_SIZE.sm} /> {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
