import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "CREATOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { id } = params;

  const creator = await db.creatorProfile.findUnique({ where: { userId } });
  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

  const contract = await db.contract.findUnique({ where: { id } });
  if (!contract)
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });

  if (contract.creatorId !== creator.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (contract.status !== "ACTIVE")
    return NextResponse.json({ error: "Contract is not active" }, { status: 400 });

  const { videoUrl, videoPublicId, socialPostUrl } = await req.json();
  if (!videoUrl)
    return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });

  // Generate thumbnail URL from Cloudinary video
  const thumbnailUrl = videoUrl
    .replace("/upload/", "/upload/pg_1/")
    .replace(/\.(mp4|mov|avi|webm)$/i, ".jpg");

  // AI analysis
  let aiAnalysis = "";
  let aiApproved = false;
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: thumbnailUrl },
            },
            {
              type: "text",
              text: "You are reviewing a promotional video frame for a brand campaign. The deliverable was: " +
                contract.deliverable +
                ". Does this video appear to be a genuine promotional video? Is the content appropriate and professional? Reply with: APPROVED or REJECTED, then a brief reason.",
            },
          ],
        },
      ],
    });
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    aiAnalysis = text;
    aiApproved = text.toUpperCase().startsWith("APPROVED");
  } catch (err) {
    console.error("AI analysis error:", err);
    aiAnalysis = "AI analysis unavailable";
    aiApproved = false;
  }

  const submission = await db.videoSubmission.create({
    data: {
      contractId: id,
      creatorId: creator.id,
      videoUrl,
      socialPostUrl: socialPostUrl || null,
      aiAnalysis,
      aiScore: aiApproved ? 100 : 0,
      status: aiApproved ? "AI_APPROVED" : "AI_REJECTED",
    },
  });

  await db.contract.update({
    where: { id },
    data: { status: "SUBMITTED" },
  });

  return NextResponse.json({
    submissionId: submission.id,
    aiApproved,
    aiAnalysis,
  });
}
