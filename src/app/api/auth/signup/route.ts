import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const CreatorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
  bio: z.string().max(400).optional(),
  location: z.string().optional(),
  niches: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
  role: z.literal("CREATOR"),
});

const BrandSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  industry: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().max(500).optional(),
  role: z.literal("BRAND"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.role === "CREATOR") {
      const data = CreatorSchema.parse(body);

      const existing = await db.user.findUnique({ where: { email: data.email } });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }

      const usernameExists = await db.creatorProfile.findUnique({ where: { username: data.username } });
      if (usernameExists) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await db.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          role: "CREATOR",
          creatorProfile: {
            create: {
              username: data.username,
              displayName: data.name,
              bio: data.bio,
              location: data.location,
              niches: data.niches,
              platforms: data.platforms,
              wallet: { create: {} },
            },
          },
        },
        select: { id: true, email: true, role: true },
      });

      return NextResponse.json({ success: true, user }, { status: 201 });
    }

    if (body.role === "BRAND") {
      const data = BrandSchema.parse(body);

      const existing = await db.user.findUnique({ where: { email: data.email } });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(data.password, 12);
      const slug = data.companyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const user = await db.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          role: "BRAND",
          brandProfile: {
            create: {
              companyName: data.companyName,
              slug: `${slug}-${Date.now()}`,
              description: data.description,
              websiteUrl: data.websiteUrl || null,
              industry: data.industry,
            },
          },
        },
        select: { id: true, email: true, role: true },
      });

      return NextResponse.json({ success: true, user }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 422 });
    }
    console.error("[SIGNUP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
