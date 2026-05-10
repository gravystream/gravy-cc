import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadVideo, deleteVideo } from "@/lib/cloudinary-video";
import { db } from "@/lib/db";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // "portfolio" | "submission" | "deliverable"
    const title = (formData.get("title") as string) || "Untitled Video";
    const description = formData.get("description") as string | null;
    const referenceId = formData.get("referenceId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: MP4, MOV, WebM, AVI" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 500MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadVideo(buffer, {
      folder: `novaclio/${type}/${session.user.id}`,
    });

    let record;
    if (type === "portfolio") {
      const creatorProfile = await db.creatorProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (creatorProfile) {
        record = await db.portfolioVideo.create({
          data: {
            creatorId: creatorProfile.id,
            title,
            description,
            cloudinaryId: result.publicId,
            cloudinaryUrl: result.secureUrl,
            thumbnailUrl: result.thumbnailUrl,
            durationSeconds: Math.round(result.duration),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      video: {
        url: result.secureUrl,
        thumbnailUrl: result.thumbnailUrl,
        publicId: result.publicId,
        duration: result.duration,
        width: result.width,
        height: result.height,
        format: result.format,
      },
      record,
    });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId, videoId } = await req.json();

    if (publicId) {
      await deleteVideo(publicId);
    }

    if (videoId) {
      await db.portfolioVideo.delete({ where: { id: videoId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Video delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
