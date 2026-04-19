import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import api from '../api/axios'

function QRCode({ value }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}`
  return <img src={url} alt="UPI QR" className="rounded-2xl border-4 border-white shadow-lg w-48 h-48" />
}

const UPI_APPS = [
  { id: 'gpay',    name: 'Google Pay', bg: 'bg-white',      border: 'border-gray-200',   emoji: '🟢', scheme: (pa,pn,am,tn) => `tez://upi/pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}` },
  { id: 'phonepe', name: 'PhonePe',    bg: 'bg-purple-50',  border: 'border-purple-200', emoji: '💜', scheme: (pa,pn,am,tn) => `phonepe://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}` },
  { id: 'paytm',   name: 'Paytm',      bg: 'bg-sky-50',     border: 'border-sky-200',    emoji: '🔵', scheme: (pa,pn,am,tn) => `paytmmp://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}` },
  { id: 'bhim',    name: 'BHIM UPI',   bg: 'bg-orange-50',  border: 'border-orange-200', emoji: '🟠', scheme: (pa,pn,am,tn) => `bhim://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}` },
  { id: 'amazon',  name: 'Amazon Pay', bg: 'bg-yellow-50',  border: 'border-yellow-200', emoji: '🟡', scheme: (pa,pn,am,tn) => `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}` },
  { id: 'other',   name: 'Other UPI',  bg: 'bg-gray-50',    border: 'border-gray-200',   emoji: '📱', scheme: (pa,pn,am,tn) => `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}` },
]

