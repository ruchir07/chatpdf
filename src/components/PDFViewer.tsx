"use client";
import React from "react";
import { ExternalLink } from "lucide-react";

type Props = {
  pdf_url: string;
};

const PDFViewer = ({ pdf_url }: Props) => {
  if (!pdf_url) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No PDF URL provided
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg overflow-hidden">
      {/* Fallback & Fullscreen Action */}
      <div className="flex justify-end items-center px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs text-gray-600">
        <a
          href={pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-blue-600 font-medium transition-colors"
        >
          Open PDF in new tab <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Native Browser PDF Viewer (no Google Docs Viewer crash/download) */}
      <iframe
        src={pdf_url}
        className="w-full flex-1 border-none"
        title="PDF Document"
      />
    </div>
  );
};

export default PDFViewer;
