"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true); setError("");
    const { data: profile } = await supabase.from("profiles").select("email").eq("username", username).single();
    if (!profile) { setError("Nom d'utilisateur introuvable."); setLoading(false); return; }
    const { error: err } = await supabase.auth.signInWithPassword({ email: profile.email, password });
    if (err) { setError("Mot de passe incorrect."); setLoading(false); return; }
    router.push("/dashboard"); router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="card" style={{ padding: 32, width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24 }}>🗂️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>WorkTracker</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>Connectez-vous à votre espace</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Nom d&apos;utilisateur</label>
            <input className="input" placeholder="votre_pseudo" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Mot de passe</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: 14, background: "#fef2f2", padding: "8px 12px", borderRadius: 8, margin: 0 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p style={{ textAlign: "center", fontSize: 14, color: "var(--muted)", marginTop: 24 }}>
          Pas encore de compte ? <Link href="/register" style={{ color: "var(--brand)", fontWeight: 500 }}>S&apos;inscrire</Link>
        </p>
      </div>
    </div>
  );
}