export default function Checkout() {
  const { items, grandTotal } = useCart()
  const navigate = useNavigate()

  const [step, setStep] = useState('address')
  const [form, setForm] = useState({ street: '', city: '', state: '', pincode: '' })
  const [payMethod, setPayMethod] = useState('upi_app')
  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [upiConfig, setUpiConfig] = useState({ upiId: '', upiName: 'Siridhanya Santhe', maskedUpiId: '***@upi' })

  useEffect(() => {
    api.get('/payment/config')
      .then(res => setUpiConfig(res.data.data ?? res.data))
      .catch(() => {})
  }, [])

  const amount = grandTotal.toFixed(2)
  const txnNote = encodeURIComponent(`Siridhanya Santhe - ${items.length} item(s)`)
  const pa = encodeURIComponent(upiConfig.upiId)
  const pn = encodeURIComponent(upiConfig.upiName)
  const upiString = `upi://pay?pa=${pa}&pn=${pn}&am=${amount}&cu=INR&tn=${txnNote}`

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleAddressSubmit(e) {
    e.preventDefault()
    setStep('payment')
    window.scrollTo(0, 0)
  }

  // Open UPI app and auto-place order simultaneously
  async function handleUpiAppPay(app) {
    const link = app.scheme(pa, pn, amount, txnNote)
    // Open UPI app in new tab without leaving page
    const a = document.createElement('a')
    a.href = link
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // Auto-place order immediately — user tapped the app so they intend to pay
    await placeOrder()
  }

  async function placeOrder() {
    if (placing) return
    setPlacing(true)
    setError('')
    setStep('processing')
    try {
      const { data } = await api.post('/orders/checkout', { deliveryAddress: form })
      const order = data.data ?? data.order ?? data
      navigate(`/orders/${order._id}`)
    } catch (err) {
      const status = err.response?.status
      if (status === 402) setError('Payment failed. Please try again.')
      else if (status === 400) setError(err.response?.data?.message ?? 'Order could not be placed.')
      else setError(err.response?.data?.message ?? 'Something went wrong.')
      setStep('payment')
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fdf8ee] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link to="/products" className="text-amber-600 font-bold hover:underline">Browse products</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdf8ee]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        {/* Processing overlay */}
        {step === 'processing' && (
          <div className="fixed inset-0 z-50 bg-white/90 flex flex-col items-center justify-center gap-4">
            <svg className="animate-spin w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-lg font-bold text-gray-800">Placing your order…</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">

            {/* STEP 1: Address */}
            {step === 'address' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-5">📍 Delivery Address</h2>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  {[
                    { id: 'street', label: 'Street / House No.', placeholder: '123, MG Road' },
                    { id: 'city',   label: 'City',               placeholder: 'Bengaluru' },
                    { id: 'state',  label: 'State',              placeholder: 'Karnataka' },
                  ].map(f => (
                    <div key={f.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{f.label} *</label>
                      <input name={f.id} type="text" required value={form[f.id]} onChange={handleChange}
                        placeholder={f.placeholder}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input name="pincode" type="text" required pattern="\d{6}" maxLength={6}
                      value={form.pincode} onChange={handleChange} placeholder="560001"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
                  <button type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors">
                    Continue to Payment →
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 'payment' && (
              <div className="space-y-4">
                {/* Amount banner */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white text-center">
                  <p className="text-sm font-medium opacity-80">Total Amount</p>
                  <p className="text-5xl font-extrabold mt-1">₹{amount}</p>
                </div>

                {/* Payment tabs */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-4 border-b border-gray-100">
                    {[
                      { id: 'upi_app', label: '📱 UPI Apps' },
                      { id: 'qr',      label: '📷 QR Code' },
                      { id: 'upi_id',  label: '🔢 UPI ID' },
                      { id: 'cod',     label: '💵 COD' },
                    ].map(tab => (
                      <button key={tab.id} type="button" onClick={() => setPayMethod(tab.id)}
                        className={`py-3 text-xs font-semibold transition-colors ${payMethod === tab.id ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-700'}`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">

                    {/* UPI Apps */}
                    {payMethod === 'upi_app' && (
                      <div>
                        <p className="text-sm text-gray-500 mb-4">Tap an app — it will open for payment and your order will be placed automatically.</p>
                        <div className="grid grid-cols-2 gap-3">
                          {UPI_APPS.map(app => (
                            <button key={app.id} type="button" onClick={() => handleUpiAppPay(app)}
                              className={`flex items-center gap-3 border-2 ${app.bg} ${app.border} rounded-xl px-4 py-3 hover:shadow-md active:scale-95 transition-all text-left`}>
                              <span className="text-2xl">{app.emoji}</span>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{app.name}</p>
                                <p className="text-xs text-gray-400">Tap to pay & order</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QR Code */}
                    {payMethod === 'qr' && (
                      <div className="flex flex-col items-center gap-4">
                        <QRCode value={upiString} />
                        <p className="text-sm font-semibold text-gray-800">Scan with any UPI app</p>
                        <p className="text-xs text-gray-400">GPay · PhonePe · Paytm · BHIM</p>
                        <button type="button" onClick={placeOrder} disabled={placing}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                          {placing ? 'Placing order…' : '✅ Paid — Place Order'}
                        </button>
                      </div>
                    )}

                    {/* UPI ID */}
                    {payMethod === 'upi_id' && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">Pay to UPI ID</p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold font-mono text-gray-900 flex-1">{upiConfig.maskedUpiId}</p>
                            <button type="button" onClick={() => navigator.clipboard.writeText(upiConfig.upiId)}
                              className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-200">
                              Copy
                            </button>
                          </div>
                        </div>
                        <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
                          <li>Open any UPI app</li>
                          <li>Tap Copy above and paste the UPI ID</li>
                          <li>Enter amount: <strong>₹{amount}</strong> and pay</li>
                          <li>Come back and click below</li>
                        </ol>
                        <button type="button" onClick={placeOrder} disabled={placing}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                          {placing ? 'Placing order…' : '✅ Paid — Place Order'}
                        </button>
                      </div>
                    )}

                    {/* Cash on Delivery */}
                    {payMethod === 'cod' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl p-4">
                          <span className="text-4xl">💵</span>
                          <div>
                            <p className="font-bold text-green-800">Cash on Delivery</p>
                            <p className="text-sm text-green-700 mt-0.5">Pay <strong>₹{amount}</strong> when your order arrives</p>
                          </div>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li className="flex items-center gap-2"><span className="text-green-500">✓</span> No advance payment needed</li>
                          <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Pay cash at the time of delivery</li>
                          <li className="flex items-center gap-2"><span className="text-amber-500">⚠</span> Keep exact change ready</li>
                        </ul>
                        <button type="button" onClick={placeOrder} disabled={placing}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                          {placing
                            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Placing…</>
                            : '📦 Place Order (Pay on Delivery)'}
                        </button>
                      </div>
                    )}

                  </div>
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
                <button type="button" onClick={() => setStep('address')} className="text-sm text-gray-400 hover:text-amber-600">← Change address</button>
              </div>
            )}

            {/* STEP 3: Confirm after UPI app */}
            {step === 'confirm_payment' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-5">
                <div className="text-5xl">📱</div>
                <h2 className="font-bold text-gray-900 text-xl">Complete Payment in UPI App</h2>
                <p className="text-gray-500 text-sm">
                  Your UPI app should have opened. Pay <strong className="text-amber-600">₹{amount}</strong> there, then come back and click below.
                </p>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
                <button type="button" onClick={placeOrder} disabled={placing}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {placing
                    ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Placing…</>
                    : '✅ Payment Done — Place Order'}
                </button>
                <button type="button" onClick={() => setStep('payment')} className="text-sm text-gray-400 hover:text-amber-600">← Back to payment options</button>
              </div>
            )}

          </div>

          {/* Order summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {items.map(item => {
                  const price = item.priceAtAdd ?? item.product?.price ?? 0
                  const name = item.product?.name ?? 'Product'
                  return (
                    <div key={item.product?._id ?? item.product} className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-lg flex-shrink-0">🌾</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{name}</p>
                        <p className="text-xs text-gray-400">{item.quantity} kg × ₹{price}/kg</p>
                      </div>
                      <span className="text-xs font-semibold">₹{(price * item.quantity).toFixed(0)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₹{grandTotal.toFixed(0)}</span></div>
                <div className="flex justify-between text-sm text-green-600 font-medium"><span>Delivery</span><span>FREE</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                  <span>Total</span><span className="text-amber-600">₹{grandTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
