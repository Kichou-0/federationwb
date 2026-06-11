"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProjectMembers({ project, currentUser, isOwner }: { project: any; currentUser: any; isOwner: boolean }) {
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [newRole, setNewRole] = useState("viewer");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: m } = await supabase.from("project_members").select("*, profile:profiles!project_members_user_id_fkey(*)").eq("project_id", project.id);
    setMembers(m ?? []);
    if (isOwner) {
      const { data: i } = await supabase.from("project_invites").select("*").eq("project_id", project.id).order("created_at", { ascending: false });
      setInvites(i ?? []);
    }
  }

  async function createInvite() {
    setCreating(true);
    await supabase.from("project_invites").insert({ project_id: project.id, created_by: currentUser?.id, role: newRole });
    await loadData(); setCreating(false);
  }

  async function deleteInvite(id: string) {
    await supabase.from("project_invites").delete().eq("id", id);
    setInvites(i => i.filter(x => x.id !== id));
  }

  async function removeMember(memberId: string) {
    await supabase.from("project_members").delete().eq("id", memberId);
    setMembers(m => m.filter(x => x.id !== memberId));
  }

  async function updateMemberRole(memberId: string, role: string) {
    await supabase.from("project_members").update({ role }).eq("id", memberId);
    setMembers(m => m.map(x => x.id === memberId ? { ...x, role } : x));
  }

  async function copyLink(invite: any) {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`);
    setCopiedId(invite.id); setTimeout(() => setCopiedId(null), 2000);
  }

  const roleColors: any = { owner: "#f59e0b", editor: "#22c55e", viewer: "#64748b" };
  const roleLabels: any = { owner: "Propriétaire", editor: "Éditeur", viewer: "Lecteur" };

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Membres ({members.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {members.map((m: any) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 14, flexShrink: 0 }}>
                {m.profile?.first_name?.[0]}{m.profile?.last_name?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{m.profile?.first_name} {m.profile?.last_name}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{m.profile?.job_title} · {m.profile?.company}</p>
              </div>
              {isOwner && m.role !== "owner" ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} value={m.role} onChange={e => updateMemberRole(m.id, e.target.value)}>
                    <option value="editor">Éditeur</option><option value="viewer">Lecteur</option>
                  </select>
                  <button onClick={() => removeMember(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16 }}>🗑️</button>
                </div>
              ) : (
                <span className="badge" style={{ background: `${roleColors[m.role]}20`, color: roleColors[m.role] }}>{roleLabels[m.role]}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Liens d&apos;invitation</h2>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <select className="input" value={newRole} onChange={e => setNewRole(e.target.value)} style={{ flex: 1 }}>
              <option value="viewer">Lecteur (lecture seule)</option>
              <option value="editor">Éditeur (peut modifier)</option>
            </select>
            <button className="btn btn-primary" onClick={createInvite} disabled={creating} style={{ fontSize: 13, whiteSpace: "nowrap" }}>{creating ? "..." : "Créer un lien"}</button>
          </div>
          {invites.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>Aucun lien d&apos;invitation actif</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {invites.map((inv: any) => (
                <div key={inv.id} style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 500 }}>{inv.role === "editor" ? "🟢 Éditeur" : "🔵 Lecteur"}</p>
                    <p style={{ margin: "0 0 2px", fontSize: 11, fontFamily: "monospace", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{window?.location?.origin}/invite/{inv.token}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>Utilisé {inv.use_count} fois</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => copyLink(inv)} style={{ fontSize: 12, whiteSpace: "nowrap" }}>{copiedId === inv.id ? "✅ Copié !" : "📋 Copier"}</button>
                  <button onClick={() => deleteInvite(inv.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16 }}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
