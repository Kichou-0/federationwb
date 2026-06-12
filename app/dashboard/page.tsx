"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [sharedProjects, setSharedProjects] = useState<any[]>([]);
  const [todoCount, setTodoCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;
    const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(p);
    const { data: mp } = await supabase.from("projects").select("*").eq("owner_id", uid).order("updated_at", { ascending: false }).limit(6);
    setMyProjects(mp ?? []);
    const { data: memberRows } = await supabase.from("project_members").select("role, project_id").eq("user_id", uid).neq("role", "owner").limit(6);
   if (memberRows && memberRows.length > 0) {
   const ids = memberRows.map((r: any) => r.project_id);
   const { data: sp } = await supabase.from("projects").select("*").in("id", ids);
   if (sp && sp.length > 0) {
    setSharedProjects(sp.map((p: any) => ({ ...p, member_role: memberRows.find((r: any) => r.project_id === p.id)?.role })));
   }
   } else {
    setSharedProjects([]);
   }
    const { count: tc } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_to", uid).eq("status", "todo");
    const { count: dc } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_to", uid).eq("status", "done");
    setTodoCount(tc ?? 0);
    setDoneCount(dc ?? 0);
  }

  const statusColors: any = { active: "#22c55e", completed: "#6366f1", paused: "#f59e0b", cancelled: "#ef4444" };
  const statusLabels: any = { active: "Actif", completed: "Terminé", paused: "En pause", cancelled: "Annulé" };

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), day = Math.floor(diff/86400000);
    if (day > 0) return `il y a ${day}j`; if (h > 0) return `il y a ${h}h`; if (m > 0) return `il y a ${m}min`; return "à l'instant";
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Bonjour, {profile?.first_name} 👋</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>Voici un aperçu de vos projets</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Mes projets", value: myProjects.length, icon: "📁" },
          { label: "Partagés avec moi", value: sharedProjects.length, icon: "🤝" },
          { label: "Tâches à faire", value: todoCount, icon: "📋" },
          { label: "Tâches terminées", value: doneCount, icon: "✅" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Mes projets</h2>
          <Link href="/dashboard/projects/new" className="btn btn-primary" style={{ textDecoration: "none", fontSize: 13, padding: "7px 16px", borderRadius: 8 }}>+ Nouveau projet</Link>
        </div>
        {!myProjects.length ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            <p style={{ fontSize: 36, margin: "0 0 8px" }}>📁</p>
            <p style={{ margin: 0 }}>Aucun projet pour le moment</p>
            <Link href="/dashboard/projects/new" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-block", marginTop: 14, fontSize: 13, padding: "7px 16px", borderRadius: 8 }}>Créer un projet</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {myProjects.map((p: any) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: 18, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{p.title}</span>
                    <span className="badge" style={{ background: `${statusColors[p.status]}20`, color: statusColors[p.status] }}>{statusLabels[p.status]}</span>
                  </div>
                  {p.description && <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>{p.description}</p>}
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Mis à jour {timeAgo(p.updated_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      {sharedProjects.length > 0 && (
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Partagés avec moi</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {sharedProjects.map((p: any) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: 18, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{p.title}</span>
                    <span className="badge" style={{ background: "#6366f120", color: "#6366f1" }}>{p.member_role === "editor" ? "Éditeur" : "Lecteur"}</span>
                  </div>
                  {p.description && <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>{p.description}</p>}
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Mis à jour {timeAgo(p.updated_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
