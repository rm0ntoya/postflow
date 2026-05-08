# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full admin dashboard at `/admin` with user management, carousel management, maintenance mode, announcement banner, usage reports, and a seed-admin bootstrap route.

**Architecture:** Admin UI lives under `src/app/admin/`, API under `src/app/api/admin/`. Auth is two-layer: middleware rejects unauthenticated requests, each API handler calls `requireAdmin()` which reads `User.isAdmin` from MongoDB. Maintenance mode is stored in a singleton `AppConfig` MongoDB document checked server-side in the dashboard layout.

**Tech Stack:** Next.js 14 App Router, MongoDB/Mongoose, TypeScript, jose JWT, inline styles (consistent with existing dashboard dark theme).

---

## File Map

**Create:**
- `src/models/AppConfig.ts` — singleton config doc (maintenance mode, banner)
- `src/lib/adminAuth.ts` — `getAdminUser()` + `requireAdmin()` helpers
- `src/app/admin/layout.tsx` — admin layout with `getAdminUser()` guard
- `src/app/admin/page.tsx` — overview stats page (server component)
- `src/app/admin/users/page.tsx` — user list with search/ban/promote/delete (client)
- `src/app/admin/users/[id]/page.tsx` — user detail (server component)
- `src/app/admin/carousels/page.tsx` — all carousels with search/delete (client)
- `src/app/admin/config/page.tsx` — maintenance + announcement config (client)
- `src/app/admin/reports/page.tsx` — 30-day bar charts (server component)
- `src/components/admin/AdminSidebar.tsx` — sidebar nav (client component)
- `src/components/admin/StatCard.tsx` — metric card
- `src/components/admin/BarChart.tsx` — SVG bar chart, no external deps
- `src/app/api/admin/stats/route.ts` — GET aggregate KPIs
- `src/app/api/admin/users/route.ts` — GET users list (search + pagination)
- `src/app/api/admin/users/[id]/route.ts` — GET detail, PATCH (ban/unban/promote/demote), DELETE
- `src/app/api/admin/carousels/route.ts` — GET all carousels (search + pagination)
- `src/app/api/admin/carousels/[id]/route.ts` — DELETE carousel
- `src/app/api/admin/config/route.ts` — GET/PATCH AppConfig
- `src/app/api/admin/reports/route.ts` — GET 30-day time-series (unused by pages; available for future use)
- `src/app/api/admin/seed-admin/route.ts` — POST to promote email → admin (secret-gated)

**Modify:**
- `src/models/User.ts` — add `isAdmin`, `isBanned`, `bannedReason`, `bannedAt` fields
- `src/middleware.ts` — add `/admin/*` and `/api/admin/*` to protected paths
- `src/app/dashboard/layout.tsx` — convert to async server component; check maintenance/banned; show announcement banner
- `src/components/Sidebar.tsx` — add `isAdmin?: boolean` prop; show Admin link when true

---

### Task 1: Extend User model + create AppConfig model

**Files:**
- Modify: `src/models/User.ts`
- Create: `src/models/AppConfig.ts`

- [ ] **Step 1: Add admin/ban fields to IUser interface**

In `src/models/User.ts`, update `IUser` interface — add after `profileAvatarUrl`:

```typescript
  isAdmin: boolean;
  isBanned: boolean;
  bannedReason?: string;
  bannedAt?: Date;
```

In `UserSchema`, add after `profileAvatarUrl: { type: String, default: "" }`:

```typescript
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    bannedReason: { type: String },
    bannedAt: { type: Date },
```

- [ ] **Step 2: Create AppConfig model**

Create `src/models/AppConfig.ts`:

