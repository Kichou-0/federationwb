"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SettingsTabs from "@/components/SettingsTabs";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.replace("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(data);
    });
  }, []);

  if (!profile) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Chargement...</p>
    </div>
  );

  return <SettingsTabs profile={profile} />;
}
