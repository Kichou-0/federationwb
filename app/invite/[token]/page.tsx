import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/invite/${params.token}`);

  const { data: invite } = await supabase.from("project_invites").select("*, project:projects(title)").eq("token", params.token).single();

  if (!invite) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 400 }}>
        <p style={{ fontSize: 48, margin: "0 0 12px" }}>❌</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Lien invalide</h1>
        <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>Ce lien n&apos;existe pas ou a expiré.</p>
        <a href="/dashboard" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>Retour à l&apos;accueil</a>
      </div>
    </div>
  );

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 400 }}>
        <p style={{ fontSize: 48, margin: "0 0 12px" }}>⏰</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Lien expiré</h1>
        <a href="/dashboard" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-block", marginTop: 8 }}>Retour</a>
      </div>
    </div>
  );

  const { data: existing } = await supabase.from("project_members").select("id").eq("project_id", invite.project_id).eq("user_id", user.id).single();
  if (!existing) {
    await supabase.from("project_members").insert({ project_id: invite.project_id, user_id: user.id, role: invite.role });
    await supabase.from("project_invites").update({ use_count: invite.use_count + 1 }).eq("id", invite.id);
  }

  redirect(`/dashboard/projects/${invite.project_id}`);
}
