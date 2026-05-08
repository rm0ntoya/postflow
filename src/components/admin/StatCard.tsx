interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export default function StatCard({ label, value, sub, accent = "#a855f7" }: StatCardProps) {
  return (
    <div style={{
      background: "#111", border: "1px solid #1e1e1e", borderRadius: 12,
      padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: accent, lineHeight: 1 }}>
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#444" }}>{sub}</div>}
    </div>
  );
}
