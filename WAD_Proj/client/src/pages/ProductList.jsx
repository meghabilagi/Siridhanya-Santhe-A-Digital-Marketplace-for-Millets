import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const CATEGORIES = ['All', 'Raw Millets', 'Processed', 'Ready to Cook', 'Ready to Eat']
const QUALITY_GRADES = ['', 'A', 'B', 'C', 'Organic']
const PAGE_LIMIT = 20

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [activeCategory, setActiveCategory] = useState('All')

  const [keyword, setKeyword] = useState('')
  const [milletType, setMilletType] = useState('')
  const [qualityGrade, setQualityGrade] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const debounceRef = useRef(null)
  const [debouncedKeyword, setDebouncedKeyword] = useState('')

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword)
      setPage(1)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [keyword])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: PAGE_LIMIT }
      if (debouncedKeyword) params.keyword = debouncedKeyword
      if (milletType) params.milletType = milletType
      if (qualityGrade) params.qualityGrade = qualityGrade
      if (minPrice !== '') params.minPrice = minPrice
      if (maxPrice !== '') params.maxPrice = maxPrice

      const { data } = await api.get('/products', { params })
      const list = data.data?.products ?? data.products ?? []
      setProducts(list)
      const t = data.data?.total ?? data.total ?? 0
      setTotal(t)
      setTotalPages(Math.ceil(t / PAGE_LIMIT) || 1)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, milletType, qualityGrade, minPrice, maxPrice, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function handleReset() {
    setKeyword(''); setMilletType(''); setQualityGrade('')
    setMinPrice(''); setMaxPrice(''); setPage(1); setActiveCategory('All')
  }

  return (
    <div className="min-h-screen bg-[#fdf8ee]">
      {/* Page header */}
      <div className="bg-white border-b border-amber-100 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-gray-900">Marketplace</h1>
            <span className="text-3xl">🌾</span>
          </div>
          <p className="text-gray-500">Browse fresh millets directly from farmers across India</p>

          {/* Search bar */}
          <div className="mt-5 relative max-w-2xl">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search millets, farmers, locations..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setPage(1) }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600'
                }`}
              >
                {cat}
              </button>
            ))}

            <div className="ml-auto">
              <select
                value={qualityGrade}
                onChange={e => { setQualityGrade(e.target.value); setPage(1) }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Most Popular</option>
                {QUALITY_GRADES.filter(Boolean).map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Advanced filters row */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Millet type..."
            value={milletType}
            onChange={e => { setMilletType(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 w-36"
          />
          <input
            type="number"
            placeholder="Min ₹"
            value={minPrice}
            min={0}
            onChange={e => { setMinPrice(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 w-24"
          />
          <input
            type="number"
            placeholder="Max ₹"
            value={maxPrice}
            min={0}
            onChange={e => { setMaxPrice(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 w-24"
          />
          {(keyword || milletType || qualityGrade || minPrice || maxPrice) && (
            <button onClick={handleReset} className="text-sm text-amber-600 hover:text-amber-800 underline">
              Clear filters
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && !error && (
          <p className="text-sm text-gray-500 mb-5">
            {total > 0 ? `${total} product${total !== 1 ? 's' : ''} found` : ''}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🌾</div>
            <p className="text-gray-500 text-lg">No products found.</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or check back later.</p>
            {(keyword || milletType || qualityGrade) && (
              <button onClick={handleReset} className="mt-4 text-amber-600 underline text-sm">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-5 py-2 rounded-full border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-amber-400 hover:text-amber-600 transition-colors bg-white"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-5 py-2 rounded-full border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-amber-400 hover:text-amber-600 transition-colors bg-white"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
