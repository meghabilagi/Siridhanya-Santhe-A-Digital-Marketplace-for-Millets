import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80'

const STATUS_BADGE = {
  verified: 'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-600',
}

function StockModal({ product, onClose, onUpdated }) {
  const [qty, setQty] = useState(product.quantity ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (qty < 0) { setError('Quantity cannot be negative.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await api.put(`/products/${product._id}`, { quantity: Number(qty) })
      onUpdated(res.data.data ?? res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update stock.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-1">Update Stock</h2>
        <p className="text-sm text-gray-500 mb-4">{product.name}</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity (kg)</label>
        <div className="flex items-center gap-3 mb-4">
          <button type="button" onClick={() => setQty(q => Math.max(0, q - 10))}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100">−10</button>
          <input
            type="number" min="0" value={qty}
            onChange={e => setQty(Number(e.target.value))}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <button type="button" onClick={() => setQty(q => q + 10)}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100">+10</button>
        </div>

        <div className="flex gap-2 mb-2">
          {[50, 100, 200, 500].map(n => (
            <button key={n} type="button" onClick={() => setQty(n)}
              className="flex-1 py-1.5 text-xs font-semibold border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors">
              {n} kg
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Update Stock'}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stockModal, setStockModal] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    api.get('/products/farmer/mine')
      .then(res => {
        const d = res.data?.data ?? res.data
        setProducts(d?.products ?? d ?? [])
      })
      .catch(err => setError(err.response?.data?.message ?? 'Failed to load products.'))
      .finally(() => setLoading(false))
  }, [])

  function handleUpdated(updated) {
    setProducts(prev => prev.map(p => p._id === updated._id ? updated : p))
  }

  async function handleDelete(product) {
    if (!window.confirm(`Remove "${product.name}" from your listings? This cannot be undone.`)) return
    setDeletingId(product._id)
    try {
      await api.delete(`/products/${product._id}`)
      setProducts(prev => prev.filter(p => p._id !== product._id))
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to delete product.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-[#fdf8ee]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <Link to="/farmer/products/new"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors">
            + Add Product
          </Link>
        </div>

        {error && <ErrorMessage message={error} />}

        {!loading && products.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="text-5xl mb-3">🌾</div>
            <p className="text-gray-500 mb-4">No products yet.</p>
            <Link to="/farmer/products/new"
              className="inline-block px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors">
              Add Your First Product
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {products.map(product => (
            <div key={product._id} className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-4 items-center">
              <img
                src={product.image || FALLBACK_IMG}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                onError={e => { e.target.src = FALLBACK_IMG }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[product.verificationStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                    {product.verificationStatus}
                  </span>
                </div>
                <p className="text-xs text-amber-600 mt-0.5">{product.milletType} · Grade {product.qualityGrade}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm font-bold text-gray-900">₹{product.price}/kg</span>
                  <span className={`text-xs font-semibold ${product.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.quantity > 0 ? `${product.quantity} kg in stock` : '⚠ Out of stock'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => setStockModal(product)}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-lg transition-colors">
                  📦 Update Stock
                </button>
                <Link to={`/farmer/products/${product._id}/edit`}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors text-center">
                  ✏ Edit
                </Link>
                <button
                  onClick={() => handleDelete(product)}
                  disabled={deletingId === product._id}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                  {deletingId === product._id ? '…' : '🗑 Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {stockModal && (
        <StockModal
          product={stockModal}
          onClose={() => setStockModal(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
