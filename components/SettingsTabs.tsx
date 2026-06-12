"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f97316","#f59e0b","#22c55e","#14b8a6","#0ea5e9","#3b82f6"];

export default function SettingsTabs({ profile }: { profile: any }) {
  const [tab, setTab] = useState<"account"|"appearance">("account");
  const [form, setForm] = useState({ first_name: profile?.first_name ?? "", last_name: profile?.last_name ?? "", username: profile?.username ?? "", phone: profile?.phone ?? "", job_title: profile?.job_title ?? "", company: profile?.company ?? "" });
  const [password, setPassword] = useState({ new: "", confirm: "" });
  const [themeColor, setThemeColor] = useState(profile?.theme_color ?? "#6366f1");
  const [themeMode, setThemeMode] = useState(profile?.theme_mode ?? "light");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function saveAccount() {
    setSaving(true); setError(""); setSuccess("");
    const { error: e } = await supabase.from("profiles").update(form).eq("id", profile?.id);
    if (e) setError(e.message); else { setSuccess("Profil mis à jour !"); router.refresh(); }
    setSaving(false);
  }

  async function changePassword() {
    if (password.new !== password.confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setSaving(true);
    const { error: e } = await supabase.auth.updateUser({ password: password.new });
    if (e) setError(e.message); else { setSuccess("Mot de passe modifié !"); setPassword({ new: "", confirm: "" }); }
    setSaving(false);
  }

  async function saveAppearance() {
    setSaving(true);
    await supabase.from("profiles").update({ theme_color: themeColor, theme_mode: themeMode }).eq("id", profile?.id);
    const root = document.documentElement;
    root.style.setProperty("--brand", themeColor);
    if (themeMode === "dark") root.classList.add("dark"); else root.classList.remove("dark");
    setSuccess("Apparence mise à jour !"); setSaving(false);
  }

  async function uploadAvatar(file: File) {
  if (!file) return;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const ext = file.name.split('.').pop();
  const path = `avatars/${user.id}.${ext}`;
  
  const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadErr) { 
    setError("Erreur upload : " + uploadErr.message);
    return; 
  }
  
  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
  await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  
  setSuccess("Photo mise à jour !");
  setTimeout(() => router.refresh(), 1000);
}
  
  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
  await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  
  setSuccess("Photo mise à jour !");
  setTimeout(() => router.refresh(), 1000);
}

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Paramètres</h1>
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg)", borderRadius: 10, padding: 4 }}>
        {(["account", "appearance"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSuccess(""); setError(""); }} style={{ flex: 1, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, background: tab === t ? "var(--surface)" : "transparent", color: tab === t ? "var(--text)" : "var(--muted)" }}>
            {t === "account" ? "👤 Mon compte" : "🎨 Apparence"}
          </button>
        ))}
      </div>

      {success && <p style={{ color: "#22c55e", fontSize: 14, background: "#f0fdf4", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>{success}</p>}
      {error && <p style={{ color: "#ef4444", fontSize: 14, background: "#fef2f2", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>{error}</p>}

      {tab === "account" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Photo de profil</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 22 }}>
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </div>
              <div>
                <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ fontSize: 13 }}>Changer la photo</button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>JPG, PNG · 5MB max</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Informations personnelles</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Prénom</label><input className="input" value={form.first_name} onChange={e => set("first_name", e.target.value)} /></div>
              <div><label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Nom</label><input className="input" value={form.last_name} onChange={e => set("last_name", e.target.value)} /></div>
            </div>
            {[["username","Nom d'utilisateur"],["phone","Téléphone"],["job_title","Poste"],["company","Entreprise"]].map(([k, label]) => (
              <div key={k}><label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{label}</label><input className="input" value={(form as any)[k]} onChange={e => set(k, e.target.value)} /></div>
            ))}
            <button className="btn btn-primary" onClick={saveAccount} disabled={saving} style={{ fontSize: 13, alignSelf: "flex-start" }}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
          </div>

          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Changer le mot de passe</h2>
            {[["new","Nouveau mot de passe"],["confirm","Confirmer"]].map(([k, label]) => (
              <div key={k}><label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{label}</label><input className="input" type="password" value={(password as any)[k]} onChange={e => setPassword(p => ({ ...p, [k]: e.target.value }))} /></div>
            ))}
            <button className="btn btn-primary" onClick={changePassword} disabled={saving} style={{ fontSize: 13, alignSelf: "flex-start" }}>Changer le mot de passe</button>
          </div>
        </div>
      )}

      {tab === "appearance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Mode d&apos;affichage</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["light","☀️ Clair"],["dark","🌙 Sombre"]].map(([val, label]) => (
                <button key={val} onClick={() => setThemeMode(val)} style={{ padding: 16, borderRadius: 10, border: `2px solid ${themeMode === val ? "var(--brand)" : "var(--border)"}`, background: "var(--surface)", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{label}</button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Couleur principale</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setThemeColor(c)} style={{ width: 36, height: 36, borderRadius: "50%", background: c, border: `3px solid ${themeColor === c ? "var(--text)" : "transparent"}`, cursor: "pointer" }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ fontSize: 13 }}>Personnalisée :</label>
              <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer" }} />
            </div>
          </div>

          <button className="btn btn-primary" onClick={saveAppearance} disabled={saving} style={{ fontSize: 13, alignSelf: "flex-start" }}>{saving ? "Enregistrement..." : "Appliquer"}</button>
        </div>
      )}
    </div>
  );
}
