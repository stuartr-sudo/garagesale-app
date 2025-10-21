import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, Plus } from "lucide-react";

export default function ImageUpload({ images, onUpload, onRemove }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onUpload(files);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={`Item image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 w-6 h-6 rounded-full"
              onClick={() => onRemove(index)}
            >
              <X className="w-3 h-3" />
            </Button>
            {index === 0 && (
              <div className="absolute bottom-2 left-2">
                <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded">
                  Main
                </span>
              </div>
            )}
          </div>
        ))}
        
        {images.length < 8 && (
          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center space-y-2 bg-gray-50 hover:bg-gray-100 transition-colors">
            <Plus className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-500">Add Photo</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-12 rounded-xl"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Photos
        </Button>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 h-12 rounded-xl"
        >
          <Camera className="w-4 h-4 mr-2" />
          Take Photo
        </Button>
      </div>

      <p className="text-sm text-gray-500 text-center">
        Add up to 8 photos. The first photo will be the main image.
      </p>
    </div>
  );
}