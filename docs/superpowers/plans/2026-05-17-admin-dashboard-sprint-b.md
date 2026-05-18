# Admin Dashboard Completo — Sprint B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete admin dashboard at `/admin` with pages for metrics, user management, carousel management, and revenue — replacing the existing bare `/admin/config` page with a full nav-driven admin area.

**Architecture:** New `/admin/layout.tsx` with sidebar navigation and `requireAdmin()` guard. Five pages: `/admin` (stats), `/admin/users` (table + actions), `/admin/carousels` (table), `/admin/revenue` (payments), `/admin/config` (existing, migrated). New API routes for carousels list and payments list. Expand existing stats route with plan breakdown. Use `frontend-design` skill for all UI. No external charting libraries — use CSS bar charts for simplicity.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React, MongoDB Mongoose, existing `requireAdmin()` from `src/lib/adminAuth.ts`.

**Prerequisite:** Sprint A must be complete (Payment model must exist).

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/admin/layout.tsx` | **Create** | Sidebar nav + requireAdmin guard |
| `src/app/admin/page.tsx` | **Create** | Dashboard metrics page |
| `src/app/admin/users/page.tsx` | **Create** | User management table |
| `src/app/admin/carousels/page.tsx` | **Create** | Carousel management table |
| `src/app/admin/revenue/page.tsx` | **Create** | Payment history and MRR |
| `src/app/api/admin/stats/route.ts` | Modify | Add plan breakdown, MRR calculation |
| `src/app/api/admin/users/route.ts` | Modify | Add plan filter, PATCH actions |
| `src/app/api/admin/carousels/route.ts` | Modify | Add pagination, user search |
| `src/app/api/admin/payments/route.ts` | **Create** | List Payment history |
| `src/models/AppConfig.ts` | Modify | Add trialDays field to admin/config page |

---

## Task 1: Create admin layout with sidebar

**Files:**
- Create: `src/app/admin/layout.tsx`

> **Context:** All admin pages share a sidebar nav. The layout uses `requireAdmin()` from `src/lib/adminAuth.ts` — redirect to `/` if not admin. Sidebar items: Dashboard, Usuários, Carrosséis, Receita, Configurações. Active state via current pathname.

- [ ] **Step 1: Read requireAdmin to understand its signature**

```bash
cat "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/lib/adminAuth.ts"
```

- [ ] **Step 2: Create `src/app/admin/layout.tsx`**

```typescript
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import Link from "next/link";

