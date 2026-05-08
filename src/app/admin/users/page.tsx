"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  hasGeminiKey: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  bannedReason?: string;
  carouselCount: number;
  createdAt: string;
}

interface ListResponse { users: AdminUser[]; total: number; pages: number; page: number }

const tdS: React.CSSProperties = { padding: "12px 16px", borderBottom: "1px solid #161616", fontSize: 13, verticalAlign: "middle" };
const thS: React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid #1e1e1e", fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", textAlign: "left" as const };

export default function AdminUsersPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&page=${page}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  async function action(id: string, act: string, reason?: string) {
    setBusy(id + act);
    try {
      let res: Response;
      if (act === "delete") {
        res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      } else {
        res = await fetch(`/api/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: act, reason }),
        });
      }
      if (!res.ok) { window.alert(`Erro: ${res.status}. Tente novamente.`); return; }
      load();
    } catch (e) {
      console.error("Action failed:", e);
      window.alert("Erro de conexão. Tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Usuários</h1>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Buscar nome ou email..."
          style={{ background: "#111", border: "1px solid #2a2a2a", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 14, width: 280, outline: "none" }}
        />
      </div>

      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#444" }}>Carregando...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thS}>Usuário</th>
                <th style={thS}>Carrosséis</th>
                <th style={thS}>API Key</th>
                <th style={thS}>Status</th>
                <th style={thS}>Cadastro</th>
                <th style={thS}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((u) => (
                <tr key={u._id} style={{ background: u.isBanned ? "rgba(239,68,68,0.03)" : "transparent" }}>
                  <td style={tdS}>
                    <Link href={`/admin/users/${u._id}`} style={{ color: "#e5e5e5", textDecoration: "none", fontWeight: 600 }}>{u.name}</Link>
                    <div style={{ color: "#444", fontSize: 12, marginTop: 2 }}>{u.email}</div>
                    {u.isAdmin && <span style={{ fontSize: 10, background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderRadius: 4, padding: "2px 6px", marginTop: 3, display: "inline-block" }}>Admin</span>}
                  </td>
                  <td style={tdS}>{u.carouselCount}</td>
                  <td style={tdS}>{u.hasGeminiKey ? <span style={{ color: "#22c55e" }}>✓</span> : <span style={{ color: "#333" }}>—</span>}</td>
                  <td style={tdS}>
                    {u.isBanned
                      ? <span style={{ color: "#ef4444", fontWeight: 600, fontSize: 12 }}>Banido</span>
                      : <span style={{ color: "#22c55e", fontSize: 12 }}>Ativo</span>}
                  </td>
                  <td style={{ ...tdS, color: "#555" }}>{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td style={tdS}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const }}>
                      {u.isBanned ? (
                        <button onClick={() => action(u._id, "unban")} disabled={busy === u._id + "unban"}
                          style={{ fontSize: 11, padding: "4px 10px", background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, cursor: "pointer" }}>
                          Desbanir
                        </button>
                      ) : (
                        <button onClick={() => { const r = window.prompt("Motivo do ban:"); if (r !== null) action(u._id, "ban", r); }}
                          disabled={busy === u._id + "ban"}
                          style={{ fontSize: 11, padding: "4px 10px", background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, cursor: "pointer" }}>
                          Banir
                        </button>
                      )}
                      {u.isAdmin ? (
                        <button onClick={() => action(u._id, "demote")} style={{ fontSize: 11, padding: "4px 10px", background: "rgba(100,100,100,0.08)", color: "#666", border: "1px solid #2a2a2a", borderRadius: 6, cursor: "pointer" }}>
                          Remover admin
                        </button>
                      ) : (
                        <button onClick={() => action(u._id, "promote")} style={{ fontSize: 11, padding: "4px 10px", background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, cursor: "pointer" }}>
                          Promover
                        </button>
                      )}
                      <button onClick={() => { if (window.confirm("Deletar usuário e todos os carrosséis dele?")) action(u._id, "delete"); }}
                        style={{ fontSize: 11, padding: "4px 8px", background: "rgba(239,68,68,0.05)", color: "#7f1d1d", border: "1px solid #1e0a0a", borderRadius: 6, cursor: "pointer" }}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && data?.users.length === 0 && (
                <tr><td colSpan={6} style={{ ...tdS, textAlign: "center", color: "#444", padding: 32 }}>Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && data.pages > 1 && (
        <div style={{ display: "flex", gap: 6, marginTop: 16, justifyContent: "center" }}>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: 36, height: 36, borderRadius: 8, background: p === page ? "#a855f7" : "#111", border: "1px solid #2a2a2a", color: "#fff", cursor: "pointer", fontWeight: p === page ? 700 : 400 }}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 13, color: "#444" }}>{data?.total ?? 0} usuário(s)</div>
    </div>
  );
}
