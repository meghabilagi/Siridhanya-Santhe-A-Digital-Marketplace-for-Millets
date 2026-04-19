import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import ReviewCard from '../components/ReviewCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const FALLBACK_IMAGES = {
  Foxtail:  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
  Pearl:    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
  Finger:   'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80',
  Sorghum:  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  Barnyard: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b4b5?w=600&q=80',
  Little:   'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600&q=80',
  default:  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
}

const GRADE_BADGE = {
  A:       'bg-green-100 text-green-700',
  B:       'bg-blue-100 text-blue-700',
  C:       'bg-gray-100 text-gray-600',
  Organic: 'bg-amber-100 text-amber-700',
}

function Stars({ rating, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0)
  const display = interactive && hovered ? hovered : Math.round(rating)
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n}
          onClick={interactive ? () => onRate(n) : undefined}
          onMouseEnter={interactive ? () => setHovered(n) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          className={`w-5 h-5 ${n <= display ? 'text-amber-400' : 'text-gray-200'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

const REVIEW_LIMIT = 5

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [productLoading, setProductLoading] = useState(true)
  const [productError, setProductError] = useState('')

  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewTotalPages, setReviewTotalPages] = useState(1)

  const [cartQty, setCartQty] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMsg, setCartMsg] = useState('')

  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [reviewError, setReviewError] = useState('')

  const isConsumer = isAuthenticated && (user?.role === 'consumer' || user?.role === 'buyer')

  // Fetch product — handle both { data: product } and { data: { ...product } }
  useEffect(() => {
    setProductLoading(true)
    setProductError('')
    api.get(`/products/${id}`)
      .then(res => {
        const p = res.data?.data ?? res.data?.product ?? res.data
        setProduct(p)
      })
      .catch(err => setProductError(err.response?.data?.message ?? 'Failed to load product.'))
      .finally(() => setProductLoading(false))
  }, [id])

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true)
    try {
      const res = await api.get(`/reviews/${id}`, { params: { page: reviewPage, limit: REVIEW_LIMIT } })
      const d = res.data?.data ?? res.data
      setReviews(d?.reviews ?? d ?? [])
      const pages = d?.pagination?.pages ?? d?.pages ?? (Math.ceil((d?.total ?? 0) / REVIEW_LIMIT) || 1)
      setReviewTotalPages(pages)
    } catch { /* silent */ }
    finally { setReviewsLoading(false) }
  }, [id, reviewPage])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  async function handleAddToCart() {
    setAddingToCart(true)
    setCartMsg('')
    try {
      await addItem(id, cartQty)
      setCartMsg('✅ Added to cart!')
    } catch (err) {
      setCartMsg(err.response?.data?.message ?? 'Could not add to cart.')
    } finally { setAddingToCart(false) }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    if (!reviewRating) { setReviewError('Please select a star rating.'); return }
    setSubmittingReview(true)
    setReviewError('')
    setReviewSuccess('')
    try {
      await api.post(`/reviews/${id}`, { rating: reviewRating, comment: reviewComment })
      setReviewSuccess('Review submitted!')
      setReviewRating(0); setReviewComment(''); setReviewPage(1)
      fetchReviews()
    } catch (err) {
      setReviewError(err.response?.data?.message ?? 'Failed to submit review.')
    } finally { setSubmittingReview(false) }
  }

  if (productLoading) return <LoadingSpinner />
  if (productError) return <div className="max-w-3xl mx-auto px-4 py-8"><ErrorMessage message={productError} /></div>
  if (!product) return null

  const fallbackKey = Object.keys(FALLBACK_IMAGES).find(k => product.milletType?.toLowerCase().includes(k.toLowerCase())) ?? 'default'
  const imgSrc = product.image || FALLBACK_IMAGES[fallbackKey]
  const badgeClass = GRADE_BADGE[product.qualityGrade] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="min-h-screen bg-[#fdf8ee]">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-5 flex items-center gap-2">
          <Link to="/" className="hover:text-amber-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-amber-600">Marketplace</Link>
          <span>/</span>
          <span className="text-gray-700 line-clamp-1">{product.name}</span>
        </nav>

        {/* Main product section */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">

          {/* Left — Image */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <img
              src={imgSrc}
              alt={product.name}
              className="w-full h-96 object-cover"
              onError={e => { e.target.src = FALLBACK_IMAGES.default }}
            />
          </div>

          {/* Right — Details */}
          <div className="space-y-4">
            {/* Name & grade */}
            <div>
              {product.milletType && (
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1">{product.milletType} Millet</p>
              )}
              <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Stars rating={product.averageRating ?? 0} />
              <span className="text-sm font-semibold text-amber-600">{(product.averageRating ?? 0).toFixed(1)}</span>
              <span className="text-sm text-gray-400">({product.reviewCount ?? 0} ratings)</span>
            </div>

            {/* Price */}
            <div className="py-2">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-500">₹</span>
                <span className="text-4xl font-bold text-gray-900">{Math.floor(product.price)}</span>
                <span className="text-lg text-gray-500">.00</span>
              </div>
              <p className="text-sm text-green-600 font-medium mt-0.5">FREE Delivery available</p>
            </div>

            {/* Grade badge */}
            <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${badgeClass}`}>
              Grade {product.qualityGrade}
            </span>

            {/* Stock */}
            <p className={`text-sm font-medium ${product.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.quantity > 0 ? `✅ In Stock — ${product.quantity} kg available` : '❌ Out of Stock'}
            </p>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                {product.description}
              </p>
            )}

            {/* Add to cart — consumer/buyer only */}
            {isConsumer && product.quantity > 0 && (
              <div className="border border-gray-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Qty (kg)</label>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCartQty(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center">
                      −
                    </button>
                    <span className="w-12 text-center font-bold text-gray-900 text-base">{cartQty}</span>
                    <button
                      type="button"
                      onClick={() => setCartQty(prev => Math.min(product.quantity || 999, prev + 1))}
                      className="w-10 h-10 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center">
                      +
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-amber-600">= ₹{(cartQty * (product.price || 0)).toFixed(0)}</span>
                </div>
                <div className="bg-amber-50 rounded-xl px-3 py-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600">{cartQty} kg × ₹{product.price}/kg</span>
                  <span className="font-bold text-amber-700 text-base">₹{(cartQty * product.price).toFixed(0)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 disabled:opacity-50 text-gray-900 font-bold py-3 rounded-xl transition-colors text-sm select-none">
                  {addingToCart ? 'Adding…' : '🛒 Add to Cart'}
                </button>
                {cartMsg && (
                  <p className={`text-sm text-center font-medium ${cartMsg.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                    {cartMsg}
                  </p>
                )}
              </div>
            )}

            {/* Role-based messages */}
            {!isAuthenticated && (
              <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50 text-center">
                <p className="text-sm text-gray-600">
                  <Link to="/login" className="text-amber-600 font-bold hover:underline">Login as Consumer</Link> to add this to your cart
                </p>
              </div>
            )}
            {isAuthenticated && !isConsumer && (
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-center">
                <p className="text-sm text-gray-500">
                  Only consumers and buyers can add products to cart.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Traceability */}
        {(product.farmerName || product.farmerVillage) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <h2 className="text-base font-bold text-amber-900 mb-4">🌱 Farmer Traceability</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[
                { label: 'Farmer', value: product.farmerName },
                { label: 'Village', value: product.farmerVillage },
                { label: 'State', value: product.farmerState },
                { label: 'Phone', value: product.farmerPhone },
              ].filter(f => f.value).map(f => (
                <div key={f.label}>
                  <span className="text-amber-700 text-xs font-semibold uppercase tracking-wide block mb-0.5">{f.label}</span>
                  <span className="font-medium text-gray-800">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Customer Reviews
            {product.reviewCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({product.reviewCount})</span>
            )}
          </h2>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
              <span className="text-5xl font-bold text-gray-900">{(product.averageRating ?? 0).toFixed(1)}</span>
              <div>
                <Stars rating={product.averageRating ?? 0} />
                <p className="text-xs text-gray-400 mt-1">out of 5</p>
              </div>
            </div>
          )}

          {reviewsLoading ? <LoadingSpinner /> : reviews.length === 0 ? (
            <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
              {reviewTotalPages > 1 && (
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={() => setReviewPage(p => Math.max(1, p - 1))} disabled={reviewPage <= 1}
                    className="px-4 py-1.5 rounded-full border border-gray-200 text-sm disabled:opacity-40 hover:border-amber-400 transition-colors">← Prev</button>
                  <span className="text-sm text-gray-500">Page {reviewPage} of {reviewTotalPages}</span>
                  <button onClick={() => setReviewPage(p => Math.min(reviewTotalPages, p + 1))} disabled={reviewPage >= reviewTotalPages}
                    className="px-4 py-1.5 rounded-full border border-gray-200 text-sm disabled:opacity-40 hover:border-amber-400 transition-colors">Next →</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Write review */}
        {isConsumer && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Write a Review</h2>
            <p className="text-xs text-gray-400 mb-4">Only available after receiving a delivered order for this product.</p>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                <Stars rating={reviewRating} interactive onRate={setReviewRating} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3}
                  placeholder="Share your experience..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 resize-none" />
              </div>
              {reviewError && <ErrorMessage message={reviewError} />}
              {reviewSuccess && <p className="text-sm text-green-600 font-medium">{reviewSuccess}</p>}
              <button type="submit" disabled={submittingReview}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">
                {submittingReview ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
