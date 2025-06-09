import { useState } from 'react';
import { StarRatingProps } from '../types';

const StarRating = ({
  initialRating = 0,
  maxRating = 5,
  onChange,
  editable = true
}: StarRatingProps) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (index: number) => {
    if (!editable) return;
    const newRating = index + 1;
    setRating(newRating);
    if (onChange) {
      onChange(newRating);
    }
  };

  return (
    <div className="flex justify-center space-x-2">
      {[...Array(maxRating)].map((_, index) => {
        const active = index < (hoverRating || rating);
        
        return (
          <button
            key={index}
            type="button"
            className={`w-10 h-10 focus:outline-none ${editable ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => handleClick(index)}
            onMouseEnter={() => editable && setHoverRating(index + 1)}
            onMouseLeave={() => editable && setHoverRating(0)}
          >
            <svg
              className={`w-full h-full ${active ? 'text-amber-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating; 