import { upload } from "@vercel/blob/client";

export async function uploadPDF(file: File) {
  try {
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/blob/upload",
      contentType: "application/pdf",
    });

    return {
      // Use the blob URL as a stable key (strip the base URL for a path-like key)
      file_key: blob.pathname,
      file_name: file.name,
      blob_url: blob.url,
    };
  } catch (err) {
    console.error("Vercel Blob upload error:", err);
    throw err;
  }
}

/** Returns the public Vercel Blob URL for a stored file pathname. */
export function getBlobUrl(pathname: string): string {
  // If a full URL is passed (e.g. already stored as pdfUrl) return as-is.
  if (pathname.startsWith("http")) return pathname;
  // Vercel Blob public URLs follow this pattern:
  const storeId = process.env.BLOB_STORE_ID;
  return `https://${storeId}.public.blob.vercel-storage.com/${pathname}`;
}

