import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

// Edge runtime: no 4.5MB body-size limit, handles large PDFs (up to 20MB)
export const runtime = "edge";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Explicit token check — surfaces missing env var immediately
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error("BLOB_READ_WRITE_TOKEN is not set");
            return Response.json(
                { error: "Server misconfiguration: BLOB_READ_WRITE_TOKEN missing" },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return Response.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return Response.json(
                { error: "Only PDF files are allowed" },
                { status: 400 }
            );
        }

        if (file.size > 20 * 1024 * 1024) {
            return Response.json(
                { error: "File size must be under 20 MB" },
                { status: 400 }
            );
        }

        // Upload directly to Vercel Blob — no client-token handshake needed
        const blob = await put(`pdfs/${userId}/${file.name}`, file, {
            access: "public",
            addRandomSuffix: true,
            contentType: "application/pdf",
        });

        return Response.json({
            blob_url: blob.url,
            file_key: blob.pathname,
            file_name: file.name,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Blob upload error:", message, error);
        return Response.json({ error: message }, { status: 500 });
    }
}
