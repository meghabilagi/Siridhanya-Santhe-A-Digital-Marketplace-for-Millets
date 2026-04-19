import { Link } from 'react-router-dom'

const PAYMENT_BADGE = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-700',
}

/**
 * OrderCard — summary card for an order, links to order detail.
 *
 * Props:
 *   order: {
 *     _id, orderId, createdAt, totalAmount,
 *     paymentStatus, items: []
 *   }
 */
export default function OrderCard({ order }) {
  const {
    _id,
    orderId,
    createdAt,
    totalAmount,
    paymentStatus,
    items = [],
  } = order

  const badgeClass = PAYMENT_BADGE[paymentStatus] ?? 'bg-gray-100 text-gray-700'
  const date = createdAt ? new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '—'

  return (
    <Link
      to={`/orders/${_id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold text-gray-900 text-sm">{orderId ?? _id}</p>
          <p className="text-xs text-gray-500">{date}</p>
          <p className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="text-right space-y-1">
          <p className="font-bold text-green-700 text-lg">₹{totalAmount?.toFixed(2)}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${badgeClass}`}>
            {paymentStatus}
          </span>
        </div>
      </div>
    </Link>
  )
}
