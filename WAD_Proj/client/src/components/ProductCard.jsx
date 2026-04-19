import { Link } from 'react-router-dom'
import StarRating from './StarRating'

// Fallback images by millet type if no image stored in DB
const FALLBACK_IMAGES = {
  'Foxtail':  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
  'Pearl':    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
  'Finger':   'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80',
  'Sorghum':  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Barnyard': 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b4b5?w=600&q=80',
  'Little':   'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600&q=80',
  'default':  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
}

const GRADE_BADGE = {
  A:       'bg-green-100 text-green-700',
  B:       'bg-blue-100 text-blue-700',
  C:       'bg-gray-100 text-gray-600',
  Organic: 'bg-amber-100 text-amber-700',
}

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n} className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ProductCard({ product }) {
  const {
    _id, name, milletType, price, qualityGrade,
    averageRating = 0, reviewCount = 0,
    farmerName, farmerState, image, quantity
  } = product

  const fallbackKey = Object.keys(FALLBACK_IMAGES).find(k =>
    milletType?.toLowerCase().includes(k.toLowerCase())
  ) ?? 'default'
  const imgSrc = image || FALLBACK_IMAGES[fallbackKey]
  const badgeClass = GRADE_BADGE[qualityGrade] ?? 'bg-gray-100 text-gray-600'

  return (
    <Link
      to={`/products/${_id}`}
      className="block bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 group"
    >
      {/* Image — Amazon style: white bg, centered product image */}
      <div className="relative bg-gray-50 h-52 flex items-center justify-center overflow-hidden border-b border-gray-100">
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = FALLBACK_IMAGES.default }}
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {qualityGrade === 'Organic' && (
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              Organic
            </span>
          )}
          {reviewCount > 100 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              Best Seller
            </span>
          )}
        </div>
        {quantity < 50 && (
          <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
            Low Stock
          </div>
        )}
      </div>

      {/* Content — Amazon style layout */}
      <div className="p-3 space-y-1.5">
        {/* Name */}
        <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors min-h-[2.5rem]">
          {name}
        </h3>

        {/* Millet type tag */}
        {milletType && (
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${badgeClass}`}>
            {milletType} · Grade {qualityGrade}
          </span>
        )}

        {/* Rating row */}
        <div className="flex items-center gap-1.5">
          <StarDisplay rating={averageRating} />
          <span className="text-xs text-amber-600 font-medium">{averageRating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({reviewCount.toLocaleString()})</span>
        </div>

        {/* Price — Amazon style */}
        <div className="pt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-gray-500">₹</span>
            <span className="text-2xl font-bold text-gray-900">{Math.floor(price)}</span>
            <span className="text-sm text-gray-500">.00</span>
          </div>
          <p className="text-xs text-green-600 font-medium">FREE Delivery</p>
        </div>

        {/* Farmer */}
        {farmerName && (
          <p className="text-xs text-gray-400 truncate">
            by {farmerName}{farmerState ? `, ${farmerState}` : ''}
          </p>
        )}

        {/* Add to cart button — just navigates to product detail */}
        <button
          onClick={e => e.stopPropagation()}
          className="w-full mt-1 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold py-2 rounded-full transition-colors"
        >
          View Details
        </button>
      </div>
    </Link>
  )
}
