"use client";
import { uploadPDF } from "@/lib/blob";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const FileUpload = () => {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      blob_url,
      file_key,
      file_name,
    }: {
      blob_url: string;
      file_key: string;
      file_name: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        blob_url,
        file_key,
        file_name,
      });
      return response.data;
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file.size > 20 * 1024 * 1024) {
        // 20 MB limit (matches the blob upload route)
        toast.error("File too large (max 20 MB)");
        return;
      }

      try {
        setUploading(true);
        const data = await uploadPDF(file);
        if (!data?.blob_url || !data.file_name) {
          toast.error("Something went wrong during upload");
          return;
        }
        mutate(data, {
          onSuccess: ({ chat_id }) => {
            toast.success("Chat created!");
            router.push(`/chat/${chat_id}`);
          },
          onError: (err: any) => {
            const errorMsg =
              err?.response?.data?.error ||
              err?.message ||
              "Error creating chat";
            toast.error(errorMsg);
            console.error("Chat creation error:", err);
          },
        });
      } catch (error) {
        toast.error("Upload failed");
        console.error(error);
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        {uploading || isPending ? (
          <>
            {/* Loading state */}
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="mt-2 text-sm text-slate-400">Uploading...</p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500"></Inbox>
            <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
