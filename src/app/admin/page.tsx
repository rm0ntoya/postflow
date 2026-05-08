import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { getAppConfig } from "@/models/AppConfig";
import StatCard from "@/components/admin/StatCard";
import Link from "next/link";

async function getStats() {
  await connectDB();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, totalCarousels, newUsersToday, newUsersWeek,
    usersWithKey, bannedUsers, adminCount, carouselsToday, config,
  ] = await Promise.all([
    User.countDocuments(),
    Carousel.countDocuments(),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    User.countDocuments({ hasGeminiKey: true }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ isAdmin: true }),
    Carousel.countDocuments({ createdAt: { $gte: todayStart } }),
    getAppConfig(),
  ]);

  return { totalUsers, totalCarousels, newUsersToday, newUsersWeek, usersWithKey, bannedUsers, adminCount, carouselsToday, maintenanceMode: config.maintenanceMode };
}

export default async function AdminPage() {
  const stats = await getStats();

  const quickLinks = [
    { href: "/admin/users", icon: "👥", title: "Gerenciar Usuários", desc: "Banir, promover, deletar contas" },
    { href: "/admin/carousels", icon: "🎠", title: "Ver Carrosséis", desc: "Todos os carrosséis gerados" },
    { href: "/admin/reports", icon: "📈", title: "Relatórios", desc: "Crescimento nos últimos 30 dias" },
    { href: "/admin/config", icon: "⚙️", title: "Configurações", desc: "Manutenção, banners, sistema" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Visão Geral</h1>
        <p style={{ color: "#555", fontSize: 14 }}>Métricas em tempo real da plataforma</p>
      </div>

      {stats.maintenanceMode && (
        <div style={{
          background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)",
          borderRadius: 10, padding: "12px 18px", marginBottom: 28,
          color: "#f97316", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
        }}>
          ⚠️ Modo manutenção ATIVO — usuários comuns não conseguem acessar o dashboard
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 14, marginBottom: 36 }}>
        <StatCard label="Total de Usuários" value={stats.totalUsers} sub={`+${stats.newUsersToday} hoje`} />
        <StatCard label="Novos esta Semana" value={stats.newUsersWeek} accent="#22c55e" />
        <StatCard label="Total de Carrosséis" value={stats.totalCarousels} sub={`+${stats.carouselsToday} hoje`} accent="#3b82f6" />
        <StatCard label="API Keys Ativas" value={stats.usersWithKey} accent="#f97316" />
        <StatCard label="Usuários Banidos" value={stats.bannedUsers} accent="#ef4444" />
        <StatCard label="Admins" value={stats.adminCount} accent="#8b5cf6" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href} style={{
            background: "#111", border: "1px solid #1e1e1e", borderRadius: 12,
            padding: "22px 24px", textDecoration: "none", color: "#fff", display: "block",
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: 5 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: "#555" }}>{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
