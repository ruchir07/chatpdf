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
        console.error("Blob upload error:", error);
        return Response.json({ error: "Upload failed" }, { status: 500 });
    }
}
