import type { CurrentProfile } from "@/types/database";
import { getSupabaseClient } from "./supabase";

export type SignedInProfile = CurrentProfile & { userId: string };

export const authService = {
  async currentProfile(): Promise<SignedInProfile | null> {
    const client = getSupabaseClient();
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw new Error(userError.message);
    if (!userData.user) return null;

    const { data, error } = await client
      .from("profiles")
      .select("id, display_name, email, role, active")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data || !data.active) return null;

    return { ...data, userId: userData.user.id };
  },

  async sendMagicLink(email: string): Promise<void> {
    const { error } = await getSupabaseClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) throw new Error(error.message);
  },

  async signOut(): Promise<void> {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw new Error(error.message);
  },
};

export function canManageMembers(role: SignedInProfile["role"] | undefined): boolean {
  return Boolean(
    role && ["super_admin", "admin", "area_leader", "ministry_leader", "group_leader"].includes(role)
  );
}

export function canDeactivateMembers(role: SignedInProfile["role"] | undefined): boolean {
  return role === "super_admin" || role === "admin";
}
