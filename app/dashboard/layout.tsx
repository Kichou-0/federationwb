"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import ThemeProvider from "@/components/ThemeProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(data);
      setLoading(false);
    }
    check();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)" }}>Chargement...</p>
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
