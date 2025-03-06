import { Star } from 'lucide-react';

// Componente de calificación por estrellas
const StarRating = ({ rating, setRating }: { rating: number; setRating: (value: number) => void }) => {
  return (
    <div className="flex space-x-4 justify-center my-8">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={48}
          fill={star <= rating ? "#FFB800" : "none"}
          stroke={star <= rating ? "#FFB800" : "#D1D5DB"}
          strokeWidth={1.5}
          className="cursor-pointer hover:scale-110 transition-transform"
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
};

export default StarRating; 