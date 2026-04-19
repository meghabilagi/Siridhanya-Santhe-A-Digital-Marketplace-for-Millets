/**
 * CartItem — displays a single cart line item with quantity controls.
 *
 * Props:
 *   item: {
 *     product: { _id, name },
 *     quantity: number,
 *     priceAtAdd: number,
 *     lineTotal: number,
 *     unavailable?: boolean
 *   }
 *   onUpdate(productId, qty): called when quantity changes
 *   onRemove(productId): called when item is removed
 */
export default function CartItem({ item, onUpdate, onRemove }) {
  const productId = item.product?._id ?? item.product
  const name = item.product?.name ?? 'Product'
  const lineTotal = item.lineTotal ?? item.priceAtAdd * item.quantity
  const unavailable = item.unavailable ?? false

  function decrement() {
    if (item.quantity <= 1) {
      onRemove(productId)
    } else {
      onUpdate(productId, item.quantity - 1)
    }
  }

  function increment() {
    onUpdate(productId, item.quantity + 1)
  }

  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-2 ${unavailable ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
      {unavailable && (
        <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded px-3 py-1.5">
          <span>⚠️</span>
          <span>Item unavailable — removed from total</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className={`font-medium text-gray-900 flex-1 ${unavailable ? 'line-through text-gray-400' : ''}`}>
          {name}
        </span>

        {/* Quantity stepper */}
        <div className="flex items-center gap-2">
          <button
            onClick={decrement}
            disabled={unavailable}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center font-medium text-gray-800">{item.quantity}</span>
          <button
            onClick={increment}
            disabled={unavailable}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Line total */}
        <span className={`font-semibold text-green-700 w-20 text-right ${unavailable ? 'opacity-40' : ''}`}>
          ₹{lineTotal?.toFixed(2) ?? '—'}
        </span>

        {/* Remove */}
        <button
          onClick={() => onRemove(productId)}
          className="text-red-400 hover:text-red-600 transition-colors text-sm"
          aria-label="Remove item"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
