import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: myProjects } = await supabase.from("projects")
    .select("*").eq("owner_id", user.id).order("updated_at", { ascending: false }).limit(6);

  const { data: memberRows } = await supabase.from("project_members")
    .select("role, project_id").eq("user_id", user.id).neq("role", "owner").limit(6);

  const sharedProjectIds = (memberRows ?? []).map((r: any) => r.project_id);
  let sharedProjects: any[] = [];
  if (sharedProjectIds.length > 0) {
    const { data } = await supabase.from("projects").select("*").in("id", sharedProjectIds);
    sharedProjects = (data ?? []).map((p: any) => {
      const member = (memberRows ?? []).find((r: any) => r.project_id === p.id);
      return { ...p, member_role: member?.role };
    });
  }

  const { count: todoCount } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_to", user.id).eq("status", "todo");
  const { count: doneCount } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_to", user.id).eq("status", "done");

  const statusColors: any = { active: "#22c55e", completed: "#6366f1", paused: "#f59e0b", cancelled: "#ef4444" };
  const statusLabels: any = { active: "Actif", completed: "Terminé", paused: "En pause", cancelled: "Annulé" };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Bonjour, {profile?.first_name} 👋</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>Voici un aperçu de vos projets</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Mes projets", value: myProjects?.length ?? 0, icon: "📁" },
          { label: "Partagés avec moi", value: sharedProjects.length, icon: "🤝" },
          { label: "Tâches à faire", value: todoCount ?? 0, icon: "📋" },
          { label: "Tâches terminées", value: doneCount ?? 0, icon: "✅" },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Mes projets</h2>
          <Link href="/dashboard/projects/new" className="btn btn-primary" style={{ textDecoration: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13 }}>+ Nouveau projet</Link>
        </div>
        {!myProjects?.length ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            <p style={{ fontSize: 40, margin: "0 0 8px" }}>📁</p>
            <p style={{ fontWeight: 500, margin: "0 0 4px" }}>Aucun projet pour le moment</p>
            <Link href="/dashboard/projects/new" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-block", marginTop: 16, padding: "8px 16px", borderRadius: 8, fontSize: 13 }}>Créer un projet</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {(myProjects ?? []).map((p: any) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: 20, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{p.title}</h3>
                    <span className="badge" style={{ background: `${statusColors[p.status]}20`, color: statusColors[p.status] }}>{statusLabels[p.status]}</span>
                  </div>
                  {p.description && <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{p.description}</p>}
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Mis à jour {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true, locale: fr })}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {sharedProjects.length > 0 && (
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Partagés avec moi</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {sharedProjects.map((p: any) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: 20, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{p.title}</h3>
                    <span className="badge" style={{ background: "#6366f120", color: "#6366f1" }}>{p.member_role === "editor" ? "Éditeur" : "Lecteur"}</span>
                  </div>
                  {p.description && <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>{p.description}</p>}
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Mis à jour {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true, locale: fr })}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
