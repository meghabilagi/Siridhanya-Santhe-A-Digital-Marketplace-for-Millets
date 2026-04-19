import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import OrderCard from '../components/OrderCard'

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    api
      .get('/orders', { params: { page, limit: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return
        const data = res.data
        // API returns { success, data: { orders, total, page, pages } }
        const d = data.data ?? data
        setOrders(d.orders ?? d ?? [])
        setTotalPages(d.pages ?? d.totalPages ?? (Math.ceil((d.total ?? 0) / PAGE_SIZE) || 1))
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.message ?? 'Failed to load orders.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {loading && <LoadingSpinner />}

      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-gray-500 text-lg">No orders yet. Start shopping!</p>
          <Link
            to="/products"
            className="inline-block mt-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Browse Products
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
