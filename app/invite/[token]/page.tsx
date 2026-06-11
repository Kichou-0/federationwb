"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function InvitePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState("Vérification en cours...");
  const supabase = createClient();

  useEffect(() => {
    async function handle() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.replace("/login"); return; }
      const { data: invite } = await supabase.from("project_invites").select("*").eq("token", params.token).single();
      if (!invite) { setStatus("Lien invalide ou expiré."); return; }
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) { setStatus("Ce lien a expiré."); return; }
      const { data: existing } = await supabase.from("project_members").select("id").eq("project_id", invite.project_id).eq("user_id", session.user.id).single();
      if (!existing) {
        await supabase.from("project_members").insert({ project_id: invite.project_id, user_id: session.user.id, role: invite.role });
        await supabase.from("project_invites").update({ use_count: invite.use_count + 1 }).eq("id", invite.id);
      }
      window.location.replace(`/dashboard/projects/${invite.project_id}`);
    }
    handle();
  }, [params.token]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>{status}</p>
    </div>
  );
}
