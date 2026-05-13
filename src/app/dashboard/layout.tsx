import "./app.css";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { getAppConfig } from "@/models/AppConfig";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardShell from "@/components/DashboardShell";
import { ToastProvider } from "@/components/ui/Toast";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isUpgradePage = pathname === "/dashboard/upgrade";

  await connectDB();

  const [user, cfg, carouselCount] = await Promise.all([
    User.findById(session.userId).select("isAdmin isBanned name plan planExpiresAt trialEndsAt").lean(),
    getAppConfig(),
    Carousel.countDocuments({ userId: session.userId }),
  ]);

  if (user?.isBanned) {
    return (
      <div style={{ background: "#0a0a0a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", textAlign: "center", padding: "32px" }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Conta suspensa</h1>
          <p style={{ color: "#888" }}>Entre em contato com o suporte se acredita que isso é um erro.</p>
        </div>
      </div>
    );
  }

  if (cfg.maintenanceMode && !user?.isAdmin) {
    return (
      <div style={{ background: "#0a0a0a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", textAlign: "center", padding: "32px" }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Em manutenção</h1>
          <p style={{ color: "#888" }}>{cfg.maintenanceBanner}</p>
        </div>
      </div>
    );
  }

  // Trial/plan check (skip on upgrade page)
  if (!isUpgradePage) {
    const u = user as { plan?: string; planExpiresAt?: Date; trialEndsAt?: Date; isAdmin?: boolean } | null;
    const now = new Date();
    const isPro = u?.plan === "pro" && u?.planExpiresAt && new Date(u.planExpiresAt) > now;
    const isInTrial = u?.trialEndsAt && new Date(u.trialEndsAt) > now;
    const isAdmin = u?.isAdmin;
    if (!isPro && !isInTrial && !isAdmin) {
      redirect("/dashboard/upgrade");
    }
  }

  const u = user as { name?: string; isAdmin?: boolean; plan?: string; planExpiresAt?: Date; trialEndsAt?: Date } | null;
  const userName = u?.name || "";
  const isAdmin = !!u?.isAdmin;

  return (
    <ToastProvider>
    <div className="flex min-h-screen bg-bg-base">
      {cfg.announcementActive && cfg.announcementBanner && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "linear-gradient(90deg,rgba(168,85,247,0.15),rgba(249,115,22,0.1))",
          borderBottom: "1px solid rgba(168,85,247,0.25)",
          padding: "8px 20px", textAlign: "center",
          fontSize: 13, color: "#d4b8ff", fontWeight: 500,
        }}>
          📢 {cfg.announcementBanner}
        </div>
      )}
      <Sidebar
        carouselCount={carouselCount}
        userName={userName}
        isAdmin={isAdmin}
        plan={u?.plan || "free"}
        trialEndsAt={u?.trialEndsAt ? new Date(u.trialEndsAt).toISOString() : undefined}
        planExpiresAt={u?.planExpiresAt ? new Date(u.planExpiresAt).toISOString() : undefined}
      />
      <DashboardShell>{children}</DashboardShell>
    </div>
    </ToastProvider>
  );
}
