import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ProjectTabs from "@/components/ProjectTabs";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("*, owner:profiles!projects_owner_id_fkey(*)").eq("id", params.id).single();
  if (!project) notFound();

  const { data: membership } = await supabase.from("project_members").select("role").eq("project_id", params.id).eq("user_id", user.id).single();
  if (!membership) notFound();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return <ProjectTabs project={{ ...project, member_role: membership.role }} currentUser={profile} />;
}
