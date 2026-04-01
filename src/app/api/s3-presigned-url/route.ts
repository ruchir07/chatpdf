import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_name, file_type } = await req.json();

        AWS.config.update({
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        });

        const s3 = new AWS.S3({
            region: 'eu-north-1'
        });

        const file_key = 'uploads/' + Date.now().toString() + file_name.replace(/\s/g, '-');

        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
            Key: file_key,
            Expires: 60, // 60 seconds
            ContentType: file_type
        };

        const uploadUrl = await s3.getSignedUrlPromise('putObject', params);

        return NextResponse.json({
            uploadUrl,
            file_key
        });
    } catch (error) {
        console.error("Error creating presigned URL:", error);
        return NextResponse.json({ error: 'Failed to generate pre-signed URL' }, { status: 500 });
    }
}
