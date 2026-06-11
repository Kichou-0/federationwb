"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ first_name:"", last_name:"", username:"", email:"", phone:"", job_title:"", company:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleRegister(e: any) {
    e.preventDefault(); setError("");
    if (form.password !== form.confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (form.password.length < 8) { setError("Mot de passe trop court (8 caractères min)."); return; }
    setLoading(true);
    const { data: existing } = await supabase.from("profiles").select("id").eq("username", form.username).single();
    if (existing) { setError("Nom d'utilisateur déjà pris."); setLoading(false); return; }
    const { error: err } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { username: form.username, first_name: form.first_name, last_name: form.last_name } }
    });
    if (err) { setError(err.message); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ phone: form.phone, job_title: form.job_title, company: form.company }).eq("id", user.id);
    router.push("/dashboard"); router.refresh();
  }

  const fields = [
    { key:"first_name", label:"Prénom", type:"text", placeholder:"Jean", required:true },
    { key:"last_name", label:"Nom", type:"text", placeholder:"Dupont", required:true },
    { key:"username", label:"Nom d'utilisateur", type:"text", placeholder:"jean_dupont", required:true },
    { key:"email", label:"Email", type:"email", placeholder:"jean@exemple.com", required:true },
    { key:"phone", label:"Téléphone", type:"tel", placeholder:"+33 6 00 00 00 00", required:false },
    { key:"job_title", label:"Poste", type:"text", placeholder:"Chef de projet", required:true },
    { key:"company", label:"Entreprise / Lieu de travail", type:"text", placeholder:"Acme Corp", required:true },
    { key:"password", label:"Mot de passe", type:"password", placeholder:"••••••••", required:true },
    { key:"confirm", label:"Confirmer le mot de passe", type:"password", placeholder:"••••••••", required:true },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:"40px 16px" }}>
      <div className="card" style={{ padding:32, width:"100%", maxWidth:480 }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:24 }}>✨</div>
          <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Créer un compte</h1>
          <p style={{ color:"var(--muted)", fontSize:14, marginTop:4 }}>Rejoignez WorkTracker</p>
        </div>
        <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {fields.slice(0,2).map(f => (
              <div key={f.key}>
                <label style={{ display:"block", fontSize:13, fontWeight:500, marginBottom:4 }}>{f.label}</label>
                <input className="input" type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} required={f.required} />
              </div>
            ))}
          </div>
          {fields.slice(2).map(f => (
            <div key={f.key}>
              <label style={{ display:"block", fontSize:13, fontWeight:500, marginBottom:4 }}>{f.label}</label>
              <input className="input" type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} required={f.required} />
            </div>
          ))}
          {error && <p style={{ color:"#ef4444", fontSize:14, background:"#fef2f2", padding:"8px 12px", borderRadius:8, margin:0 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:"100%", marginTop:4 }}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p style={{ textAlign:"center", fontSize:14, color:"var(--muted)", marginTop:20 }}>
          Déjà un compte ? <Link href="/login" style={{ color:"var(--brand)", fontWeight:500 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
