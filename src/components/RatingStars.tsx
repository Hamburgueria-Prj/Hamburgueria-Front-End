type RatingStarsProps = {
  rating: number;
};

export function RatingStars({ rating }: RatingStarsProps) {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const value = index + 1;
    return value <= Math.round(rating) ? '★' : '☆';
  });

  return (
    <div className="rating" aria-label={`Avaliação ${rating} de 5`}>
      {stars.map((star, index) => (
        <span key={`${star}-${index}`}>{star}</span>
      ))}
    </div>
  );
}
