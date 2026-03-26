import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) return successResponse;

    // Don't send reset email if user has no password (OAuth only)
    if (!user.passwordHash) return successResponse;

    // Delete any existing reset tokens for this user
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Store token with 1 hour expiry
    await db.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // Send reset email
    const resetUrl = `https://novaclio.io/reset-password?token=${token}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    return successResponse;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
