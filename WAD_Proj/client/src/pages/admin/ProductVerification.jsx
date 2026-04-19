import { useEffect, useState } from 'react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

function GradeBadge({ grade }) {
  const colors = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-blue-100 text-blue-700',
    C: 'bg-yellow-100 text-yellow-700',
    Organic: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[grade] ?? 'bg-gray-100 text-gray-600'}`}>
      Grade {grade}
    </span>
  )
}

function ProductCard({ product, onVerify }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleVerify(status) {
    setLoading(true)
    setError('')
    try {
      await api.put(`/admin/products/${product._id}/verify`, { status })
      onVerify(product._id)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Action failed.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{product.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {product.milletType} · <GradeBadge grade={product.qualityGrade} />
          </p>
        </div>
        <p className="text-lg font-bold text-green-700">₹{product.price}/kg</p>
      </div>

      <p className="text-sm text-gray-600 mb-1">
        <span className="font-medium">Farmer:</span> {product.farmerName ?? '—'}
      </p>
      {product.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => handleVerify('verified')}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving…' : 'Approve'}
        </button>
        <button
          onClick={() => handleVerify('rejected')}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving…' : 'Reject'}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  )
}

export default function ProductVerification() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    api
      .get('/admin/products/pending')
      .then((res) => {
        if (cancelled) return
        setProducts(res.data.products ?? res.data.data ?? res.data ?? [])
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.message ?? 'Failed to load pending products.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  function handleVerify(productId) {
    setProducts((prev) => prev.filter((p) => p._id !== productId))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Verification</h1>
      <p className="text-gray-500 mb-6">Review and approve or reject pending product listings</p>

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-16 text-gray-500">No pending products</div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="space-y-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} onVerify={handleVerify} />
          ))}
        </div>
      )}
    </div>
  )
}
