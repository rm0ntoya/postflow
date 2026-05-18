"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Payment {
  _id: string;
  planType: "pro" | "studio";
  amountBRL: number;
  status: "approved" | "pending" | "rejected" | "cancelled";
  createdAt: string;
  user: { name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  approved: "color:#4ade80;background:rgba(74,222,128,0.1)",
  pending: "color:#facc15;background:rgba(250,204,21,0.1)",
  rejected: "color:#f87171;background:rgba(248,113,113,0.1)",
  cancelled: "color:#555;background:#1a1a1a",
};

const tdS: React.CSSProperties = { padding: "12px 16px", borderBottom: "1px solid #161616", fontSize: 13, verticalAlign: "middle" };
const thS: React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid #1e1e1e", fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", textAlign: "left" as const };

export default function AdminRevenuePage() {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [monthlyRevenue, setMonthlyRevenue] = React.useState(0);
  const [totalRevenue, setTotalRevenue] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { setPage(1); }, [statusFilter]);

  React.useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status: statusFilter });
    fetch(`/api/admin/payments?${params}`)
      .then(r => r.json())
      .then(d => {
        setPayments(d.payments || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
        setMonthlyRevenue(d.monthlyRevenue || 0);
        setTotalRevenue(d.totalRevenue || 0);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Receita</h1>
        <p style={{ color: "#555", fontSize: 14 }}>Histórico de pagamentos via MercadoPago</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Receita do Mês", value: `R$ ${monthlyRevenue.toLocaleString("pt-BR")}`, accent: true },
          { label: "Receita Total", value: `R$ ${totalRevenue.toLocaleString("pt-BR")}`, accent: false },
          { label: "Total Pagamentos", value: String(total), accent: false },
        ].map(card => (
          <div key={card.label} style={{ background: "#111", border: `1px solid ${card.accent ? "rgba(245,158,11,0.3)" : "#1e1e1e"}`, borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: card.accent ? "#f59e0b" : "#fff" }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ background: "#111", border: "1px solid #2a2a2a", color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
        >
          <option value="all">Todos os status</option>
          <option value="approved">Aprovados</option>
          <option value="pending">Pendentes</option>
          <option value="rejected">Rejeitados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#444" }}>Carregando...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Usuário", "Plano", "Valor", "Status", "Data"].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td style={tdS}>
                    {p.user ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.user.name}</div>
                        <div style={{ color: "#555", fontSize: 12 }}>{p.user.email}</div>
                      </div>
                    ) : <span style={{ color: "#555" }}>Usuário removido</span>}
                  </td>
                  <td style={tdS}>
                    <span style={{
                      fontSize: 11, padding: "3px 8px", borderRadius: 99,
                      ...(p.planType === "studio"
                        ? { color: "#f59e0b", background: "rgba(245,158,11,0.1)" }
                        : { color: "#a78bfa", background: "rgba(167,139,250,0.1)" }),
                    }}>
                      {p.planType}
                    </span>
                  </td>
                  <td style={{ ...tdS, fontWeight: 700 }}>R$ {p.amountBRL.toFixed(2)}</td>
                  <td style={tdS}>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, ...(Object.fromEntries((STATUS_COLORS[p.status] || STATUS_COLORS.cancelled).split(";").map(s => s.split(":").map(x => x.trim())).filter(([k]) => k).map(([k, v]) => [k, v]))) }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ ...tdS, color: "#555" }}>{new Date(p.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
              {!loading && payments.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "40px 16px", textAlign: "center", color: "#444" }}>Nenhum pagamento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 13, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
            <ChevronLeft size={14} /> Anterior
          </button>
          <span style={{ color: "#555", fontSize: 13 }}>Página {page} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 13, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
            Próxima <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
