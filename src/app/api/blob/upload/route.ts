import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Node.js runtime — process.env works reliably for server secrets
// (Edge runtime does not reliably expose non-NEXT_PUBLIC env vars in Next.js)
export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) {
            console.error("BLOB_READ_WRITE_TOKEN is not configured");
            return NextResponse.json(
                { error: "Server misconfiguration: blob token missing" },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json(
                { error: "Only PDF files are allowed" },
                { status: 400 }
            );
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File size must be under 20 MB" },
                { status: 400 }
            );
        }

        // Pass token explicitly — avoids SDK relying on process.env internally
        const blob = await put(`pdfs/${userId}/${file.name}`, file, {
            access: "public",
            addRandomSuffix: true,
            contentType: "application/pdf",
            token,
        });

        return NextResponse.json({
            blob_url: blob.url,
            file_key: blob.pathname,
            file_name: file.name,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Blob upload error:", message, error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
