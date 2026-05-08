"use client";
import { useEffect, useState, useCallback } from "react";

interface AdminCarousel {
  _id: string;
  title: string;
  userId: string;
  slideCount: number;
  accentColor: string;
  createdAt: string;
}

interface ListResponse { carousels: AdminCarousel[]; total: number; pages: number; page: number }

const tdS: React.CSSProperties = { padding: "12px 16px", borderBottom: "1px solid #161616", fontSize: 13, verticalAlign: "middle" };
const thS: React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid #1e1e1e", fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", textAlign: "left" as const };

export default function AdminCarouselsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/carousels?q=${encodeURIComponent(q)}&page=${page}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      console.error("Failed to load carousels:", e);
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm("Deletar este carrossel permanentemente?")) return;
    const res = await fetch(`/api/admin/carousels/${id}`, { method: "DELETE" });
    if (!res.ok) { window.alert("Erro ao deletar. Tente novamente."); return; }
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Carrosséis</h1>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Buscar título..."
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
                <th style={thS}>Título</th>
                <th style={thS}>User ID</th>
                <th style={thS}>Slides</th>
                <th style={thS}>Criado</th>
                <th style={thS}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.carousels.map((c) => (
                <tr key={c._id}>
                  <td style={tdS}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.accentColor || "#FFD700", flexShrink: 0 }} />
                      {c.title}
                    </div>
                  </td>
                  <td style={{ ...tdS, color: "#444", fontFamily: "monospace", fontSize: 11 }}>
                    {c.userId.slice(-8)}…
                  </td>
                  <td style={tdS}>{c.slideCount}</td>
                  <td style={{ ...tdS, color: "#555" }}>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td style={tdS}>
                    <button onClick={() => handleDelete(c._id)}
                      style={{ fontSize: 11, padding: "4px 10px", background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6, cursor: "pointer" }}>
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && data?.carousels.length === 0 && (
                <tr><td colSpan={5} style={{ ...tdS, textAlign: "center", color: "#444", padding: 32 }}>Nenhum carrossel</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && data.pages > 1 && (
        <div style={{ display: "flex", gap: 6, marginTop: 16, justifyContent: "center" }}>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: 36, height: 36, borderRadius: 8, background: p === page ? "#a855f7" : "#111", border: "1px solid #2a2a2a", color: "#fff", cursor: "pointer" }}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 13, color: "#444" }}>{data?.total ?? 0} carrossel(is)</div>
    </div>
  );
}
