'use client';

import { Image as ImageIcon } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl: string | null;
}

export default function ImagePreview({ imageUrl }: ImagePreviewProps) {
  if (!imageUrl) {
    return (
      <div className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No image selected</p>
          <p className="text-gray-400 text-sm mt-1">
            Choose an image from the options on the left
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <img
        src={imageUrl}
        alt="Selected image for story generation"
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
}