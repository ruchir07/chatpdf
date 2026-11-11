/**
 * Client-side PDF upload helper.
 * Sends the file as FormData to our own API route, which then
 * stores it in Vercel Blob using the server-side `put()` API.
 * This avoids the fragile two-step client-token handshake entirely.
 */
export async function uploadPDF(file: File): Promise<{
    blob_url: string;
    file_key: string;
    file_name: string;
}> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/blob/upload", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Upload failed (${response.status})`);
    }

    return response.json();
}

/** Returns the public Vercel Blob URL for a stored file pathname. */
export function getBlobUrl(pathname: string): string {
    // If a full URL is passed (e.g. already stored as pdfUrl) return as-is.
    if (pathname.startsWith("http")) return pathname;
    const storeId = process.env.BLOB_STORE_ID;
    return `https://${storeId}.public.blob.vercel-storage.com/${pathname}`;
}
