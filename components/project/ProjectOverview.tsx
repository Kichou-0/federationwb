"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDropzone } from "react-dropzone";

export default function ProjectOverview({ project, currentUser, canEdit }: { project: any; currentUser: any; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => { loadFiles(); }, []);

  async function loadFiles() {
    const { data } = await supabase.from("project_files").select("*, uploader:profiles!project_files_uploaded_by_fkey(first_name, last_name)").eq("project_id", project.id).order("created_at", { ascending: false });
    setFiles(data ?? []);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("projects").update({ title, description, status }).eq("id", project.id);
    setSaving(false); setEditing(false);
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!canEdit) return;
    setUploading(true);
    for (const file of acceptedFiles) {
      const path = `${project.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("project-files").upload(path, file);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("project-files").getPublicUrl(path);
        await supabase.from("project_files").insert({ project_id: project.id, uploaded_by: currentUser?.id, file_name: file.name, file_url: publicUrl, file_type: file.type, file_size: file.size });
      }
    }
    await loadFiles(); setUploading(false);
  }, [canEdit, project.id, currentUser?.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [], "audio/*": [], "video/*": [], "application/pdf": [] } });

  const fileIcon = (type: string) => type.startsWith("image/") ? "🖼️" : type.startsWith("audio/") ? "🎵" : type.startsWith("video/") ? "🎬" : "📄";
  const formatSize = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`;

  async function deleteFile(id: string, url: string) {
    const path = url.split("/project-files/")[1];
    if (path) await supabase.storage.from("project-files").remove([path]);
    await supabase.from("project_files").delete().eq("id", id);
    setFiles(f => f.filter(x => x.id !== id));
  }

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Présentation du projet</h2>
          {canEdit && !editing && <button className="btn btn-secondary" onClick={() => setEditing(true)} style={{ fontSize: 13 }}>✏️ Modifier</button>}
        </div>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Titre</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Description</label><textarea className="input" rows={8} value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "vertical" }} /></div>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Statut</label>
              <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="active">Actif</option><option value="paused">En pause</option><option value="completed">Terminé</option><option value="cancelled">Annulé</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: 13 }}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
              <button className="btn btn-secondary" onClick={() => setEditing(false)} style={{ fontSize: 13 }}>Annuler</button>
            </div>
          </div>
        ) : (
          description ? <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{description}</p>
          : <p style={{ fontSize: 14, color: "var(--muted)", fontStyle: "italic", margin: 0 }}>Aucune description.{canEdit ? " Cliquez sur Modifier pour en ajouter une." : ""}</p>
        )}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Fichiers attachés</h2>
        {canEdit && (
          <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? "var(--brand)" : "var(--border)"}`, borderRadius: 10, padding: 32, textAlign: "center", cursor: "pointer", background: isDragActive ? "#eef2ff" : "transparent", marginBottom: 16 }}>
            <input {...getInputProps()} />
            <p style={{ fontSize: 28, margin: "0 0 4px" }}>📁</p>
            <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 2px" }}>{isDragActive ? "Déposez ici !" : "Glissez des fichiers ou cliquez"}</p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Images, Audio, Vidéo, PDF</p>
          </div>
        )}
        {uploading && <p style={{ fontSize: 13, color: "var(--muted)" }}>⬆️ Envoi en cours...</p>}
        {files.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map((f: any) => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: "var(--bg)" }}>
                <span style={{ fontSize: 20 }}>{fileIcon(f.file_type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 500, color: "var(--brand)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.file_name}</a>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{formatSize(f.file_size)} · {f.uploader?.first_name} {f.uploader?.last_name}</p>
                </div>
                {canEdit && <button onClick={() => deleteFile(f.id, f.file_url)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16 }}>🗑️</button>}
              </div>
            ))}
          </div>
        ) : <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>Aucun fichier attaché</p>}
      </div>
    </div>
  );
}