```typescript
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAppConfig extends Document {
  key: "singleton";
  maintenanceMode: boolean;
  maintenanceBanner: string;
  announcementBanner: string;
  announcementActive: boolean;
}

const AppConfigSchema = new Schema<IAppConfig>({
  key: { type: String, default: "singleton", unique: true },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceBanner: { type: String, default: "Estamos em manutenção. Voltamos em breve." },
  announcementBanner: { type: String, default: "" },
  announcementActive: { type: Boolean, default: false },
});

export async function getAppConfig(): Promise<IAppConfig> {
  const cfg = await AppConfig.findOneAndUpdate(
    { key: "singleton" },
    { $setOnInsert: { key: "singleton" } },
    { upsert: true, new: true }
  );
  return cfg!;
}

const AppConfig: Model<IAppConfig> =
  mongoose.models.AppConfig ?? mongoose.model<IAppConfig>("AppConfig", AppConfigSchema);

export default AppConfig;
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas" && npx tsc --noEmit 2>&1 | head -20`

Expected: 0 errors on User.ts or AppConfig.ts lines.

- [ ] **Step 4: Commit**

```bash
git add src/models/User.ts src/models/AppConfig.ts
git commit -m "feat(admin): extend User with isAdmin/isBanned, add AppConfig model"
```

---

### Task 2: adminAuth lib

**Files:**
- Create: `src/lib/adminAuth.ts`

- [ ] **Step 1: Create adminAuth.ts**

Create `src/lib/adminAuth.ts`:

```typescript
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export interface AdminUser {
  userId: string;
  email: string;
  isAdmin: true;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getSessionUser();
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.userId).select("isAdmin isBanned");
  if (!user || !user.isAdmin || user.isBanned) return null;
  return { userId: session.userId, email: session.email, isAdmin: true };
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  return null;
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep adminAuth`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/adminAuth.ts
git commit -m "feat(admin): add adminAuth helpers getAdminUser/requireAdmin"
```

---

### Task 3: Update middleware

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Replace middleware.ts**

Overwrite `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PROTECTED_PATHS = ["/dashboard", "/api/user", "/api/carousel", "/admin", "/api/admin"];
const AUTH_PATHS = ["/login", "/register"];
const COOKIE_NAME = "nc_token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    try {
      await verifyToken(token);
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete(COOKIE_NAME);
      return res;
    }
  }

  if (isAuthPage && token) {
    try {
      await verifyToken(token);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } catch {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/user/:path*",
    "/api/carousel/:path*",
    "/api/admin/:path*",
    "/login",
    "/register",
  ],
};
```

Note: middleware only checks JWT validity (logged in). The `isAdmin` DB check happens inside `requireAdmin()` per API route and in `admin/layout.tsx` via `getAdminUser()`.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep middleware`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(admin): protect /admin and /api/admin in middleware"
```

---

### Task 4: Seed admin API route

**Files:**
- Create: `src/app/api/admin/seed-admin/route.ts`

- [ ] **Step 1: Create seed-admin route**

Create `src/app/api/admin/seed-admin/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const { email, secret } = await req.json() as { email: string; secret: string };

  if (!secret || secret !== process.env.ADMIN_SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { isAdmin: true },
    { new: true }
  );

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json({ ok: true, email: user.email, isAdmin: user.isAdmin });
}
```

- [ ] **Step 2: Add env var**

Open `.env.local` (at the project root, same level as `package.json`) and add:

```
ADMIN_SEED_SECRET=mude-isso-para-algo-secreto-aqui
```

- [ ] **Step 3: Test manually**

Start dev server (`npm run dev`), then in another terminal:

```bash
curl -X POST http://localhost:3000/api/admin/seed-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"contato.ruanpablo2006@gmail.com","secret":"mude-isso-para-algo-secreto-aqui"}'
```

Expected: `{"ok":true,"email":"contato.ruanpablo2006@gmail.com","isAdmin":true}`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/seed-admin/route.ts
git commit -m "feat(admin): add seed-admin endpoint for first admin setup"
```

---

### Task 5: Admin API — Stats

**Files:**
- Create: `src/app/api/admin/stats/route.ts`

- [ ] **Step 1: Create stats route**

Create `src/app/api/admin/stats/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { requireAdmin } from "@/lib/adminAuth";
import { getAppConfig } from "@/models/AppConfig";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

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

  return NextResponse.json({
    totalUsers, totalCarousels, newUsersToday, newUsersWeek,
    usersWithKey, bannedUsers, adminCount, carouselsToday,
    maintenanceMode: config.maintenanceMode,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/stats/route.ts
git commit -m "feat(admin): add /api/admin/stats endpoint"
```

