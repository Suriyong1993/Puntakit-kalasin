import { useEffect } from "react";
import { SignIn } from "@clerk/react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/layout/Logo";
import Login from "@/pages/Login";

/**
 * Clerk-hosted sign-in rendered on the /login route (virtual routing).
 * Falls back to the legacy form when Clerk is not configured in this build.
 */
export default function ClerkSignInPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Preserve the legacy redirect rule: members go to the PWA (/app),
  // everyone else lands on the dashboard.
  useEffect(() => {
    if (user) {
      navigate(user.role === "member" ? "/app" : "/");
    }
  }, [user, navigate]);

  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return <Login />;
  }

  return (
    <div className="login-shell">
      <div className="login-card" data-testid="clerk-sign-in">
        <div className="login-logo">
          <Logo />
        </div>
        {/* hash routing keeps Clerk's sub-steps (#/factor-one, ...) inside the
            /login route so wouter's SPA routes stay untouched */}
        <SignIn routing="hash" fallbackRedirectUrl="/" signUpUrl="/login" />
      </div>
    </div>
  );
}
