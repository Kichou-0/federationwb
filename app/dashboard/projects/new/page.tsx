"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleCreate(e: any) {
    e.preventDefault(); setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error: err } = await supabase.from("projects").insert({ title, description, owner_id: user.id, status }).select().single();
    if (err) { setError(err.message); setLoading(false); return; }
    router.push(`/dashboard/projects/${data.id}`);
  }

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, marginBottom: 24, padding: 0 }}>← Retour</button>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Nouveau projet</h1>
      <form onSubmit={handleCreate} className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Titre *</label>
          <input className="input" placeholder="Mon projet" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Description</label>
          <textarea className="input" rows={6} placeholder="Décrivez votre projet..." value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "vertical" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Statut</label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="active">Actif</option>
            <option value="paused">En pause</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
        {error && <p style={{ color: "#ef4444", fontSize: 14, margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Création..." : "Créer le projet"}</button>
          <button className="btn btn-secondary" type="button" onClick={() => router.back()}>Annuler</button>
        </div>
      </form>
    </div>
  );
}
