import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const ITEM_STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
}

const PAYMENT_STATUS_STYLES = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-700',
}

function StatusBadge({ status, styleMap }) {
  const cls = styleMap[status] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${cls}`}>
      {status}
    </span>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    api.get(`/orders/${id}`)
      .then(res => {
        if (cancelled) return
        setOrder(res.data.data ?? res.data.order ?? res.data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.message ?? 'Failed to load order.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <LoadingSpinner />

  if (error)
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ErrorMessage message={error} />
        <Link to="/orders" className="mt-4 inline-block text-sm text-green-700 hover:underline">
          ← Back to Orders
        </Link>
      </div>
    )

  if (!order) return null

  const {
    orderId,
    createdAt,
    paymentStatus,
    totalAmount,
    deliveryAddress = {},
    transactionId,
    items = [],
  } = order

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <Link to="/orders" className="text-sm text-green-700 hover:underline">
        ← Back to Orders
      </Link>

      {/* Order header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
            <p className="font-semibold text-gray-900">{orderId ?? id}</p>
          </div>
          <StatusBadge status={paymentStatus} styleMap={PAYMENT_STATUS_STYLES} />
        </div>
        <p className="text-sm text-gray-500">{formattedDate}</p>
        <p className="text-xl font-bold text-green-700">₹{totalAmount?.toFixed(2)}</p>
      </div>

      {/* Delivery address */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Delivery Address
        </h2>
        <p className="text-sm text-gray-800">{deliveryAddress.street}</p>
        <p className="text-sm text-gray-800">
          {deliveryAddress.city}, {deliveryAddress.state} — {deliveryAddress.pincode}
        </p>
      </section>

      {/* Payment info */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Payment Info
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Status:</span>
          <StatusBadge status={paymentStatus} styleMap={PAYMENT_STATUS_STYLES} />
        </div>
        {transactionId && (
          <p className="text-sm text-gray-500 mt-1">
            Transaction ID: <span className="font-mono text-gray-700">{transactionId}</span>
          </p>
        )}
      </section>

      {/* Items */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Items ({items.length})
        </h2>

        {items.map((item, idx) => (
          <div
            key={item._id ?? idx}
            className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
          >
            {/* Item header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.quantity} × ₹{item.unitPrice?.toFixed(2)} = ₹{item.lineTotal?.toFixed(2)}
                </p>
              </div>
              <StatusBadge status={item.status} styleMap={ITEM_STATUS_STYLES} />
            </div>

            {/* Traceability */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Farmer Traceability
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                {item.farmerName && (
                  <>
                    <span className="text-gray-400">Name</span>
                    <span>{item.farmerName}</span>
                  </>
                )}
                {item.farmerVillage && (
                  <>
                    <span className="text-gray-400">Village</span>
                    <span>{item.farmerVillage}</span>
                  </>
                )}
                {item.farmerState && (
                  <>
                    <span className="text-gray-400">State</span>
                    <span>{item.farmerState}</span>
                  </>
                )}
                {item.farmerPhone && (
                  <>
                    <span className="text-gray-400">Phone</span>
                    <span>{item.farmerPhone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
