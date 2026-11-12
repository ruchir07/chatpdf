import fs from "fs";
import os from "os";
import path from "path";

/**
 * Downloads a PDF from Vercel Blob storage by its URL and
 * saves it to a temp file on disk. Returns the local file path.
 */
export async function downloadFromBlob(blobUrl: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
  }

  const response = await fetch(blobUrl, { headers });
  if (!response.ok) {
    throw new Error(
      `Failed to download PDF from Blob (${response.status} ${response.statusText}): ${blobUrl}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const tempDir = os.tmpdir();
  const file_name = path.join(tempDir, `pdf-${Date.now()}.pdf`);
  fs.writeFileSync(file_name, buffer);

  return file_name;
}
