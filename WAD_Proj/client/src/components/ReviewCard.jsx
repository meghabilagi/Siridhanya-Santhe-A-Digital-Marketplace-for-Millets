import StarRating from './StarRating'

/**
 * ReviewCard — displays a single product review.
 *
 * Props:
 *   review: {
 *     reviewerName, rating, comment, createdAt
 *   }
 */
export default function ReviewCard({ review }) {
  const { reviewerName, rating, comment, createdAt } = review

  const date = createdAt ? new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '—'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-gray-800 text-sm">{reviewerName ?? 'Anonymous'}</span>
        <span className="text-xs text-gray-400">{date}</span>
      </div>

      <StarRating rating={rating} />

      {comment && (
        <p className="text-sm text-gray-600 leading-relaxed">{comment}</p>
      )}
    </div>
  )
}
