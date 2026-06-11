"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import ThemeProvider from "@/components/ThemeProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.replace("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(data);
      setChecked(true);
    });
  }, []);

  if (!checked) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Chargement...</p>
    </div>
  );

  return (
    <ThemeProvider profile={profile}>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar profile={profile} />
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </ThemeProvider>
  );
}
