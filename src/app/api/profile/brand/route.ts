import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/profile/brand — get current brand's profile
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile });
}

// POST /api/profile/brand — create brand profile
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "BRAND") {
    return NextResponse.json({ error: "Only brands can create a brand profile" }, { status: 403 });
  }

  const existing = await db.brandProfile.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "Profile already exists, use PUT to update" }, { status: 400 });
  }

  const { companyName, industry, logoUrl, website, description } = await req.json();
  if (!companyName) {
    return NextResponse.json({ error: "companyName is required" }, { status: 400 });
  }

  const profile = await db.brandProfile.create({
    data: {
      userId: user.id,
      companyName,
      industry: industry ?? "",
      logoUrl: logoUrl ?? null,
      website: website ?? null,
      description: description ?? "",
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}

// PUT /api/profile/brand — update brand profile
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.brandProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const updates = await req.json();

  const updatedProfile = await db.brandProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(updates.companyName && { companyName: updates.companyName }),
      ...(updates.industry !== undefined && { industry: updates.industry }),
      ...(updates.logoUrl !== undefined && { logoUrl: updates.logoUrl }),
      ...(updates.website !== undefined && { website: updates.website }),
      ...(updates.description !== undefined && { description: updates.description }),
    },
  });

  return NextResponse.json({ profile: updatedProfile });
}