const NAV = [
  { href: "/admin",            label: "Dashboard",      icon: "▦" },
  { href: "/admin/users",      label: "Usuários",       icon: "👥" },
  { href: "/admin/carousels",  label: "Carrosséis",     icon: "🎠" },
  { href: "/admin/revenue",    label: "Receita",        icon: "💰" },
  { href: "/admin/config",     label: "Configurações",  icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const deny = await requireAdmin();
  if (deny) redirect("/");

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-bg-surface border-r border-border-subtle flex flex-col py-6 px-3 sticky top-0 h-screen">
        <div className="px-3 mb-8">
          <div className="text-micro text-text-tertiary mb-1">NOVACRAFT</div>
          <div className="text-body-strong text-accent">Admin Panel</div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(item => {
            const active = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body transition-colors ${
                  active
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-2"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-3">
          <Link href="/dashboard" className="text-caption text-text-tertiary hover:text-text-secondary transition-colors">
            ← Voltar ao Dashboard
          </Link>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "admin/layout" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat(admin): add admin layout with sidebar navigation"
```

---

## Task 2: Expand admin stats API

**Files:**
- Modify: `src/app/api/admin/stats/route.ts`

> **Context:** Current stats: totalUsers, totalCarousels, newUsersToday, newUsersWeek, usersWithKey, bannedUsers, adminCount, carouselsToday. Add: proUsers, studioUsers, trialUsers, expiredUsers, mrrEstimated.

- [ ] **Step 1: Add new aggregations**

Open `src/app/api/admin/stats/route.ts`. Find the `Promise.all` array. Add new counts:

```typescript
const now = new Date();

const [
  totalUsers, totalCarousels, newUsersToday, newUsersWeek,
  usersWithKey, bannedUsers, adminCount, carouselsToday,
  proUsers, studioUsers, trialUsers, config,
] = await Promise.all([
  User.countDocuments(),
  Carousel.countDocuments(),
  User.countDocuments({ createdAt: { $gte: todayStart } }),
  User.countDocuments({ createdAt: { $gte: weekAgo } }),
  User.countDocuments({ hasGeminiKey: true }),
  User.countDocuments({ isBanned: true }),
  User.countDocuments({ isAdmin: true }),
  Carousel.countDocuments({ createdAt: { $gte: todayStart } }),
  User.countDocuments({ plan: "pro", planExpiresAt: { $gt: now } }),
  User.countDocuments({ plan: "studio", planExpiresAt: { $gt: now } }),
  User.countDocuments({ trialEndsAt: { $gt: now }, plan: "free" }),
  getAppConfig(),
]);

const mrrEstimated = (proUsers * (config.mpProPriceReais ?? 49)) + (studioUsers * (config.mpStudioPriceReais ?? 149));
const conversionRate = totalUsers > 0 ? Math.round(((proUsers + studioUsers) / totalUsers) * 100) : 0;
```

- [ ] **Step 2: Update return object**

Add to the JSON response:
```typescript
return NextResponse.json({
  totalUsers, totalCarousels, newUsersToday, newUsersWeek,
  usersWithKey, bannedUsers, adminCount, carouselsToday,
  proUsers, studioUsers, trialUsers,
  mrrEstimated,
  conversionRate,
  maintenanceMode: config.maintenanceMode,
});
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/stats/route.ts
git commit -m "feat(admin): expand stats API with plan breakdown, MRR, conversion rate"
```

---

## Task 3: Build admin dashboard page `/admin`

**Files:**
- Create: `src/app/admin/page.tsx`

> **Context:** Uses `frontend-design` principles. Shows stat cards in a grid, MRR card prominent, conversion rate, quick actions (toggle maintenance). No charts (just numbers + CSS bars).

- [ ] **Step 1: Invoke `frontend-design` skill before writing UI**

Read `/Users/r.montoya/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/frontend-design/SKILL.md` and apply principles.

- [ ] **Step 2: Create `src/app/admin/page.tsx`**

```typescript
"use client";
import * as React from "react";
import { Users, LayoutGrid, TrendingUp, AlertTriangle } from "lucide-react";

interface Stats {
  totalUsers: number; newUsersToday: number; newUsersWeek: number;
  totalCarousels: number; carouselsToday: number;
  proUsers: number; studioUsers: number; trialUsers: number;
  bannedUsers: number; usersWithKey: number;
  mrrEstimated: number; conversionRate: number;
  maintenanceMode: boolean;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`bg-bg-surface border rounded-xl p-5 ${accent ? "border-accent/30" : "border-border-subtle"}`}>
      <div className="text-micro text-text-tertiary mb-2">{label}</div>
      <div className={`text-[2rem] font-black leading-none ${accent ? "text-accent" : "text-text-primary"}`}>{value}</div>
      {sub && <div className="text-caption text-text-tertiary mt-2">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => setError("Falha ao carregar stats."));
  }, []);

  async function toggleMaintenance() {
    if (!stats) return;
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenanceMode: !stats.maintenanceMode }),
    });
    if (res.ok) setStats(s => s ? { ...s, maintenanceMode: !s.maintenanceMode } : s);
  }

  if (error) return <div className="text-red-400 text-body">{error}</div>;
  if (!stats) return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-bg-surface border border-border-subtle rounded-xl p-5 h-28 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display text-text-primary">Admin Dashboard</h1>
        <p className="text-body text-text-secondary mt-1">Visão geral da plataforma em tempo real.</p>
      </div>

      {/* MRR destaque */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="MRR ESTIMADO" value={`R$ ${stats.mrrEstimated.toLocaleString("pt-BR")}`} sub={`Pro × ${stats.proUsers} + Studio × ${stats.studioUsers}`} accent />
        <StatCard label="CONVERSÃO" value={`${stats.conversionRate}%`} sub="usuários com plano pago" />
        <StatCard label="TOTAL USUÁRIOS" value={stats.totalUsers} sub={`+${stats.newUsersToday} hoje · +${stats.newUsersWeek} esta semana`} />
      </div>

      {/* Grid de planos */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="PRO ATIVOS" value={stats.proUsers} />
        <StatCard label="STUDIO ATIVOS" value={stats.studioUsers} />
        <StatCard label="EM TRIAL" value={stats.trialUsers} />
        <StatCard label="BANIDOS" value={stats.bannedUsers} />
      </div>

      {/* Carrosséis */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="TOTAL CARROSSÉIS" value={stats.totalCarousels} />
        <StatCard label="CRIADOS HOJE" value={stats.carouselsToday} />
        <StatCard label="COM API KEY" value={stats.usersWithKey} sub="usuários com Gemini configurado" />
      </div>

      {/* Ação rápida: manutenção */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="text-body-strong text-text-primary flex items-center gap-2">
            <AlertTriangle size={16} className={stats.maintenanceMode ? "text-yellow-400" : "text-text-tertiary"} />
            Modo Manutenção
          </div>
          <div className="text-caption text-text-tertiary mt-1">
            {stats.maintenanceMode ? "ATIVO — usuários não-admin não conseguem acessar" : "Inativo — plataforma funcionando normalmente"}
          </div>
        </div>
        <button
          onClick={toggleMaintenance}
          className={`px-4 py-2 rounded-lg text-body font-medium transition-colors ${
            stats.maintenanceMode
              ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
              : "bg-bg-surface-2 text-text-secondary hover:text-text-primary"
          }`}
        >
          {stats.maintenanceMode ? "Desativar" : "Ativar manutenção"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify compiles and test**

```bash
npx tsc --noEmit 2>&1 | grep "admin/page" | head -5
```

With `npm run dev`: navigate to `http://localhost:3000/admin` as admin user. Verify stats load.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): dashboard page with MRR, plan breakdown, maintenance toggle"
```

---

## Task 4: Expand admin users API — add plan filter and PATCH actions

**Files:**
- Modify: `src/app/api/admin/users/route.ts`

> **Context:** Current route has GET with `q` search and `page`. Need to add `plan` filter and a PATCH handler for user actions (ban, change plan, extend trial).

- [ ] **Step 1: Add plan filter to GET**

Open `src/app/api/admin/users/route.ts`. Find the `filter` construction. Update to also handle `plan` param:

```typescript
const planFilter = searchParams.get("plan");
const statusFilter = searchParams.get("status");

const filter: Record<string, unknown> = {};
if (q) {
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  filter.$or = [
    { name: { $regex: safe, $options: "i" } },
    { email: { $regex: safe, $options: "i" } },
  ];
}
if (planFilter && planFilter !== "all") {
  const now = new Date();
  if (planFilter === "trial") {
    filter.trialEndsAt = { $gt: now };
    filter.plan = "free";
  } else if (planFilter === "pro") {
    filter.plan = "pro";
    filter.planExpiresAt = { $gt: now };
  } else if (planFilter === "studio") {
    filter.plan = "studio";
    filter.planExpiresAt = { $gt: now };
  } else if (planFilter === "expired") {
    filter.$and = [
      { $or: [{ planExpiresAt: { $lt: now } }, { planExpiresAt: { $exists: false } }] },
      { $or: [{ trialEndsAt: { $lt: now } }, { trialEndsAt: { $exists: false } }] },
    ];
  }
}
if (statusFilter === "banned") filter.isBanned = true;
```

Update `.select()` to include plan fields:
```typescript
.select("name email isAdmin isBanned plan planExpiresAt trialEndsAt carouselsThisMonth createdAt")
```

- [ ] **Step 2: Add PATCH handler for user actions**

```typescript
export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const { userId, action, value } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "userId e action obrigatórios." }, { status: 400 });
    }

    const update: Record<string, unknown> = {};

    switch (action) {
      case "ban":
        update.isBanned = true;
        update.bannedAt = new Date();
        break;
      case "unban":
        update.isBanned = false;
        break;
      case "makeAdmin":
        update.isAdmin = true;
        break;
      case "removeAdmin":
        update.isAdmin = false;
        break;
      case "setPlan":
        if (!["free", "pro", "studio"].includes(value)) {
          return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
        }
        update.plan = value;
        if (value !== "free") {
          update.planExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
        } else {
          update.planExpiresAt = undefined;
        }
        break;
      case "extendTrial":
        const days = parseInt(value) || 7;
        const user = await User.findById(userId).select("trialEndsAt");
        const base = user?.trialEndsAt && new Date(user.trialEndsAt) > new Date()
          ? new Date(user.trialEndsAt)
          : new Date();
        update.trialEndsAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
        break;
      default:
        return NextResponse.json({ error: "Action inválida." }, { status: 400 });
    }

    await User.findByIdAndUpdate(userId, { $set: update });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/users/route.ts
git commit -m "feat(admin): expand users API — plan filter + PATCH actions (ban, setPlan, extendTrial)"
```

---

## Task 5: Build admin users page

**Files:**
- Create: `src/app/admin/users/page.tsx`

> **Context:** Table of users with filters, actions. Uses PATCH API from Task 4. Invoke `frontend-design` skill before writing UI.

- [ ] **Step 1: Invoke `frontend-design` skill**

- [ ] **Step 2: Create `src/app/admin/users/page.tsx`**

```typescript
"use client";
import * as React from "react";
import { Search, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "studio";
  trialEndsAt?: string;
  planExpiresAt?: string;
  carouselsThisMonth: number;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
}

const PLAN_COLORS: Record<string, string> = {
  pro: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  studio: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  free: "text-text-tertiary bg-bg-surface-2 border-border-subtle",
};

function daysLeft(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [planFilter, setPlanFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [actionMenu, setActionMenu] = React.useState<string | null>(null);
  const [extendDays, setExtendDays] = React.useState("7");

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => { setPage(1); }, [planFilter]);

  React.useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q: debouncedQ, plan: planFilter });
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [page, debouncedQ, planFilter]);

  async function doAction(userId: string, action: string, value?: string) {
    setActionMenu(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, value }),
    });
    if (res.ok) {
      // Refresh
      const params = new URLSearchParams({ page: String(page), q: debouncedQ, plan: planFilter });
      fetch(`/api/admin/users?${params}`)
        .then(r => r.json())
        .then(d => { setUsers(d.users || []); setTotal(d.total || 0); });
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-text-primary">Usuários</h1>
        <p className="text-body text-text-secondary mt-1">{total} usuários cadastrados</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar por nome ou email…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-border-subtle rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-body text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="all">Todos os planos</option>
          <option value="trial">Em trial</option>
          <option value="pro">Pro ativo</option>
          <option value="studio">Studio ativo</option>
          <option value="expired">Expirados</option>
          <option value="banned">Banidos</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border-subtle">
            <tr>
              {["Usuário", "Plano", "Trial / Expira", "Carrosséis", "Registro", "Ações"].map(h => (
                <th key={h} className="px-4 py-3 text-micro text-text-tertiary font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border-subtle">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-4">
                    <div className="h-4 bg-bg-surface-2 rounded animate-pulse w-24" />
                  </td>
                ))}
              </tr>
            ))}
            {!loading && users.map(user => {
              const trialLeft = daysLeft(user.trialEndsAt);
              const planLeft = daysLeft(user.planExpiresAt);
              return (
                <tr key={user._id} className="border-b border-border-subtle hover:bg-bg-surface-2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-body-strong text-text-primary">{user.name}</div>
                    <div className="text-caption text-text-tertiary">{user.email}</div>
                    {user.isAdmin && <span className="text-micro text-accent">admin</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-caption px-2 py-0.5 rounded-full border ${PLAN_COLORS[user.plan] || PLAN_COLORS.free}`}>
                      {user.isBanned ? "🚫 Banido" : user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-caption text-text-tertiary">
                    {trialLeft !== null && trialLeft > 0 && <div>Trial: {trialLeft}d restantes</div>}
                    {planLeft !== null && planLeft > 0 && <div>Expira em {planLeft}d</div>}
                    {(trialLeft === 0 || trialLeft === null) && (planLeft === 0 || planLeft === null) && (
                      <span className="text-red-400">Expirado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-body text-text-primary">{user.carouselsThisMonth ?? 0}</td>
                  <td className="px-4 py-3 text-caption text-text-tertiary">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === user._id ? null : user._id)}
                      className="p-1.5 rounded-lg hover:bg-bg-surface-2 text-text-tertiary hover:text-text-primary transition-colors"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {actionMenu === user._id && (
                      <div className="absolute right-4 top-10 z-20 bg-bg-surface border border-border-subtle rounded-lg shadow-xl min-w-[200px] py-1" onMouseLeave={() => setActionMenu(null)}>
                        <div className="px-3 py-1.5 text-micro text-text-tertiary">PLANO</div>
                        {["pro", "studio", "free"].map(p => (
                          <button key={p} onClick={() => doAction(user._id, "setPlan", p)} className="w-full text-left px-3 py-2 text-body text-text-primary hover:bg-bg-surface-2 capitalize">
                            → {p}
                          </button>
                        ))}
                        <hr className="border-border-subtle my-1" />
                        <div className="px-3 py-1.5 flex items-center gap-2">
                          <span className="text-caption text-text-tertiary">Estender trial:</span>
                          <input
                            type="number"
                            value={extendDays}
                            onChange={e => setExtendDays(e.target.value)}
                            className="w-12 px-1 py-0.5 bg-bg-base border border-border-subtle rounded text-caption text-text-primary text-center"
                          />
                          <span className="text-caption text-text-tertiary">dias</span>
                          <button onClick={() => doAction(user._id, "extendTrial", extendDays)} className="text-caption text-accent hover:underline">OK</button>
                        </div>
                        <hr className="border-border-subtle my-1" />
                        {user.isAdmin
                          ? <button onClick={() => doAction(user._id, "removeAdmin")} className="w-full text-left px-3 py-2 text-body text-text-secondary hover:bg-bg-surface-2">Remover admin</button>
                          : <button onClick={() => doAction(user._id, "makeAdmin")} className="w-full text-left px-3 py-2 text-body text-text-secondary hover:bg-bg-surface-2">Tornar admin</button>
                        }
                        {user.isBanned
                          ? <button onClick={() => doAction(user._id, "unban")} className="w-full text-left px-3 py-2 text-body text-green-400 hover:bg-green-500/10">Desbanir</button>
                          : <button onClick={() => doAction(user._id, "ban")} className="w-full text-left px-3 py-2 text-body text-red-400 hover:bg-red-500/10">Banir usuário</button>
                        }
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-2 text-body text-text-secondary border border-border-subtle rounded-lg disabled:opacity-40 hover:border-border-strong transition-colors">
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="text-body text-text-secondary">Página {page} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 px-3 py-2 text-body text-text-secondary border border-border-subtle rounded-lg disabled:opacity-40 hover:border-border-strong transition-colors">
            Próxima <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "admin/users" | head -5
```

- [ ] **Step 4: Test in browser**

Navigate to `http://localhost:3000/admin/users`. Verify:
- Table loads with users
- Search filters results
- Plan dropdown filters
- Action menu opens with correct options
- Ban/unban/setPlan/extendTrial work and table refreshes

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat(admin): users management page with filters and inline actions"
```

---

## Task 6: Create admin carousels API + page

**Files:**
- Modify: `src/app/api/admin/carousels/route.ts`
- Create: `src/app/admin/carousels/page.tsx`

> **Context:** Admin needs to see all carousels with user info and delete any. The carousel API needs to support `userId` filter.

- [ ] **Step 1: Update/create `src/app/api/admin/carousels/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Carousel from "@/models/Carousel";
import User from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 25;
  const skip = (page - 1) * limit;
  const userId = searchParams.get("userId");
  const q = searchParams.get("q") || "";

  const filter: Record<string, unknown> = {};
  if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.userId = new mongoose.Types.ObjectId(userId);
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = { $regex: safe, $options: "i" };
  }

  const [carousels, total] = await Promise.all([
    Carousel.find(filter)
      .select("title status slides createdAt userId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Carousel.countDocuments(filter),
  ]);

  // Get user names for display
  const userIds = [...new Set(carousels.map((c: any) => String(c.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select("name email").lean();
  const userMap = Object.fromEntries(users.map((u: any) => [String(u._id), u]));

  const enriched = carousels.map((c: any) => ({
    ...c,
    slideCount: Array.isArray(c.slides) ? c.slides.length : 0,
    slides: undefined, // don't send full slides in list
    user: userMap[String(c.userId)] || null,
  }));

  return NextResponse.json({ carousels: enriched, total, page, totalPages: Math.ceil(total / limit) });
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });
  await Carousel.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create `src/app/admin/carousels/page.tsx`**

```typescript
"use client";
import * as React from "react";
import { Search, Trash2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface AdminCarousel {
  _id: string; title: string; status: string; slideCount: number;
  createdAt: string; user: { name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "text-text-tertiary bg-bg-surface-2",
  ready: "text-green-400 bg-green-400/10",
  generating: "text-yellow-400 bg-yellow-400/10",
  published: "text-accent bg-accent/10",
};

export default function AdminCarouselsPage() {
  const [carousels, setCarousels] = React.useState<AdminCarousel[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q: debouncedQ });
    fetch(`/api/admin/carousels?${params}`)
      .then(r => r.json())
      .then(d => { setCarousels(d.carousels || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page, debouncedQ]);

  async function deleteCarousel(id: string) {
    if (!confirm("Excluir este carrossel permanentemente?")) return;
    await fetch("/api/admin/carousels", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setCarousels(cs => cs.filter(c => c._id !== id));
    setTotal(t => t - 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-text-primary">Carrosséis</h1>
        <p className="text-body text-text-secondary mt-1">{total} carrosséis na plataforma</p>
      </div>
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input type="text" placeholder="Buscar por título…" value={q} onChange={e => setQ(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-border-subtle rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors" />
      </div>
      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border-subtle">
            <tr>
              {["Título", "Usuário", "Slides", "Status", "Criado", ""].map(h => (
                <th key={h} className="px-4 py-3 text-micro text-text-tertiary font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border-subtle">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-4"><div className="h-4 bg-bg-surface-2 rounded animate-pulse w-24" /></td>
                ))}
              </tr>
            ))}
            {!loading && carousels.map(c => (
              <tr key={c._id} className="border-b border-border-subtle hover:bg-bg-surface-2 transition-colors">
                <td className="px-4 py-3 text-body-strong text-text-primary max-w-[200px] truncate">{c.title}</td>
                <td className="px-4 py-3">
                  {c.user ? (
                    <div>
                      <div className="text-body text-text-primary">{c.user.name}</div>
                      <div className="text-caption text-text-tertiary">{c.user.email}</div>
                    </div>
                  ) : <span className="text-text-tertiary">—</span>}
                </td>
                <td className="px-4 py-3 text-body text-text-primary">{c.slideCount}</td>
                <td className="px-4 py-3">
                  <span className={`text-caption px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || STATUS_COLORS.draft}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-caption text-text-tertiary">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a href={`/dashboard/editor/${c._id}`} target="_blank" rel="noreferrer" className="p-1.5 text-text-tertiary hover:text-accent transition-colors"><ExternalLink size={14} /></a>
                    <button onClick={() => deleteCarousel(c._id)} className="p-1.5 text-text-tertiary hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-2 text-body text-text-secondary border border-border-subtle rounded-lg disabled:opacity-40">
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="text-body text-text-secondary">Página {page} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 px-3 py-2 text-body text-text-secondary border border-border-subtle rounded-lg disabled:opacity-40">
            Próxima <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/carousels/route.ts src/app/admin/carousels/page.tsx
git commit -m "feat(admin): carousels management page with search, pagination and delete"
```

---

## Task 7: Create payments API + revenue page

**Files:**
- Create: `src/app/api/admin/payments/route.ts`
- Create: `src/app/admin/revenue/page.tsx`

> **Context:** List Payment documents (from Sprint A). Show MRR, monthly revenue, total. **Prerequisite: Sprint A Task 3 must be done (Payment model).**

- [ ] **Step 1: Create `src/app/api/admin/payments/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 25;
  const skip = (page - 1) * limit;
  const statusFilter = searchParams.get("status");

  const filter: Record<string, unknown> = {};
  if (statusFilter && statusFilter !== "all") filter.status = statusFilter;

  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);

  // Enrich with user info
  const userIds = [...new Set(payments.map((p: any) => String(p.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select("name email").lean();
  const userMap = Object.fromEntries(users.map((u: any) => [String(u._id), u]));

  const enriched = payments.map((p: any) => ({
    ...p,
    user: userMap[String(p.userId)] || null,
  }));

  // Calculate totals
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [monthlyRevenue, totalRevenue] = await Promise.all([
    Payment.aggregate([
      { $match: { status: "approved", createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amountBRL" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amountBRL" } } },
    ]),
  ]);

  return NextResponse.json({
    payments: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    monthlyRevenue: monthlyRevenue[0]?.total ?? 0,
    totalRevenue: totalRevenue[0]?.total ?? 0,
  });
}
```

- [ ] **Step 2: Create `src/app/admin/revenue/page.tsx`**

```typescript
"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Payment {
  _id: string; planType: "pro" | "studio"; amountBRL: number;
  status: "approved" | "pending" | "rejected" | "cancelled"; createdAt: string;
  user: { name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  approved: "text-green-400 bg-green-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  rejected: "text-red-400 bg-red-400/10",
  cancelled: "text-text-tertiary bg-bg-surface-2",
};

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
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-text-primary">Receita</h1>
        <p className="text-body text-text-secondary mt-1">Histórico de pagamentos via MercadoPago</p>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-accent/30 rounded-xl p-5">
          <div className="text-micro text-text-tertiary mb-2">RECEITA DO MÊS</div>
          <div className="text-[2rem] font-black text-accent">R$ {monthlyRevenue.toLocaleString("pt-BR")}</div>
        </div>
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <div className="text-micro text-text-tertiary mb-2">RECEITA TOTAL</div>
          <div className="text-[2rem] font-black text-text-primary">R$ {totalRevenue.toLocaleString("pt-BR")}</div>
        </div>
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <div className="text-micro text-text-tertiary mb-2">TOTAL PAGAMENTOS</div>
          <div className="text-[2rem] font-black text-text-primary">{total}</div>
        </div>
      </div>

      {/* Filter */}
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-body text-text-primary focus:outline-none focus:border-accent">
        <option value="all">Todos os status</option>
        <option value="approved">Aprovados</option>
        <option value="pending">Pendentes</option>
        <option value="rejected">Rejeitados</option>
        <option value="cancelled">Cancelados</option>
      </select>

      {/* Table */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border-subtle">
            <tr>
              {["Usuário", "Plano", "Valor", "Status", "Data"].map(h => (
                <th key={h} className="px-4 py-3 text-micro text-text-tertiary font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border-subtle">
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-4"><div className="h-4 bg-bg-surface-2 rounded animate-pulse w-24" /></td>
                ))}
              </tr>
            ))}
            {!loading && payments.map(p => (
              <tr key={p._id} className="border-b border-border-subtle hover:bg-bg-surface-2 transition-colors">
                <td className="px-4 py-3">
                  {p.user ? (
                    <div>
                      <div className="text-body text-text-primary">{p.user.name}</div>
                      <div className="text-caption text-text-tertiary">{p.user.email}</div>
                    </div>
                  ) : <span className="text-text-tertiary">Usuário removido</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-caption px-2 py-0.5 rounded-full capitalize ${p.planType === "studio" ? "text-yellow-400 bg-yellow-400/10" : "text-purple-400 bg-purple-400/10"}`}>
                    {p.planType}
                  </span>
                </td>
                <td className="px-4 py-3 text-body-strong text-text-primary">R$ {p.amountBRL.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`text-caption px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-caption text-text-tertiary">
                  {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {!loading && payments.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-text-tertiary">Nenhum pagamento encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-2 text-body text-text-secondary border border-border-subtle rounded-lg disabled:opacity-40">
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="text-body text-text-secondary">Página {page} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 px-3 py-2 text-body text-text-secondary border border-border-subtle rounded-lg disabled:opacity-40">
            Próxima <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/payments/route.ts src/app/admin/revenue/page.tsx
git commit -m "feat(admin): revenue page with payment history, MRR and monthly totals"
```

---

## Task 8: Add trialDays and mpStudioPriceReais to admin config page

**Files:**
- Modify: `src/app/admin/config/page.tsx`

> **Context:** The existing config page already handles mpProPriceReais. Add inputs for `trialDays` and `mpStudioPriceReais` in the MercadoPago section.

- [ ] **Step 1: Add fields to AppConfig interface in the page**

In `src/app/admin/config/page.tsx`, find `interface AppConfig`. Add:
```typescript
trialDays: number;
mpStudioPriceReais: number;
```

- [ ] **Step 2: Add UI inputs**

In the MercadoPago section, after the `mpProPriceReais` input, add:

```tsx
<div style={fieldS}>
  <label style={labelS}>Preço Studio (R$)</label>
  <input
    style={inputS}
    type="number"
    value={cfg.mpStudioPriceReais ?? 149}
    onChange={e => setCfg(c => c ? { ...c, mpStudioPriceReais: Number(e.target.value) } : c)}
  />
</div>
<div style={fieldS}>
  <label style={labelS}>Dias de Trial Gratuito</label>
  <input
    style={inputS}
    type="number"
    value={cfg.trialDays ?? 7}
    onChange={e => setCfg(c => c ? { ...c, trialDays: Number(e.target.value) } : c)}
  />
  <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
    Aplicado a novos cadastros. Não altera trials existentes.
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/config/page.tsx
git commit -m "feat(admin/config): add trialDays and mpStudioPriceReais fields"
```

---

## Task 9: Final E2E test of admin dashboard

**Files:** No code changes.

- [ ] **Step 1: Test admin access control**

Log in as non-admin user. Navigate to `http://localhost:3000/admin`. Expected: redirect to `/`.

Log in as admin user. Navigate to `/admin`. Expected: dashboard loads with stats.

- [ ] **Step 2: Test all admin pages**

- `/admin` — stats load, MRR shows, maintenance toggle works
- `/admin/users` — table loads, search works, plan filter works, action menu works
- `/admin/carousels` — table loads, search works, delete with confirm works
- `/admin/revenue` — shows 0 payments (or real data if webhook has fired), status filter works
- `/admin/config` — existing config works, new trialDays and mpStudioPriceReais fields visible

- [ ] **Step 3: Test sidebar navigation**

All 5 nav items link to correct pages. Active state highlights current page.
"← Voltar ao Dashboard" returns to `/dashboard`.
