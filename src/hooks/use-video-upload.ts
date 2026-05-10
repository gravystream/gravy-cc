"use client";

import { useState, useCallback } from "react";

interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

interface VideoUploadResult {
  url: string;
  thumbnailUrl: string;
  publicId: string;
  duration: number;
  width: number;
  height: number;
  format: string;
}

interface UseVideoUploadOptions {
  type: "portfolio" | "submission" | "deliverable";
  onSuccess?: (result: VideoUploadResult) => void;
  onError?: (error: string) => void;
}

export function useVideoUpload({ type, onSuccess, onError }: UseVideoUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, metadata?: { title?: string; description?: string; referenceId?: string }) => {
      setIsUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percent: 0 });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        if (metadata?.title) formData.append("title", metadata.title);
        if (metadata?.description) formData.append("description", metadata.description);
        if (metadata?.referenceId) formData.append("referenceId", metadata.referenceId);

        const xhr = new XMLHttpRequest();

        const result = await new Promise<VideoUploadResult>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress({
                loaded: e.loaded,
                total: e.total,
                percent: Math.round((e.loaded / e.total) * 100),
              });
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              if (data.success) {
                resolve(data.video);
              } else {
                reject(new Error(data.error || "Upload failed"));
              }
            } else {
              reject(new Error("Upload failed with status " + xhr.status));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

          xhr.open("POST", "/api/video");
          xhr.send(formData);
        });

        onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        onError?.(message);
        return null;
      } finally {
        setIsUploading(false);
        setProgress(null);
      }
    },
    [type, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setError(null);
    setProgress(null);
    setIsUploading(false);
  }, []);

  return { upload, isUploading, progress, error, reset };
}
