
import { auth } from "@clerk/nextjs/server";
import {
    handleUpload,
    type HandleUploadBody,
} from "@vercel/blob/client";

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return Response.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,

            onBeforeGenerateToken: async (pathname) => {
                return {
                    allowedContentTypes: ["application/pdf"],
                    maximumSizeInBytes: 20 * 1024 * 1024,
                    addRandomSuffix: true,

                    tokenPayload: JSON.stringify({
                        userId,
                    }),
                };
            },

            onUploadCompleted: async ({ blob, tokenPayload }) => {
                const payload = JSON.parse(tokenPayload || "{}");

                console.log("PDF uploaded:", {
                    pathname: blob.pathname,
                    userId: payload.userId,
                });
            },
        });

        return Response.json(jsonResponse);
    } catch (error) {
        console.error("BLOB UPLOAD ERROR:", error);

        return Response.json(
            { error: "Upload failed" },
            { status: 400 }
        );
    }
}