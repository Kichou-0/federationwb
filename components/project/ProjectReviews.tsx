"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function ProjectReviews({ project, currentUser }: { project: any; currentUser: any }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [myReview, setMyReview] = useState<any>(null);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState<any>({});
  const [showComments, setShowComments] = useState<any>({});
  const supabase = createClient();

  useEffect(() => { loadReviews(); }, []);

  async function loadReviews() {
    const { data } = await supabase.from("project_reviews").select("*, author:profiles!project_reviews_author_id_fkey(*)").eq("project_id", project.id).order("created_at", { ascending: false });
    if (!data) return;
    const enriched = await Promise.all(data.map(async (r: any) => {
      const { data: reactions } = await supabase.from("reactions").select("*, user:profiles!reactions_user_id_fkey(first_name, last_name)").eq("target_type", "review").eq("target_id", r.id);
      const { data: comments } = await supabase.from("comments").select("*, author:profiles!comments_author_id_fkey(*)").eq("target_type", "review").eq("target_id", r.id).order("created_at");
      return { ...r, reactions: reactions ?? [], comments: comments ?? [] };
    }));
    setReviews(enriched);
    const mine = data.find((r: any) => r.author_id === currentUser?.id);
    if (mine) { setMyReview(mine); setContent(mine.content); setRating(mine.rating ?? 5); }
  }

  async function handleSubmit() {
    if (!content.trim() || !currentUser) return;
    setSaving(true);
    if (myReview) await supabase.from("project_reviews").update({ content, rating, updated_at: new Date().toISOString() }).eq("id", myReview.id);
    else await supabase.from("project_reviews").insert({ project_id: project.id, author_id: currentUser.id, content, rating });
    setSaving(false); setEditing(false); await loadReviews();
  }

  async function deleteReview(reviewId: string) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est permanente.")) return;
    await supabase.from("reactions").delete().eq("target_type", "review").eq("target_id", reviewId);
    await supabase.from("comments").delete().eq("target_type", "review").eq("target_id", reviewId);
    await supabase.from("project_reviews").delete().eq("id", reviewId);
    await loadReviews();
  }

  async function react(reviewId: string, type: string) {
    if (!currentUser) return;
    const review = reviews.find(r => r.id === reviewId);
    const existing = review?.reactions?.find((re: any) => re.user_id === currentUser.id && re.reaction_type === type);
    if (existing) { await supabase.from("reactions").delete().eq("id", existing.id); }
    else {
      const opposite = type === "check" ? "cross" : "check";
      const opp = review?.reactions?.find((re: any) => re.user_id === currentUser.id && re.reaction_type === opposite);
      if (opp) await supabase.from("reactions").delete().eq("id", opp.id);
      await supabase.from("reactions").insert({ user_id: currentUser.id, target_type: "review", target_id: reviewId, reaction_type: type });
    }
    await loadReviews();
  }

  async function addComment(reviewId: string) {
    const text = commentText[reviewId];
    if (!text?.trim() || !currentUser) return;
    await supabase.from("comments").insert({ target_type: "review", target_id: reviewId, author_id: currentUser.id, content: text });
    setCommentText((c: any) => ({ ...c, [reviewId]: "" }));
    await loadReviews();
  }

  const canDeleteReview = (review: any) => review.author_id === currentUser?.id || project.member_role === "owner";

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card" style={{ padding: 28, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "white", borderRadius: 16 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600 }}>{myReview ? "📝 Mon avis" : "✍️ Donner mon avis"}</h2>
        {!editing && myReview ? (
          <div>
            <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 20 }}>{s <= myReview.rating ? "⭐" : "☆"}</span>)}</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 16px", opacity: 0.95 }}>{myReview.content}</p>
            <button className="btn" onClick={() => setEditing(true)} style={{ fontSize: 13, background: "rgba(255,255,255,0.2)", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>✏️ Modifier mon avis</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, opacity: 0.9 }}>Votre note</label>
              <div style={{ display: "flex", gap: 4 }}>{[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24 }}>{s <= rating ? "⭐" : "☆"}</button>)}</div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, opacity: 0.9 }}>Votre retour</label>
              <textarea className="input" rows={5} placeholder="Partagez votre expérience avec ce projet..." value={content} onChange={e => setContent(e.target.value)} style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={handleSubmit} disabled={saving} style={{ fontSize: 13, background: "white", color: "#6366f1", fontWeight: 500, border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer" }}>{saving ? "Envoi..." : myReview ? "Mettre à jour" : "Publier mon avis"}</button>
              {myReview && <button className="btn" onClick={() => setEditing(false)} style={{ fontSize: 13, background: "rgba(255,255,255,0.2)", color: "white", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer" }}>Annuler</button>}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600 }}>💬 Tous les avis ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted)", borderRadius: 12 }}><p style={{ fontSize: 36, margin: "0 0 8px" }}>💭</p><p style={{ margin: 0, fontSize: 15 }}>Aucun avis pour le moment</p><p style={{ margin: "8px 0 0", fontSize: 13 }}>Soyez le premier à partager votre avis !</p></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reviews.map((review: any) => {
              const checks = review.reactions?.filter((r: any) => r.reaction_type === "check").length ?? 0;
              const crosses = review.reactions?.filter((r: any) => r.reaction_type === "cross").length ?? 0;
              const myCheck = review.reactions?.find((r: any) => r.user_id === currentUser?.id && r.reaction_type === "check");
              const myCross = review.reactions?.find((r: any) => r.user_id === currentUser?.id && r.reaction_type === "cross");
              return (
                <div key={review.id} className="card" style={{ padding: 20, borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14, justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 14, flexShrink: 0 }}>
                        {review.author?.first_name?.[0]}{review.author?.last_name?.[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{review.author?.first_name} {review.author?.last_name}</p>
                          {review.author_id === project.owner_id && <span className="badge" style={{ background: "#f59e0b20", color: "#f59e0b", fontSize: 11 }}>👑 Propriétaire</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{review.author?.job_title} · {review.author?.company}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--muted)" }}>{formatDistanceToNow(new Date(review.updated_at), { addSuffix: true, locale: fr })}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 14 }}>{s <= review.rating ? "⭐" : "☆"}</span>)}</div>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 14px", color: "var(--text)", whiteSpace: "pre-wrap" }}>{review.content}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[["check", "✅", checks, myCheck], ["cross", "❌", crosses, myCross]].map(([type, emoji, count, mine]: any) => (
                      <button key={type} onClick={() => react(review.id, type)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: mine ? (type === "check" ? "#22c55e20" : "#ef444420") : "var(--bg)", color: mine ? (type === "check" ? "#22c55e" : "#ef4444") : "var(--muted)", transition: "all 0.2s" }}>
                        {emoji} {count}
                      </button>
                    ))}
                    <button onClick={() => setShowComments((c: any) => ({ ...c, [review.id]: !c[review.id] }))} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: "var(--bg)", color: "var(--muted)" }}>
                      💬 {review.comments?.length ?? 0}
                    </button>
                    {canDeleteReview(review) && (
                      <button onClick={() => deleteReview(review.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: "#fef2f2", color: "#ef4444", marginLeft: "auto" }}>
                        🗑️ Supprimer
                      </button>
                    )}
                  </div>
                  {showComments[review.id] && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
                      {review.comments?.map((c: any) => (
                        <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>{c.author?.first_name?.[0]}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 12px" }}>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{c.author?.first_name} {c.author?.last_name}</span>
                              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text)" }}>{c.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 8 }}>
                        <input className="input" placeholder="Répondre..." value={commentText[review.id] ?? ""} onChange={e => setCommentText((c: any) => ({ ...c, [review.id]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addComment(review.id)} style={{ flex: 1, fontSize: 13 }} />
                        <button className="btn btn-primary" onClick={() => addComment(review.id)} style={{ fontSize: 13, padding: "8px 16px" }}>Envoyer</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
