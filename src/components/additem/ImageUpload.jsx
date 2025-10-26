import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, Plus, Loader2, ImageIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileCameraCapture from "@/components/camera/MobileCameraCapture";

export default function ImageUpload({ images = [], onUpload, onRemove, onSetMain, isUploading = false }) {
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
          <div key={index} className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100 ${index === 0 ? 'ring-2 ring-emerald-500' : ''}`}>
            <img
              src={imageUrl}
              alt={`Item image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Remove button */}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 w-6 h-6 rounded-full"
              onClick={() => onRemove(index)}
            >
              <X className="w-3 h-3" />
            </Button>
            
            {/* Main image indicator */}
            {index === 0 && (
              <div className="absolute bottom-2 left-2">
                <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded font-semibold">
                  Main
                </span>
              </div>
            )}
            
            {/* Set as main button for non-main images */}
            {index !== 0 && onSetMain && (
              <Button
                type="button"
                size="sm"
                className="absolute bottom-2 left-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1 rounded font-semibold"
                onClick={() => onSetMain(index)}
              >
                Set as Main
              </Button>
            )}
          </div>
        ))}
        
        {safeImages.length < 8 && (
          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-4 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-4/5 max-w-[220px] px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center text-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Add from library</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-sm text-gray-500 text-center">
        {isMobile 
          ? "Add up to 8 photos. Use 'Add from library' or 'Take photo' buttons. Use 'Set as Main' to choose your main image."
          : "Add up to 8 photos. Use 'Add from library' button to upload images. Use 'Set as Main' to choose your main image."
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