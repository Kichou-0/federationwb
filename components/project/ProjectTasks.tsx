"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const COLUMNS = [
  { id: "todo", label: "À faire", color: "#64748b" },
  { id: "in_progress", label: "En cours", color: "#f59e0b" },
  { id: "review", label: "En révision", color: "#6366f1" },
  { id: "done", label: "Terminé", color: "#22c55e" },
];
const PRIORITIES: any = {
  low: { label: "Faible", color: "#22c55e" },
  medium: { label: "Moyen", color: "#f59e0b" },
  high: { label: "Haute", color: "#f97316" },
  urgent: { label: "Urgent", color: "#ef4444" },
};

export default function ProjectTasks({ project, currentUser, canEdit }: { project: any; currentUser: any; canEdit: boolean }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", priority: "medium", assigned_to: "" });
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: t } = await supabase.from("tasks").select("*, assignee:profiles!tasks_assigned_to_fkey(first_name, last_name)").eq("project_id", project.id).order("created_at");
    setTasks(t ?? []);
    const { data: m } = await supabase.from("project_members").select("user_id, profile:profiles!project_members_user_id_fkey(id, first_name, last_name)").eq("project_id", project.id);
    setMembers((m ?? []).map((x: any) => x.profile));
  }

  async function createTask() {
    if (!newTask.title.trim()) return;
    await supabase.from("tasks").insert({ project_id: project.id, created_by: currentUser?.id, title: newTask.title, priority: newTask.priority, assigned_to: newTask.assigned_to || null, status: "todo" });
    setNewTask({ title: "", priority: "medium", assigned_to: "" }); setCreating(false); await loadData();
  }

  async function updateStatus(taskId: string, status: string) {
    await supabase.from("tasks").update({ status }).eq("id", taskId);
    setTasks(t => t.map(x => x.id === taskId ? { ...x, status } : x));
  }

  async function deleteTask(taskId: string) {
    await supabase.from("tasks").delete().eq("id", taskId);
    setTasks(t => t.filter(x => x.id !== taskId));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tableau des tâches</h2>
        {canEdit && <button className="btn btn-primary" onClick={() => setCreating(true)} style={{ fontSize: 13 }}>+ Nouvelle tâche</button>}
      </div>
      {creating && (
        <div className="card" style={{ padding: 20, marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="input" placeholder="Titre de la tâche" value={newTask.title} onChange={e => setNewTask(n => ({ ...n, title: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <select className="input" value={newTask.priority} onChange={e => setNewTask(n => ({ ...n, priority: e.target.value }))}>
              <option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Haute</option><option value="urgent">Urgent</option>
            </select>
            <select className="input" value={newTask.assigned_to} onChange={e => setNewTask(n => ({ ...n, assigned_to: e.target.value }))}>
              <option value="">Personne</option>
              {members.map((m: any) => <option key={m?.id} value={m?.id}>{m?.first_name} {m?.last_name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={createTask} style={{ fontSize: 13 }}>Créer</button>
            <button className="btn btn-secondary" onClick={() => setCreating(false)} style={{ fontSize: 13 }}>Annuler</button>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{col.label}</span>
                </div>
                <span className="badge" style={{ background: `${col.color}20`, color: col.color, fontSize: 11 }}>{colTasks.length}</span>
              </div>
              <div style={{ minHeight: 60, display: "flex", flexDirection: "column", gap: 8 }}>
                {colTasks.map((task: any) => (
                  <div key={task.id} className="card" style={{ padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{task.title}</p>
                      {canEdit && <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 12, padding: 0 }}>✕</button>}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="badge" style={{ background: `${PRIORITIES[task.priority]?.color}20`, color: PRIORITIES[task.priority]?.color, fontSize: 11 }}>{PRIORITIES[task.priority]?.label}</span>
                      {task.assignee && <span style={{ fontSize: 11, color: "var(--muted)" }}>{task.assignee.first_name}</span>}
                    </div>
                    {canEdit && (
                      <select style={{ width: "100%", marginTop: 8, fontSize: 11, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} value={task.status} onChange={e => updateStatus(task.id, e.target.value)}>
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    )}
                  </div>
                ))}
                {colTasks.length === 0 && <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>Aucune tâche</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
