"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "./Icon";

interface SidebarProps {
  carouselCount?: number;
  userName?: string;
  isAdmin?: boolean;
  plan?: string;
  trialEndsAt?: string;
  planExpiresAt?: string;
}

export default function Sidebar({ carouselCount = 0, userName = "", isAdmin = false, plan = "free", trialEndsAt, planExpiresAt }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const active = (path: string) => pathname === path || (path !== "/dashboard" && pathname.startsWith(path));

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/");
  }

  const initials = userName
    ? userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "NC";

  // Trial/plan info
  const now = new Date();
  const isPro = plan === "pro" && planExpiresAt && new Date(planExpiresAt) > now;
  const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
  const isInTrial = trialEnd && trialEnd > now;
  const trialDaysLeft = isInTrial ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 4h6a4 4 0 010 8H5z"/>
            <path d="M5 12h7a4 4 0 010 8H5z" opacity=".5"/>
          </svg>
        </div>
        <div className="brand-name">NovaCraft</div>
      </div>

      <div className="nav-section">Trabalho</div>
      <Link href="/dashboard" className={`nav-link ${active("/dashboard") && !active("/dashboard/context") && !active("/dashboard/settings") && !active("/dashboard/editor") && !active("/dashboard/calendar") ? "active" : ""}`}>
        <Icon name="grid"/> Meus carrosséis
      </Link>
      <Link href="/dashboard/context" className={`nav-link ${active("/dashboard/context") ? "active" : ""}`}>
        <Icon name="brain"/> Contexto da IA
      </Link>
      <Link href="/dashboard/calendar" className={`nav-link ${active("/dashboard/calendar") ? "active" : ""}`}>
        <span style={{ fontSize: 14 }}>📅</span> Calendário
      </Link>
      <div className="nav-link" style={{ opacity: .5, cursor: "default" }}>
        <Icon name="layout"/> Templates <span style={{ fontSize: 10, color: "var(--dim)", marginLeft: 4 }}>em breve</span>
      </div>

      <div className="nav-section">Conta</div>
      <Link href="/dashboard/settings" className={`nav-link ${active("/dashboard/settings") ? "active" : ""}`}>
        <Icon name="settings"/> Configurações
      </Link>
      <button className="nav-link" onClick={handleLogout} style={{ width: "100%", textAlign: "left" }}>
        <Icon name="logout"/> Sair
      </button>

      {isAdmin && (
        <>
          <div className="nav-section">Sistema</div>
          <Link href="/admin" className="nav-link" style={{ color: "#a855f7" }}>
            <Icon name="sparkle"/> Admin
          </Link>
        </>
      )}

      <div className="nav-spacer"/>

      <div className="nav-foot">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials}</div>
          <div className="nav-foot-title" style={{ margin: 0 }}>
            {isPro ? "Plano Pro" : isInTrial ? "Período de teste" : "Plano Free"}
          </div>
        </div>

        {isInTrial && (
          <div style={{
            background: "rgba(168,85,247,.1)", border: "1px solid rgba(168,85,247,.25)",
            borderRadius: 8, padding: "8px 10px", marginBottom: 10,
          }}>
            <div style={{ fontSize: 11, color: "#C4B5FD", fontWeight: 500, marginBottom: 2 }}>
              ✦ Teste gratuito ativo
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
              {trialDaysLeft} dia{trialDaysLeft !== 1 ? "s" : ""} restante{trialDaysLeft !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        <div className="nav-foot-sub">{carouselCount} carrossel{carouselCount !== 1 ? "s" : ""} criado{carouselCount !== 1 ? "s" : ""}</div>
        <div className="nav-foot-bar"><div className="nav-foot-bar-fill" style={{ width: `${Math.min(carouselCount * 4, 78)}%` }}/></div>
        <div className="nav-foot-meta">
          <span>{carouselCount} / 100</span>
          <span style={{ color: "#C4B5FD" }}>{isPro ? "Pro ✦" : isInTrial ? "Trial" : "Free"}</span>
        </div>
      </div>
    </aside>
  );
}
