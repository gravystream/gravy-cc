import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
 
const creatorSchema = z.object({
  role: z.literal("CREATOR"),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  category: z.string().optional(),
  platforms: z.array(z.string()).optional(),
});
 
const brandSchema = z.object({
  role: z.literal("BRAND"),
  companyName: z.string().min(1).max(200),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().max(500).optional(),
});
 
export async function POST(req: Request) {
  try {
    const session = await auth();
 
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 
    const body = await req.json();
    const userId = session.user.id;
 
    if (body.role === "CREATOR") {
      const data = creatorSchema.parse(body);
 
      const existingUsername = await db.creatorProfile.findUnique({
        where: { username: data.username },
      });
 
      if (existingUsername) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
 
      const existingProfile = await db.creatorProfile.findUnique({
        where: { userId },
      });
 
      if (existingProfile) {
        return NextResponse.json(
          { error: "Profile already exists" },
          { status: 409 }
        );
      }
 
      await db.$transaction([
        db.user.update({
          where: { id: userId },
          data: { role: "CREATOR" },
        }),
        db.creatorProfile.create({
          data: {
            userId,
            username: data.username,
            displayName: data.displayName,
            bio: data.bio ?? "",
            category: data.category ?? "",
            platforms: data.platforms ?? [],
            wallet: { create: {} },
          },
        }),
      ]);
 
      return NextResponse.json({ success: true, role: "CREATOR" });
    }
 
    if (body.role === "BRAND") {
      const data = brandSchema.parse(body);
 
      const baseSlug = data.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
 
      let slug = baseSlug;
      let counter = 1;
      while (await db.brandProfile.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
 
      const existingProfile = await db.brandProfile.findUnique({
        where: { userId },
      });
 
      if (existingProfile) {
        return NextResponse.json(
          { error: "Profile already exists" },
          { status: 409 }
        );
      }
 
      await db.$transaction([
        db.user.update({
          where: { id: userId },
          data: { role: "BRAND" },
        }),
        db.brandProfile.create({
          data: {
            userId,
            companyName: data.companyName,
            slug,
            industry: data.industry ?? "",
            website: data.website || null,
            description: data.description ?? "",
          },
        }),
      ]);
 
      return NextResponse.json({ success: true, role: "BRAND" });
    }
 
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 422 }
      );
    }
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
