import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if ((session.user as any).role === "BRAND") {
    redirect("/brand");
  }

  redirect("/creator");
}
