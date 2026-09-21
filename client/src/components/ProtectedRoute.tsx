import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
        <p>กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
