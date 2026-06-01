import QRCode from "qrcode";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate a QR code for a tracking URL and pin it to Cloudinary.
 * Returns the secure URL of the uploaded PNG. Falls back to the inline
 * data-URL if Cloudinary credentials are missing (so dev/staging without
 * full setup still gets a working QR).
 */
export async function generateAndUploadQrCode(
  url: string,
  publicIdSuffix: string
): Promise<string> {
  const dataUrl = await QRCode.toDataURL(url, {
    margin: 1,
    width: 600,
    errorCorrectionLevel: "M",
  });

  const hasCloudinaryCreds =
    !!process.env.CLOUDINARY_API_KEY &&
    !!process.env.CLOUDINARY_API_SECRET &&
    !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!hasCloudinaryCreds) {
    return dataUrl;
  }

  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      public_id: `qr-${publicIdSuffix}`,
      folder: "novaclio/qr",
      overwrite: true,
      resource_type: "image",
    });
    return result.secure_url;
  } catch (err) {
    console.error("QR upload to Cloudinary failed, returning data URL:", err);
    return dataUrl;
  }
}
