import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating: number;
  disabled?: boolean;
}

const Star = ({ filled, onClick, onMouseEnter, onMouseLeave }: { filled: boolean, onClick: () => void, onMouseEnter: () => void, onMouseLeave: () => void }) => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="cursor-pointer transition-colors duration-200 ease-in-out"
      style={{ color: filled ? '#FFC107' : '#E0E0E0' }}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  );
};

export const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, maxRating, disabled = false }) => {
  const [hoverValue, setHoverValue] = React.useState<number | undefined>(undefined);

  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  const handleMouseEnter = (newValue: number) => {
    if (!disabled) {
      setHoverValue(newValue);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverValue(undefined);
    }
  };

  const handleClick = (newValue: number) => {
    if (!disabled) {
      onRatingChange(newValue);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      {stars.map((starValue) => (
        <Star
          key={starValue}
          filled={(hoverValue || rating) >= starValue}
          onClick={() => handleClick(starValue)}
          onMouseEnter={() => handleMouseEnter(starValue)}
          onMouseLeave={handleMouseLeave}
        />
      ))}
    </div>
  );
};