---

### Task 6: Admin API — User management

**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`

- [ ] **Step 1: Create users list route**

Create `src/app/api/admin/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const filter = q
    ? { $or: [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email hasGeminiKey isAdmin isBanned bannedReason createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const ids = users.map((u) => String(u._id));
  const counts = await Carousel.aggregate([
    { $match: { userId: { $in: ids } } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c: { _id: string; count: number }) => [c._id, c.count]));

  const enriched = users.map((u) => ({ ...u, carouselCount: countMap[String(u._id)] || 0 }));
  return NextResponse.json({ users: enriched, total, page, pages: Math.ceil(total / limit) });
}
```

- [ ] **Step 2: Create user detail/actions route**

Create `src/app/api/admin/users/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { requireAdmin } from "@/lib/adminAuth";

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const user = await User.findById(params.id)
    .select("name email hasGeminiKey isAdmin isBanned bannedReason bannedAt aiContext brandAccentColor createdAt")
    .lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const carousels = await Carousel.find({ userId: params.id })
    .select("title createdAt slides")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    user,
    carouselCount: carousels.length,
    carousels: carousels.map((c) => ({
      _id: c._id,
      title: c.title,
      slideCount: (c.slides as unknown[])?.length || 0,
      createdAt: c.createdAt,
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const body = await req.json() as { action: "ban" | "unban" | "promote" | "demote"; reason?: string };

  const user = await User.findById(params.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  switch (body.action) {
    case "ban":
      user.isBanned = true;
      user.bannedReason = body.reason || "Violação dos termos de uso";
      user.bannedAt = new Date();
      break;
    case "unban":
      user.isBanned = false;
      user.bannedReason = undefined;
      user.bannedAt = undefined;
      break;
    case "promote":
      user.isAdmin = true;
      break;
    case "demote":
      user.isAdmin = false;
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await user.save();
  return NextResponse.json({ ok: true, action: body.action });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const user = await User.findByIdAndDelete(params.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await Carousel.deleteMany({ userId: params.id });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/users/route.ts "src/app/api/admin/users/[id]/route.ts"
git commit -m "feat(admin): add user management API (list, detail, ban/unban/promote/demote, delete)"
```

---

### Task 7: Admin API — Carousel management

**Files:**
- Create: `src/app/api/admin/carousels/route.ts`
- Create: `src/app/api/admin/carousels/[id]/route.ts`

- [ ] **Step 1: Create carousels list route**

Create `src/app/api/admin/carousels/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Carousel from "@/models/Carousel";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const matchStage = q ? { $match: { title: { $regex: q, $options: "i" } } } : { $match: {} };

  const [carousels, countResult] = await Promise.all([
    Carousel.aggregate([
      matchStage,
      { $project: { title: 1, userId: 1, accentColor: 1, createdAt: 1, slideCount: { $size: "$slides" } } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]),
    Carousel.aggregate([matchStage, { $count: "total" }]),
  ]);

  const total = countResult[0]?.total || 0;
  return NextResponse.json({ carousels, total, page, pages: Math.ceil(total / limit) });
}
```

- [ ] **Step 2: Create carousel delete route**

Create `src/app/api/admin/carousels/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Carousel from "@/models/Carousel";
import { requireAdmin } from "@/lib/adminAuth";

interface RouteParams { params: { id: string } }

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const c = await Carousel.findByIdAndDelete(params.id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/carousels/route.ts "src/app/api/admin/carousels/[id]/route.ts"
git commit -m "feat(admin): add carousel management API (list, delete)"
```

---

### Task 8: Admin API — Config

**Files:**
- Create: `src/app/api/admin/config/route.ts`

- [ ] **Step 1: Create config route**

Create `src/app/api/admin/config/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminAuth";
import AppConfig, { getAppConfig } from "@/models/AppConfig";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const cfg = await getAppConfig();
  return NextResponse.json(cfg);
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const body = await req.json() as Partial<{
    maintenanceMode: boolean;
    maintenanceBanner: string;
    announcementBanner: string;
    announcementActive: boolean;
  }>;

  const cfg = await AppConfig.findOneAndUpdate(
    { key: "singleton" },
    { $set: body },
    { upsert: true, new: true }
  );

  return NextResponse.json(cfg);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/config/route.ts
git commit -m "feat(admin): add config API for maintenance mode and banner"
```

---

### Task 9: Admin API — Reports

**Files:**
- Create: `src/app/api/admin/reports/route.ts`

- [ ] **Step 1: Create reports route**

Create `src/app/api/admin/reports/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { requireAdmin } from "@/lib/adminAuth";

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
}

async function dailyCounts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  dateField: string,
  start: Date
): Promise<Record<string, number>> {
  const raw = await model.aggregate([
    { $match: { [dateField]: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } }, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(raw.map((r: { _id: string; count: number }) => [r._id, r.count]));
}

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();

  const days = last30Days();
  const start = new Date(days[0]);

  const [userMap, carouselMap] = await Promise.all([
    dailyCounts(User, "createdAt", start),
    dailyCounts(Carousel, "createdAt", start),
  ]);

  return NextResponse.json({
    registrations: days.map((d) => ({ date: d, count: userMap[d] || 0 })),
    carousels: days.map((d) => ({ date: d, count: carouselMap[d] || 0 })),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/reports/route.ts
git commit -m "feat(admin): add reports API with 30-day time-series"
```

---

### Task 10: Update dashboard layout — maintenance + announcement

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Replace dashboard layout with async server component**

Overwrite `src/app/dashboard/layout.tsx`:

```tsx
import "./app.css";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getAppConfig } from "@/models/AppConfig";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  await connectDB();

  const [user, cfg, carouselCount] = await Promise.all([
    User.findById(session.userId).select("isAdmin isBanned name").lean(),
    getAppConfig(),
    (await import("@/models/Carousel")).default.countDocuments({ userId: session.userId }),
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

  const userName = (user as { name?: string } | null)?.name || "";

  return (
    <div className="app">
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
        isAdmin={!!user?.isAdmin}
      />
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Update Sidebar to accept and use isAdmin prop**

In `src/components/Sidebar.tsx`:

Change the interface from:
```typescript
interface SidebarProps {
  carouselCount?: number;
  userName?: string;
}
```
To:
```typescript
interface SidebarProps {
  carouselCount?: number;
  userName?: string;
  isAdmin?: boolean;
}
```

Change function signature from:
```typescript
export default function Sidebar({ carouselCount = 0, userName = "" }: SidebarProps) {
```
To:
```typescript
export default function Sidebar({ carouselCount = 0, userName = "", isAdmin = false }: SidebarProps) {
```

After the `<div className="nav-section">Conta</div>` block, add the admin link before `<div className="nav-spacer"/>`:

```tsx
      {isAdmin && (
        <>
          <div className="nav-section">Sistema</div>
          <Link href="/admin" className="nav-link" style={{ color: "#a855f7" }}>
            <Icon name="settings"/> Admin
          </Link>
        </>
      )}
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep -E "dashboard/layout|Sidebar"`

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/layout.tsx src/components/Sidebar.tsx
git commit -m "feat(admin): async dashboard layout with maintenance/ban checks, announcement banner, admin sidebar link"
```

---

### Task 11: Admin shared components

**Files:**
- Create: `src/components/admin/AdminSidebar.tsx`
- Create: `src/components/admin/StatCard.tsx`
- Create: `src/components/admin/BarChart.tsx`

- [ ] **Step 1: Create AdminSidebar**

Create `src/components/admin/AdminSidebar.tsx`:

```tsx
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
            NovaCraft
          </div>
        </div>
        <nav style={{ flex: 1, paddingTop: 4 }}>
          {NAV.map((item) => {
            const active = path === item.href || (item.href !== "/admin" && path.startsWith(item.href));
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
```

- [ ] **Step 2: Create StatCard**

Create `src/components/admin/StatCard.tsx`:

```tsx
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
```

- [ ] **Step 3: Create BarChart**

Create `src/components/admin/BarChart.tsx`:

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx src/components/admin/StatCard.tsx src/components/admin/BarChart.tsx
git commit -m "feat(admin): add AdminSidebar, StatCard, BarChart components"
```

---

### Task 12: Admin layout

**Files:**
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Create admin layout**

Create `src/app/admin/layout.tsx`:

```tsx
import { getAdminUser } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin — NovaCraft" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connectDB();
  const admin = await getAdminUser();
  if (!admin) redirect("/dashboard");

  return <AdminSidebar>{children}</AdminSidebar>;
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "admin/layout"`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat(admin): add admin layout with isAdmin guard"
```

---

### Task 13: Admin overview page

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Create overview page**

Create `src/app/admin/page.tsx`:

```tsx
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
            transition: "border-color 0.15s",
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): add overview page with stat cards and quick action links"
```

---

### Task 14: Admin users page

**Files:**
- Create: `src/app/admin/users/page.tsx`

- [ ] **Step 1: Create users page**

Create `src/app/admin/users/page.tsx`:

```tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  hasGeminiKey: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  bannedReason?: string;
  carouselCount: number;
  createdAt: string;
}

interface ListResponse { users: AdminUser[]; total: number; pages: number; page: number }

const tdS: React.CSSProperties = { padding: "12px 16px", borderBottom: "1px solid #161616", fontSize: 13, verticalAlign: "middle" };
const thS: React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid #1e1e1e", fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", textAlign: "left" as const };

export default function AdminUsersPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&page=${page}`);
    setData(await res.json());
    setLoading(false);
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  async function action(id: string, act: string, reason?: string) {
    setBusy(id + act);
    if (act === "delete") {
      await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act, reason }),
      });
    }
    setBusy(null);
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Usuários</h1>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Buscar nome ou email..."
          style={{ background: "#111", border: "1px solid #2a2a2a", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 14, width: 280 }}
        />
      </div>

      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#444" }}>Carregando...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thS}>Usuário</th>
                <th style={thS}>Carrosséis</th>
                <th style={thS}>API Key</th>
                <th style={thS}>Status</th>
                <th style={thS}>Cadastro</th>
                <th style={thS}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((u) => (
                <tr key={u._id} style={{ background: u.isBanned ? "rgba(239,68,68,0.03)" : "transparent" }}>
                  <td style={tdS}>
                    <Link href={`/admin/users/${u._id}`} style={{ color: "#e5e5e5", textDecoration: "none", fontWeight: 600 }}>{u.name}</Link>
                    <div style={{ color: "#444", fontSize: 12, marginTop: 2 }}>{u.email}</div>
                    {u.isAdmin && <span style={{ fontSize: 10, background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderRadius: 4, padding: "2px 6px", marginTop: 3, display: "inline-block" }}>Admin</span>}
                  </td>
                  <td style={tdS}>{u.carouselCount}</td>
                  <td style={tdS}>{u.hasGeminiKey ? <span style={{ color: "#22c55e" }}>✓</span> : <span style={{ color: "#333" }}>—</span>}</td>
                  <td style={tdS}>
                    {u.isBanned
                      ? <span style={{ color: "#ef4444", fontWeight: 600, fontSize: 12 }}>Banido</span>
                      : <span style={{ color: "#22c55e", fontSize: 12 }}>Ativo</span>}
                  </td>
                  <td style={{ ...tdS, color: "#555" }}>{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td style={tdS}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const }}>
                      {u.isBanned ? (
                        <button onClick={() => action(u._id, "unban")} disabled={busy === u._id + "unban"}
                          style={{ fontSize: 11, padding: "4px 10px", background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, cursor: "pointer" }}>
                          Desbanir
                        </button>
                      ) : (
                        <button onClick={() => { const r = window.prompt("Motivo do ban:"); if (r !== null) action(u._id, "ban", r); }}
                          disabled={busy === u._id + "ban"}
                          style={{ fontSize: 11, padding: "4px 10px", background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, cursor: "pointer" }}>
                          Banir
                        </button>
                      )}
                      {u.isAdmin ? (
                        <button onClick={() => action(u._id, "demote")} style={{ fontSize: 11, padding: "4px 10px", background: "rgba(100,100,100,0.08)", color: "#666", border: "1px solid #2a2a2a", borderRadius: 6, cursor: "pointer" }}>
                          Remover admin
                        </button>
                      ) : (
                        <button onClick={() => action(u._id, "promote")} style={{ fontSize: 11, padding: "4px 10px", background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, cursor: "pointer" }}>
                          Promover
                        </button>
                      )}
                      <button onClick={() => { if (window.confirm("Deletar usuário e todos os carrosséis dele?")) action(u._id, "delete"); }}
                        style={{ fontSize: 11, padding: "4px 8px", background: "rgba(239,68,68,0.05)", color: "#7f1d1d", border: "1px solid #1e0a0a", borderRadius: 6, cursor: "pointer" }}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && data?.users.length === 0 && (
                <tr><td colSpan={6} style={{ ...tdS, textAlign: "center", color: "#444", padding: 32 }}>Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && data.pages > 1 && (
        <div style={{ display: "flex", gap: 6, marginTop: 16, justifyContent: "center" }}>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: 36, height: 36, borderRadius: 8, background: p === page ? "#a855f7" : "#111", border: "1px solid #2a2a2a", color: "#fff", cursor: "pointer", fontWeight: p === page ? 700 : 400 }}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 13, color: "#444" }}>{data?.total ?? 0} usuário(s)</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat(admin): add users management page with search, ban/unban, promote, delete"
```

---

### Task 15: Admin user detail page

**Files:**
- Create: `src/app/admin/users/[id]/page.tsx`

- [ ] **Step 1: Create user detail page**

Create `src/app/admin/users/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { notFound } from "next/navigation";

interface PageProps { params: { id: string } }

export default async function UserDetailPage({ params }: PageProps) {
  await connectDB();

  const user = await User.findById(params.id)
    .select("name email hasGeminiKey isAdmin isBanned bannedReason bannedAt aiContext brandAccentColor createdAt")
    .lean();

  if (!user) notFound();

  const carousels = await Carousel.find({ userId: params.id })
    .select("title createdAt slides")
    .sort({ createdAt: -1 })
    .lean();

  const tdS: React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid #161616", fontSize: 13 };
  const thS: React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid #1e1e1e", fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" };

  const u = user as typeof user & { name: string; email: string; hasGeminiKey: boolean; isAdmin: boolean; isBanned: boolean; bannedReason?: string; brandAccentColor?: string; aiContext?: Record<string, string> };

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
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/admin/users/[id]/page.tsx"
git commit -m "feat(admin): add user detail page with account info and carousel list"
```

---

### Task 16: Admin carousels page

**Files:**
- Create: `src/app/admin/carousels/page.tsx`

- [ ] **Step 1: Create carousels admin page**

Create `src/app/admin/carousels/page.tsx`:

```tsx
"use client";
import { useEffect, useState, useCallback } from "react";

interface AdminCarousel {
  _id: string;
  title: string;
  userId: string;
  slideCount: number;
  accentColor: string;
  createdAt: string;
}

interface ListResponse { carousels: AdminCarousel[]; total: number; pages: number; page: number }

const tdS: React.CSSProperties = { padding: "12px 16px", borderBottom: "1px solid #161616", fontSize: 13, verticalAlign: "middle" };
const thS: React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid #1e1e1e", fontSize: 11, color: "#444", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", textAlign: "left" as const };

export default function AdminCarouselsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/carousels?q=${encodeURIComponent(q)}&page=${page}`);
    setData(await res.json());
    setLoading(false);
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm("Deletar este carrossel permanentemente?")) return;
    await fetch(`/api/admin/carousels/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Carrosséis</h1>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Buscar título..."
          style={{ background: "#111", border: "1px solid #2a2a2a", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 14, width: 280 }}
        />
      </div>

      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#444" }}>Carregando...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thS}>Título</th>
                <th style={thS}>User ID</th>
                <th style={thS}>Slides</th>
                <th style={thS}>Criado</th>
                <th style={thS}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.carousels.map((c) => (
                <tr key={c._id}>
                  <td style={tdS}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.accentColor || "#FFD700", flexShrink: 0 }} />
                      {c.title}
                    </div>
                  </td>
                  <td style={{ ...tdS, color: "#444", fontFamily: "monospace", fontSize: 11 }}>
                    {c.userId.slice(-8)}…
                  </td>
                  <td style={tdS}>{c.slideCount}</td>
                  <td style={{ ...tdS, color: "#555" }}>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td style={tdS}>
                    <button onClick={() => handleDelete(c._id)}
                      style={{ fontSize: 11, padding: "4px 10px", background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6, cursor: "pointer" }}>
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && data?.carousels.length === 0 && (
                <tr><td colSpan={5} style={{ ...tdS, textAlign: "center", color: "#444", padding: 32 }}>Nenhum carrossel</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && data.pages > 1 && (
        <div style={{ display: "flex", gap: 6, marginTop: 16, justifyContent: "center" }}>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: 36, height: 36, borderRadius: 8, background: p === page ? "#a855f7" : "#111", border: "1px solid #2a2a2a", color: "#fff", cursor: "pointer" }}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 13, color: "#444" }}>{data?.total ?? 0} carrossel(is)</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/carousels/page.tsx
git commit -m "feat(admin): add carousels management page with search and delete"
```

---

### Task 17: Admin config page

**Files:**
- Create: `src/app/admin/config/page.tsx`

- [ ] **Step 1: Create config page**

Create `src/app/admin/config/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";

interface AppConfig {
  maintenanceMode: boolean;
  maintenanceBanner: string;
  announcementBanner: string;
  announcementActive: boolean;
}

const inputS: React.CSSProperties = {
  background: "#0d0d0d", border: "1px solid #2a2a2a", color: "#fff",
  borderRadius: 8, padding: "10px 14px", fontSize: 14, width: "100%", boxSizing: "border-box",
};

const labelS: React.CSSProperties = { fontSize: 13, color: "#777", fontWeight: 600, marginBottom: 8, display: "block" };

const cardS: React.CSSProperties = { background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 24, marginBottom: 16 };

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
      background: on ? "#a855f7" : "#2a2a2a", position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 27 : 3,
        width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
      }} />
    </button>
  );
}

export default function AdminConfigPage() {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config").then((r) => r.json()).then(setCfg);
  }, []);

  async function save() {
    if (!cfg) return;
    setSaving(true);
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setCfg(await res.json());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!cfg) return <div style={{ color: "#444", padding: 40 }}>Carregando...</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Configurações do Sistema</h1>
      <p style={{ color: "#555", fontSize: 14, marginBottom: 32 }}>Controle global da plataforma</p>

      <div style={{ ...cardS, borderColor: cfg.maintenanceMode ? "rgba(249,115,22,0.35)" : "#1e1e1e" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>🔧 Modo Manutenção</div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Bloqueia o acesso de usuários não-admin ao dashboard</div>
          </div>
          <Toggle on={cfg.maintenanceMode} onChange={() => setCfg((c) => c ? { ...c, maintenanceMode: !c.maintenanceMode } : c)} />
        </div>
        {cfg.maintenanceMode && (
          <div style={{ background: "rgba(249,115,22,0.07)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#f97316", marginBottom: 14, fontWeight: 600 }}>
            ⚠️ Manutenção ATIVA agora
          </div>
        )}
        <label style={labelS}>Mensagem exibida para os usuários</label>
        <input
          value={cfg.maintenanceBanner}
          onChange={(e) => setCfg((c) => c ? { ...c, maintenanceBanner: e.target.value } : c)}
          style={inputS}
        />
      </div>

      <div style={cardS}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>📢 Banner de Anúncio</div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Exibe uma faixa no topo do dashboard para todos os usuários</div>
          </div>
          <Toggle on={cfg.announcementActive} onChange={() => setCfg((c) => c ? { ...c, announcementActive: !c.announcementActive } : c)} />
        </div>
        <label style={labelS}>Texto do banner</label>
        <input
          value={cfg.announcementBanner}
          onChange={(e) => setCfg((c) => c ? { ...c, announcementBanner: e.target.value } : c)}
          style={inputS}
          placeholder="Ex: Nova funcionalidade lançada! Confira..."
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          background: saved ? "#22c55e" : "linear-gradient(90deg,#a855f7,#7c3aed)",
          color: "#fff", border: "none", borderRadius: 10, padding: "12px 30px",
          fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Configurações"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/config/page.tsx
git commit -m "feat(admin): add config page with maintenance mode toggle and announcement banner"
```

---

### Task 18: Admin reports page

**Files:**
- Create: `src/app/admin/reports/page.tsx`

- [ ] **Step 1: Create reports page**

Create `src/app/admin/reports/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/reports/page.tsx
git commit -m "feat(admin): add reports page with 30-day bar charts and peak metrics"
```

---

### Task 19: Full TypeScript check + smoke test

- [ ] **Step 1: Full TypeScript check**

Run: `cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas" && npx tsc --noEmit 2>&1`

Expected: 0 errors. Fix any errors reported before continuing.

- [ ] **Step 2: Start dev server**

Run: `npm run dev`

Expected: server starts on http://localhost:3000 with no compilation errors.

- [ ] **Step 3: Bootstrap first admin**

While dev server is running, run in a separate terminal:

```bash
curl -X POST http://localhost:3000/api/admin/seed-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"contato.ruanpablo2006@gmail.com","secret":"mude-isso-para-algo-secreto-aqui"}'
```

Expected: `{"ok":true,"email":"contato.ruanpablo2006@gmail.com","isAdmin":true}`

- [ ] **Step 4: Smoke test checklist**

Test each item manually in the browser:

1. Visit `/admin` while not logged in → redirects to `/login` ✓
2. Login as admin → sidebar shows "⚙️ Admin" link ✓
3. Click Admin link → `/admin` shows 6 stat cards + 4 quick links ✓
4. `/admin/users` → table loads, search filters results ✓
5. Ban a test user → status shows "Banido", Desbanir button appears ✓
6. `/admin/carousels` → table loads, delete a carousel ✓
7. `/admin/config` → toggle maintenance mode ON → open incognito → go to `/dashboard` → see maintenance page ✓
8. Toggle maintenance OFF → incognito dashboard works again ✓
9. Enable announcement banner → login dashboard shows purple top banner ✓
10. `/admin/reports` → two bar charts visible with 30 bars each ✓

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(admin): complete admin dashboard — overview, users, carousels, reports, config, maintenance mode"
```

---

## Self-Review

**Spec coverage:**
- ✅ User management: list with search/pagination, ban/unban, promote/demote, delete, detail view
- ✅ Carousel management: list with search/pagination, delete
- ✅ Maintenance mode: toggle in config page, blocks non-admins in dashboard layout
- ✅ Announcement banner: toggle + text, displayed at top of dashboard
- ✅ Reports: 30-day bar charts for registrations and carousel generations, with peak metrics
- ✅ Overview stats: 6 KPI cards, 4 quick-action links
- ✅ Admin auth guard: middleware (JWT check) + `getAdminUser()` per route (DB isAdmin check)
- ✅ Seed admin: `/api/admin/seed-admin` gated by `ADMIN_SEED_SECRET` env var
- ✅ Admin sidebar: sticky nav, "← Voltar ao Dashboard" link
- ✅ Banned user screen: blocks access to dashboard with explanation page
- ✅ Admin link in main dashboard sidebar (visible to admins only)

**Placeholder scan:** No TBD, TODO, "add error handling", or "similar to task N" found.

**Type consistency:**
- `IAppConfig.maintenanceMode/announcementActive/announcementBanner/maintenanceBanner` — consistent across model, API, config page, dashboard layout
- `IUser.isAdmin/isBanned/bannedReason/bannedAt` — added to model interface and schema; used correctly in all routes
- `requireAdmin()` returns `NextResponse | null` — used consistently in all 8 API routes
- `getAdminUser()` returns `AdminUser | null` — used in `admin/layout.tsx`
- `BarChart` expects `{ date: string; count: number }[]` — reports page provides exact shape
- `StatCard` expects `{ label, value, sub?, accent? }` — overview page matches
