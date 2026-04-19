import { useEffect, useState } from 'react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

const ITEM_STATUSES = ['processing', 'shipped', 'delivered']

function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-gray-100 text-gray-600',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-yellow-100 text-yellow-700',
    delivered: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function OrderRow({ order, onStatusChange }) {
  const [itemFeedback, setItemFeedback] = useState({})

  async function handleStatusChange(itemId, newStatus) {
    setItemFeedback((prev) => ({ ...prev, [itemId]: { loading: true, error: '', success: '' } }))
    try {
      await api.put(`/orders/${order._id}/items/${itemId}/status`, { status: newStatus })
      setItemFeedback((prev) => ({
        ...prev,
        [itemId]: { loading: false, error: '', success: 'Status updated.' },
      }))
      onStatusChange(order._id, itemId, newStatus)
    } catch (err) {
      setItemFeedback((prev) => ({
        ...prev,
        [itemId]: {
          loading: false,
          error: err.response?.data?.message ?? 'Failed to update status.',
          success: '',
        },
      }))
    }
  }

  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Order: <span className="font-mono">{order.orderId ?? order._id}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{date}</p>
        </div>
        {order.buyer && (
          <div className="text-right text-xs text-gray-500">
            <p className="font-medium text-gray-700">{order.buyer.name ?? '—'}</p>
            <p>{order.buyer.email ?? ''}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {order.items?.map((item) => {
          const fb = itemFeedback[item._id] ?? {}
          return (
            <div key={item._id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.productName ?? item.product?.name ?? '—'}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} kg · ₹{item.unitPrice}/kg</p>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={item.status}
                  disabled={fb.loading}
                  onChange={(e) => handleStatusChange(item._id, e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  aria-label={`Update status for ${item.productName}`}
                >
                  {ITEM_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                {fb.loading && <span className="text-xs text-gray-400">Saving…</span>}
                {fb.success && <span className="text-xs text-green-600">{fb.success}</span>}
                {fb.error && <span className="text-xs text-red-600">{fb.error}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function IncomingOrders() {
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
      .get('/orders/farmer/incoming', { params: { page, limit: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return
        const d = res.data?.data ?? res.data
        setOrders(d?.orders ?? [])
        setTotalPages(d?.pages ?? d?.totalPages ?? 1)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.message ?? 'Failed to load orders.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [page])

  function handleStatusChange(orderId, itemId, newStatus) {
    setOrders((prev) =>
      prev.map((order) => {
        if (order._id !== orderId) return order
        return {
          ...order,
          items: order.items.map((item) =>
            item._id === itemId ? { ...item, status: newStatus } : item
          ),
        }
      })
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Incoming Orders</h1>

      {loading && <LoadingSpinner />}

      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          No incoming orders yet.
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderRow key={order._id} order={order} onStatusChange={handleStatusChange} />
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
