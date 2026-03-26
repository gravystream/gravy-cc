import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ isAdmin: false, error: "Not authenticated" }, { status: 401 });
  }
  const role = (session.user as any).role;
  const isAdmin = ADMIN_ROLES.includes(role);
  return NextResponse.json({ isAdmin, role: isAdmin ? role : undefined });
}
