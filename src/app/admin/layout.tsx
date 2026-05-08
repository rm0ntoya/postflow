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
