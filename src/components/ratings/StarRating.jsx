import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating, onRatingChange, size = "md", readOnly = false, showLabel = true }) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleRating = (rate) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(rate);
    }
  };

  const handleMouseEnter = (rate) => {
    if (!readOnly) {
      setHoverRating(rate);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          return (
            <Star
              key={starValue}
              className={`
                ${sizeClasses[size]} 
                ${starValue <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}
                ${!readOnly ? 'cursor-pointer' : ''}
              `}
              onClick={() => handleRating(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-stone-600">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
}