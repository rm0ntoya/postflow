interface DataPoint { date: string; count: number }

interface BarChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  height?: number;
}

export default function BarChart({ data, title, color = "#a855f7", height = 160 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px 24px" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#bbb", marginBottom: 20 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
        {data.map((d, i) => {
          const barH = Math.max(2, (d.count / max) * (height - 20));
          return (
            <div
              key={i}
              title={`${d.date}: ${d.count}`}
              style={{
                flex: 1, height: barH, background: color, borderRadius: "3px 3px 0 0",
                opacity: d.count === 0 ? 0.15 : 0.8, minWidth: 2, cursor: "default",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#444" }}>
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}
