"use client";
import { useState } from "react";
import ProjectOverview from "./project/ProjectOverview";
import ProjectTasks from "./project/ProjectTasks";
import ProjectReviews from "./project/ProjectReviews";
import ProjectMembers from "./project/ProjectMembers";

export default function ProjectTabs({ project, currentUser }: { project: any; currentUser: any }) {
  const [tab, setTab] = useState("overview");
  const isOwner = project.member_role === "owner";
  const canEdit = project.member_role === "owner" || project.member_role === "editor";
  const roleLabel = isOwner ? "Propriétaire" : canEdit ? "Éditeur" : "Lecteur";
  const roleColor = isOwner ? "#f59e0b" : canEdit ? "#22c55e" : "#64748b";
  const statusColors: any = { active: "#22c55e", completed: "#6366f1", paused: "#f59e0b", cancelled: "#ef4444" };
  const statusLabels: any = { active: "Actif", completed: "Terminé", paused: "En pause", cancelled: "Annulé" };
  const tabs = [
    { id: "overview", label: "📋 Présentation" },
    { id: "tasks", label: "✅ Tâches" },
    { id: "reviews", label: "💬 Avis" },
    { id: "members", label: "👥 Membres" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "32px 32px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <span className="badge" style={{ background: `${statusColors[project.status]}20`, color: statusColors[project.status] }}>{statusLabels[project.status]}</span>
          <span className="badge" style={{ background: `${roleColor}20`, color: roleColor }}>{roleLabel}</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>{project.title}</h1>
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 500, background: "transparent", border: "none", cursor: "pointer",
              borderBottom: tab === t.id ? "2px solid var(--brand)" : "2px solid transparent",
              color: tab === t.id ? "var(--brand)" : "var(--muted)"
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
        {tab === "overview" && <ProjectOverview project={project} currentUser={currentUser} canEdit={canEdit} />}
        {tab === "tasks" && <ProjectTasks project={project} currentUser={currentUser} canEdit={canEdit} />}
        {tab === "reviews" && <ProjectReviews project={project} currentUser={currentUser} />}
        {tab === "members" && <ProjectMembers project={project} currentUser={currentUser} isOwner={isOwner} />}
      </div>
    </div>
  );
}
