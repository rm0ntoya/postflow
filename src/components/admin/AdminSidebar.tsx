"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Visão Geral", icon: "📊" },
  { href: "/admin/users", label: "Usuários", icon: "👥" },
  { href: "/admin/carousels", label: "Carrosséis", icon: "🎠" },
  { href: "/admin/reports", label: "Relatórios", icon: "📈" },
  { href: "/admin/config", label: "Configurações", icon: "⚙️" },
];

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      <aside style={{
        width: 220, flexShrink: 0, background: "#111", borderRight: "1px solid #1e1e1e",
        display: "flex", flexDirection: "column", padding: "24px 0", position: "sticky", top: 0, height: "100vh",
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1e1e1e", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Painel Admin</div>
          <div style={{ fontSize: 20, fontWeight: 800, background: "linear-gradient(90deg,#a855f7,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Carrossel AI
          </div>
        </div>
        <nav style={{ flex: 1, paddingTop: 4 }}>
          {NAV.map((item) => {
            const active = path === item.href || (item.href !== "/admin" && path.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 20px", fontSize: 14, fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : "#666",
                  background: active ? "rgba(168,85,247,0.1)" : "transparent",
                  borderLeft: `3px solid ${active ? "#a855f7" : "transparent"}`,
                  textDecoration: "none", transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1e1e1e" }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: "#555", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            ← Voltar ao Dashboard
          </Link>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: "auto", padding: 32, minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
