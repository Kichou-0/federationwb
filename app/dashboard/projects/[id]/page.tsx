"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProjectTabs from "@/components/ProjectTabs";

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.replace("/login"); return; }
      const { data: project } = await supabase.from("projects").select("*, owner:profiles!projects_owner_id_fkey(*)").eq("id", params.id).single();
      if (!project) { window.location.replace("/dashboard"); return; }
      const { data: membership } = await supabase.from("project_members").select("role").eq("project_id", params.id).eq("user_id", session.user.id).single();
      if (!membership) { window.location.replace("/dashboard"); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setData({ project: { ...project, member_role: membership.role }, currentUser: profile });
    }
    load();
  }, [params.id]);

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Chargement...</p>
    </div>
  );

  return <ProjectTabs project={data.project} currentUser={data.currentUser} />;
}
