import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ThemeProvider from "@/components/ThemeProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (
    <ThemeProvider profile={profile}>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar profile={profile} />
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </ThemeProvider>
  );
}
