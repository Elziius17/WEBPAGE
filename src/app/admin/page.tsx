import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminIndex() {
  const user = await getCurrentUser();
  redirect(user?.role === "TECHNICIAN" ? "/admin/ordenes" : "/admin/dashboard");
}
