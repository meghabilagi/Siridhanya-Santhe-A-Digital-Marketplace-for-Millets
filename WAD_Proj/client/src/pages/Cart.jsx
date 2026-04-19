import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import LoadingSpinner from '../components/LoadingSpinner'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80'

function CartRow({ item, onUpdate, onRemove }) {
  const [updating, setUpdating] = useState(false)
  const productId = item.product?._id ?? item.product
  const name = item.product?.name ?? 'Product'
  const price = item.priceAtAdd ?? item.product?.price ?? 0
  const lineTotal = price * item.quantity
  const imgSrc = item.product?.image || FALLBACK_IMG

  async function change(newQty) {
    if (newQty < 1) return
    setUpdating(true)
    try { await onUpdate(productId, newQty) }
    finally { setUpdating(false) }
  }

  async function remove() {
    setUpdating(true)
    try { await onRemove(productId) }
    finally { setUpdating(false) }
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-4 flex gap-4 items-start ${item.unavailable ? 'opacity-60' : ''}`}>
      <img src={imgSrc} alt={name}
        className="w-20 h-20 object-cover rounded-xl border border-gray-100 flex-shrink-0"
        onError={e => { e.target.src = FALLBACK_IMG }} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{name}</p>
        {item.product?.milletType && (
          <p className="text-xs text-amber-600 mt-0.5">{item.product.milletType} Millet</p>
        )}
        {item.unavailable && (
          <span className="inline-block mt-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Unavailable</span>
        )}
        <p className="text-xs text-gray-400 mt-1">₹{price}/kg</p>

        {/* Qty stepper */}
        <div className="flex items-center gap-2 mt-3">
          <button type="button" onClick={() => change(item.quantity - 1)} disabled={updating || item.quantity <= 1}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors font-bold text-lg">
            −
          </button>
          <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
          <button type="button" onClick={() => change(item.quantity + 1)} disabled={updating}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors font-bold text-lg">
            +
          </button>
          <button type="button" onClick={remove} disabled={updating}
            className="ml-2 text-xs text-red-400 hover:text-red-600 transition-colors">
            Remove
          </button>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-bold text-gray-900 text-base">₹{lineTotal.toFixed(0)}</p>
        <p className="text-xs text-gray-400">{item.quantity} kg</p>
      </div>
    </div>
  )
}

export default function Cart() {
  const { items, grandTotal, loading, fetchCart, updateItem, removeItem } = useCart()
  const navigate = useNavigate()

  useEffect(() => { fetchCart() }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-[#fdf8ee]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🛒 Your Cart
          {items.length > 0 && <span className="ml-2 text-base font-normal text-gray-400">({items.length} item{items.length !== 1 ? 's' : ''})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500 text-lg font-medium mb-2">Your cart is empty</p>
            <p className="text-gray-400 text-sm mb-6">Add some fresh millets to get started</p>
            <Link to="/products"
              className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full transition-colors">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Items list */}
            <div className="md:col-span-2 space-y-3">
              {items.map(item => (
                <CartRow
                  key={item.product?._id ?? item.product}
                  item={item}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Order summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
                <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  {items.filter(i => !i.unavailable).map(item => {
                    const price = item.priceAtAdd ?? item.product?.price ?? 0
                    return (
                      <div key={item.product?._id ?? item.product} className="flex justify-between text-sm text-gray-600">
                        <span className="truncate mr-2">{item.product?.name ?? 'Product'} ×{item.quantity}</span>
                        <span className="flex-shrink-0">₹{(price * item.quantity).toFixed(0)}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t border-gray-100 pt-3 mb-4">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-amber-600 text-lg">₹{grandTotal.toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">FREE Delivery included</p>
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors">
                  Proceed to Checkout →
                </button>
                <Link to="/products" className="block text-center text-sm text-gray-400 hover:text-amber-600 mt-3 transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
