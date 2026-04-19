import { useState } from 'react'

/**
 * StarRating — renders 1–5 stars.
 *
 * Props:
 *   rating: number (1–5)
 *   interactive: boolean (default false) — enables click-to-rate
 *   onRate: (n: number) => void — called when a star is clicked (interactive mode)
 */
export default function StarRating({ rating = 0, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0)

  const display = interactive && hovered ? hovered : Math.round(rating)

  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display
        return (
          <span
            key={n}
            className={`text-xl leading-none select-none ${
              filled ? 'text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={interactive ? () => onRate?.(n) : undefined}
            onMouseEnter={interactive ? () => setHovered(n) : undefined}
            onMouseLeave={interactive ? () => setHovered(0) : undefined}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? `Rate ${n} star${n !== 1 ? 's' : ''}` : undefined}
          >
            {filled ? '★' : '☆'}
          </span>
        )
      })}
    </div>
  )
}
