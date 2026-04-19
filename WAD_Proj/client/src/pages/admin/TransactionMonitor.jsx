import { useEffect, useState } from 'react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

function PaymentBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {status}
    </span>
  )
}

function ItemStatusBadge({ status }) {
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

function OrderDetailModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get(`/admin/orders/${orderId}`)
      .then((res) => {
        if (cancelled) return
        setOrder(res.data.order ?? res.data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.message ?? 'Failed to load order details.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [orderId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {loading && <LoadingSpinner />}
          {!loading && error && <ErrorMessage message={error} />}

          {!loading && !error && order && (
            <div className="space-y-5">
              {/* Order meta */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Order ID</p>
                  <p className="font-mono font-medium text-gray-800">{order.orderId ?? order._id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium text-gray-800">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Buyer</p>
                  <p className="font-medium text-gray-800">{order.buyer?.name ?? '—'}</p>
                  <p className="text-gray-500 text-xs">{order.buyer?.email ?? ''}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-bold text-green-700 text-base">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment</p>
                  <PaymentBadge status={order.paymentStatus} />
                </div>
                <div>
                  <p className="text-gray-500">Transaction ID</p>
                  <p className="font-mono text-xs text-gray-700 break-all">{order.transactionId ?? '—'}</p>
                </div>
              </div>

              {/* Delivery address */}
              {order.deliveryAddress && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Delivery Address</p>
                  <p className="text-sm text-gray-600">
                    {[order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={item._id ?? idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-800">{item.productName ?? item.product?.name ?? '—'}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            Qty: {item.quantity} kg · ₹{item.unitPrice}/kg · Total: ₹{item.lineTotal?.toLocaleString('en-IN')}
                          </p>
                          {item.farmerName && (
                            <p className="text-gray-500 text-xs">Farmer: {item.farmerName}</p>
                          )}
                        </div>
                        <ItemStatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TransactionMonitor() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const PAGE_SIZE = 20

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    api
      .get('/admin/orders', { params: { page, limit: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return
        const data = res.data
        setOrders(data.orders ?? data.data ?? [])
        setTotalPages(data.totalPages ?? 1)
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction Monitor</h1>

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 text-gray-500">No orders found.</div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedOrderId(order._id)}
                    className="border-b border-gray-100 hover:bg-green-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{order.orderId ?? order._id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{order.buyer?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
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

      {selectedOrderId && (
        <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      )}
    </div>
  )
}
