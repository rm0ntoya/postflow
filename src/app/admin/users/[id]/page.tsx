import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { notFound } from "next/navigation";
import { Types } from "mongoose";

interface PageProps { params: { id: string } }

export default async function UserDetailPage({ params }: PageProps) {
  await connectDB();

  if (!Types.ObjectId.isValid(params.id)) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let carousels: any[] = [];
  try {
    user = await User.findById(params.id)
      .select("name email hasGeminiKey isAdmin isBanned bannedReason bannedAt aiContext brandAccentColor createdAt")
      .lean();
    if (!user) notFound();
    carousels = await Carousel.find({ userId: params.id })
      .select("title createdAt slides")
      .sort({ createdAt: -1 })
      .lean();
  } catch {
    notFound();
  }
  if (!user) notFound();
  if (!carousels) carousels = [];

  const tdS: React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid #161616", fontSize: 13 };
  const thS: React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid #1e1e1e", fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", textAlign: "left" as const };

  const u = user as typeof user & {
    name: string; email: string; hasGeminiKey: boolean; isAdmin: boolean;
    isBanned: boolean; bannedReason?: string; brandAccentColor?: string;
    aiContext?: Record<string, string>;
  };

  const infoRows: [string, string][] = [
    ["Cadastro", new Date(u.createdAt).toLocaleString("pt-BR")],
    ["E-mail", u.email],
    ["API Key", u.hasGeminiKey ? "Configurada ✅" : "Não configurada"],
    ["Admin", u.isAdmin ? "Sim" : "Não"],
    ["Status", u.isBanned ? `Banido — ${u.bannedReason || "sem motivo"}` : "Ativo"],
    ["Cor de destaque", u.brandAccentColor || "#FFD700"],
    ["Total de carrosséis", String(carousels.length)],
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <Link href="/admin/users" style={{ color: "#555", fontSize: 13, textDecoration: "none" }}>← Usuários</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 10, marginBottom: 4 }}>{u.name}</h1>
        <div style={{ color: "#555", fontSize: 14 }}>{u.email}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Conta</div>
          {infoRows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: "#555" }}>{k}</span>
              <span style={{ color: "#ddd", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{v}</span>
            </div>
          ))}
        </div>

        {u.aiContext && (
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 22 }}>
            <div style={{ fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Contexto de IA</div>
            {(["brandName", "tone", "audience", "instagramHandle"] as const).map((key) => {
              const v = u.aiContext?.[key];
              return v ? (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                  <span style={{ color: "#555", textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span style={{ color: "#ddd" }}>{v}</span>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>

      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1e1e", fontWeight: 700, fontSize: 14 }}>
          Carrosséis ({carousels.length})
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thS}>Título</th>
              <th style={thS}>Slides</th>
              <th style={thS}>Criado em</th>
            </tr>
          </thead>
          <tbody>
            {carousels.map((c) => (
              <tr key={String(c._id)}>
                <td style={tdS}>{c.title}</td>
                <td style={tdS}>{(c.slides as unknown[])?.length || 0}</td>
                <td style={{ ...tdS, color: "#555" }}>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
            {carousels.length === 0 && (
              <tr><td colSpan={3} style={{ ...tdS, color: "#444", textAlign: "center", padding: 28 }}>Nenhum carrossel</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
