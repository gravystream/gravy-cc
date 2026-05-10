import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes, createHash } from "crypto";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `nvc_${randomBytes(32).toString("hex")}`;
  const hash = hashKey(raw);
  const prefix = raw.substring(0, 12);
  return { raw, hash, prefix };
}

// GET - List API keys for authenticated brand
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandProfile = await db.brandProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const keys = await db.apiKey.findMany({
      where: { brandId: brandProfile.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
  } catch (error: any) {
    console.error("API keys GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new API key
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandProfile = await db.brandProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, scopes, expiresInDays } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Limit to 5 active keys
    const activeCount = await db.apiKey.count({
      where: { brandId: brandProfile.id, isActive: true },
    });
    if (activeCount >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 active API keys allowed" },
        { status: 400 }
      );
    }

    const { raw, hash, prefix } = generateApiKey();

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const key = await db.apiKey.create({
      data: {
        brandId: brandProfile.id,
        name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: scopes || ["read:campaigns", "read:analytics"],
        expiresAt,
      },
    });

    // Return the raw key ONLY on creation (never stored in plain text)
    return NextResponse.json(
      { key: { id: key.id, name: key.name, keyPrefix: key.keyPrefix, scopes: key.scopes, expiresAt: key.expiresAt, createdAt: key.createdAt }, rawKey: raw },
      { status: 201 }
    );
  } catch (error: any) {
      console.error("API key create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Revoke an API key
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("keyId");

    if (!keyId) {
      return NextResponse.json({ error: "keyId required" }, { status: 400 });
    }

    const brandProfile = await db.brandProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const key = await db.apiKey.findFirst({
      where: { id: keyId, brandId: brandProfile.id },
    });
    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    await db.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API key delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
