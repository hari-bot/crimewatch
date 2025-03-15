"use client";

import type React from "react";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { extractImageLocation } from "@/utils/exif-utils";

interface ImageUploadProps {
  onImageSelected: (file: File, preview: string) => void;
  onLocationExtracted: (lat: number, lng: number) => void;
  toast: any;
}

export default function ImageUpload({
  onImageSelected,
  onLocationExtracted,
  toast,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setImagePreview(preview);
        onImageSelected(file, preview);
      };
      reader.readAsDataURL(file);

      // Try to extract location from image metadata
      extractImageLocation(file, onLocationExtracted, toast);
    }
  };

  return (
    <div className="mt-1.5 flex items-center gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload Image
      </Button>
      <Input
        ref={fileInputRef}
        id="image"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
      {imagePreview ? (
        <div className="relative h-16 w-16 rounded-md overflow-hidden">
          <img
            src={imagePreview || "/placeholder.svg"}
            alt="Preview"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No image selected</div>
      )}
    </div>
  );
}
