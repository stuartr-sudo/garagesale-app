import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, Plus, Loader2, ImageIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileCameraCapture from "@/components/camera/MobileCameraCapture";

export default function ImageUpload({ images = [], onUpload, onRemove, isUploading = false }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [showMobileCamera, setShowMobileCamera] = useState(false);
  const isMobile = useIsMobile();

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const handleMobileCameraCapture = (result) => {
    // Convert the captured image to a File object
    fetch(result.image)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        onUpload([file]);
        setShowMobileCamera(false);
      });
  };

  // Ensure images is always an array
  const safeImages = Array.isArray(images) ? images : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {safeImages.map((imageUrl, index) => (
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
        
        {safeImages.length < 8 && (
          <div 
            className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center space-y-2 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
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

        {isMobile ? (
          <Button
            type="button"
            onClick={() => setShowMobileCamera(true)}
            disabled={isUploading}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </>
            )}
          </Button>
        ) : (
          <>
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
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-12 rounded-xl bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300 font-semibold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </>
              )}
            </Button>
          </>
        )}
      </div>

      <p className="text-sm text-gray-500 text-center">
        {isMobile 
          ? "Add up to 8 photos. Tap the placeholder to choose from gallery or 'Take Photo' for camera."
          : "Add up to 8 photos. Click the placeholder to upload or 'Take Photo' for camera. The first photo will be the main image."
        }
      </p>

      {/* Mobile Camera Modal */}
      {showMobileCamera && (
        <MobileCameraCapture
          onCapture={handleMobileCameraCapture}
          onClose={() => setShowMobileCamera(false)}
        />
      )}
    </div>
  );
}