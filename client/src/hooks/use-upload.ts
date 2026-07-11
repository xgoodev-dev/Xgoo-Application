import { useState, useCallback } from "react";
import type { UppyFile } from "@uppy/core";
import { getAuthHeaders } from "@/lib/queryClient";

interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
}

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
  metadata: UploadMetadata;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const requestUploadUrl = useCallback(
    async (file: File): Promise<UploadResponse> => {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error("Please sign in again to upload files.");
        }
        throw new Error(errorData.error || errorData.message || "Failed to get upload URL");
      }

      return response.json();
    },
    [],
  );

  const uploadToPresignedUrl = useCallback(
    async (file: File, uploadURL: string): Promise<{ objectPath: string } | null> => {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          ...authHeaders,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please sign in again to upload files.");
        }
        throw new Error("Failed to upload file to storage");
      }

      const data = await response.json().catch(() => ({}));
      return data.objectPath ? { objectPath: data.objectPath } : null;
    },
    [],
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        setProgress(10);
        const uploadResponse = await requestUploadUrl(file);

        setProgress(30);
        const putRes = await uploadToPresignedUrl(file, uploadResponse.uploadURL);
        const finalPath = putRes?.objectPath || uploadResponse.objectPath;

        setProgress(100);
        options.onSuccess?.({ ...uploadResponse, objectPath: finalPath });
        return { ...uploadResponse, objectPath: finalPath };
      } catch (err) {
        const uploadError = err instanceof Error ? err : new Error("Upload failed");
        setError(uploadError);
        options.onError?.(uploadError);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [requestUploadUrl, uploadToPresignedUrl, options],
  );

  const getUploadParameters = useCallback(
    async (
      file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    ): Promise<{
      method: "PUT";
      url: string;
      headers?: Record<string, string>;
    }> => {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please sign in again to upload files."
            : "Failed to get upload URL",
        );
      }

      const data = await response.json();
      return {
        method: "PUT",
        url: data.uploadURL,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          ...authHeaders,
        },
      };
    },
    [],
  );

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress,
  };
}
