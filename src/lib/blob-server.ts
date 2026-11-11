import fs from "fs";
import os from "os";
import path from "path";

/**
 * Downloads a PDF from Vercel Blob storage by its public URL and
 * saves it to a temp file on disk. Returns the local file path.
 */
export async function downloadFromBlob(blobUrl: string): Promise<string | null> {
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempDir = os.tmpdir();
    const file_name = path.join(tempDir, `pdf-${Date.now()}.pdf`);
    fs.writeFileSync(file_name, buffer);

    return file_name;
  } catch (err) {
    console.error("Error downloading from Vercel Blob:", err);
    return null;
  }
}

