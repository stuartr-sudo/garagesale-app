import React from 'react';

export default function BundleImageCollage({ bundleItems, maxImages = 4 }) {
  // Extract first image from each item
  const itemImages = bundleItems
    ?.map(bundleItem => bundleItem.items?.image_urls?.[0])
    .filter(Boolean) || [];

  // Limit to maxImages for display
  const displayImages = itemImages.slice(0, maxImages);
  const remainingCount = Math.max(0, itemImages.length - maxImages);

  if (displayImages.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500 text-sm">No images</span>
      </div>
    );
  }

  if (displayImages.length === 1) {
    return (
      <div className="w-full h-full relative">
        <img
          src={displayImages[0]}
          alt="Bundle item"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
          }}
        />
      </div>
    );
  }

  if (displayImages.length === 2) {
    return (
      <div className="w-full h-full grid grid-cols-2 gap-1">
        {displayImages.map((imageUrl, index) => (
          <div key={index} className="relative overflow-hidden">
            <img
              src={imageUrl}
              alt={`Bundle item ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (displayImages.length === 3) {
    return (
      <div className="w-full h-full grid grid-cols-2 gap-1">
        <div className="row-span-2 relative overflow-hidden">
          <img
            src={displayImages[0]}
            alt="Bundle item 1"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
            }}
          />
        </div>
        <div className="relative overflow-hidden">
          <img
            src={displayImages[1]}
            alt="Bundle item 2"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
            }}
          />
        </div>
        <div className="relative overflow-hidden">
          <img
            src={displayImages[2]}
            alt="Bundle item 3"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
            }}
          />
        </div>
      </div>
    );
  }

  // 4 or more images - 2x2 grid with overflow indicator
  return (
    <div className="w-full h-full grid grid-cols-2 gap-1">
      {displayImages.slice(0, 4).map((imageUrl, index) => (
        <div key={index} className="relative overflow-hidden">
          <img
            src={imageUrl}
            alt={`Bundle item ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
            }}
          />
          {/* Show remaining count on the last image */}
          {index === 3 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
