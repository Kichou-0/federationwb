"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar({ profile }: { profile: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login"); router.refresh();
  }

  const nav = [
    { href: "/dashboard", label: "🏠 Accueil" },
    { href: "/dashboard/projects/new", label: "➕ Nouveau projet" },
    { href: "/dashboard/settings", label: "⚙️ Paramètres" },
  ];

  return (
    <aside style={{ width: 240, background: "var(--sidebar)", color: "var(--sidebar-text)", display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0 }}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🗂️</div>
          <span style={{ fontWeight: 700, color: "white", fontSize: 16 }}>WorkTracker</span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {nav.map(item => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: 8, fontSize: 14,
              marginBottom: 2, textDecoration: "none",
              background: active ? "var(--brand)" : "transparent",
              color: active ? "white" : "var(--sidebar-text)",
            }}>{item.label}</Link>
          );
        })}
      </nav>
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 14, flexShrink: 0 }}>
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.first_name} {profile?.last_name}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--sidebar-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{profile?.username}</p>
          </div>
        </div>
        <button onClick={logout} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "transparent", border: "none", color: "var(--sidebar-text)", cursor: "pointer", fontSize: 14, textAlign: "left" }}>
          🚪 Se déconnecter
        </button>
      </div>
    </aside>
  );
}
