import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import BarChart from "@/components/admin/BarChart";

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
}

async function getReportData() {
  await connectDB();
  const days = last30Days();
  const start = new Date(days[0]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function counts(model: any, field: string): Promise<Record<string, number>> {
    const raw = await model.aggregate([
      { $match: { [field]: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: `$${field}` } }, count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(raw.map((r: { _id: string; count: number }) => [r._id, r.count]));
  }

  const [userMap, carouselMap] = await Promise.all([
    counts(User, "createdAt"),
    counts(Carousel, "createdAt"),
  ]);

  const registrations = days.map((d) => ({ date: d, count: userMap[d] || 0 }));
  const carousels = days.map((d) => ({ date: d, count: carouselMap[d] || 0 }));

  return {
    registrations,
    carousels,
    totalReg: registrations.reduce((s, d) => s + d.count, 0),
    totalCar: carousels.reduce((s, d) => s + d.count, 0),
    peakReg: Math.max(...registrations.map((d) => d.count)),
    peakCar: Math.max(...carousels.map((d) => d.count)),
  };
}

export default async function AdminReportsPage() {
  const data = await getReportData();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Relatórios</h1>
        <p style={{ color: "#555", fontSize: 14 }}>Últimos 30 dias</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Cadastros (30d)", value: data.totalReg, color: "#a855f7" },
          { label: "Pico diário (usuários)", value: data.peakReg, color: "#8b5cf6" },
          { label: "Carrosséis gerados (30d)", value: data.totalCar, color: "#f97316" },
          { label: "Pico diário (carrosséis)", value: data.peakCar, color: "#ea580c" },
        ].map((item) => (
          <div key={item.label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "18px 22px" }}>
            <div style={{ fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: item.color, marginTop: 6, lineHeight: 1 }}>{item.value.toLocaleString("pt-BR")}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <BarChart data={data.registrations} title="Novos usuários por dia" color="#a855f7" height={180} />
        <BarChart data={data.carousels} title="Carrosséis gerados por dia" color="#f97316" height={180} />
      </div>
    </div>
  );
}
