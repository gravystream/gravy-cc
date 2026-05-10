import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface VideoUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export async function uploadVideo(
  fileBuffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    eager?: string;
  } = {}
): Promise<VideoUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: options.folder || "novaclio/videos",
        public_id: options.publicId,
        eager: [
          // Generate thumbnail
          { width: 640, height: 360, crop: "fill", format: "jpg" },
          // Generate HLS adaptive streaming
          { streaming_profile: "hd", format: "m3u8" },
        ],
        eager_async: true,
        eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));

        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          thumbnailUrl: cloudinary.url(result.public_id, {
            resource_type: "video",
            format: "jpg",
            transformation: [
              { width: 640, height: 360, crop: "fill" },
              { start_offset: "auto" },
            ],
          }),
          duration: result.duration || 0,
          width: result.width || 0,
          height: result.height || 0,
          format: result.format || "mp4",
          bytes: result.bytes || 0,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export function getVideoStreamUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    format: "m3u8",
    streaming_profile: "hd",
  });
}

export function getVideoThumbnail(
  publicId: string,
  options: { width?: number; height?: number; timestamp?: string } = {}
): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    format: "jpg",
    transformation: [
      {
        width: options.width || 640,
        height: options.height || 360,
        crop: "fill",
      },
      { start_offset: options.timestamp || "auto" },
    ],
  });
}

export function getOptimizedVideoUrl(
  publicId: string,
  options: { quality?: string; format?: string; width?: number } = {}
): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    format: options.format || "mp4",
    transformation: [
      {
        quality: options.quality || "auto",
        fetch_format: "auto",
        ...(options.width ? { width: options.width, crop: "scale" } : {}),
      },
    ],
  });
}

export async function deleteVideo(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
}

export { cloudinary };
