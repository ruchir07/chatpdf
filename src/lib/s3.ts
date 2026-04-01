import axios from 'axios';

export async function uploadS3(file: File) {
    try {
        // Ask the backend for a secure presigned S3 url
        const response = await axios.post('/api/s3-presigned-url', {
            file_name: file.name,
            file_type: file.type
        });

        const { uploadUrl, file_key } = response.data;

        // Use axios to perform the PUT request to the pre-signed URL directly
        const upload = axios.put(uploadUrl, file, {
            headers: {
                'Content-Type': file.type,
            },
            onUploadProgress: (progressEvent) => {
                // Upload progress can be tracked here if needed
            }
        });

        await upload;

        return {
            file_key,
            file_name: file.name
        };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export function getS3Url(file_key: string) {
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${file_key}`
    return url;
}