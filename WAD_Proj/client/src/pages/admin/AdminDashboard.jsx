import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

function StatCard({ label, value, color = 'green' }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  return (
    <div className={`border rounded-xl p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    api
      .get('/admin/orders/summary')
      .then((res) => {
        if (cancelled) return
        setSummary(res.data.summary ?? res.data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.message ?? 'Failed to load summary.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Platform overview and management links</p>

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Total Orders" value={summary.totalOrders} color="blue" />
            <StatCard label="Total Revenue (₹)" value={summary.totalRevenue != null ? `₹${summary.totalRevenue.toLocaleString('en-IN')}` : '—'} color="green" />
            <StatCard label="Pending" value={summary.byStatus?.pending ?? 0} color="yellow" />
            <StatCard label="Processing" value={summary.byStatus?.processing ?? 0} color="blue" />
            <StatCard label="Shipped" value={summary.byStatus?.shipped ?? 0} color="purple" />
            <StatCard label="Delivered" value={summary.byStatus?.delivered ?? 0} color="green" />
          </div>
        </>
      )}

      {/* Navigation links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-green-400 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500 mt-1">Activate or deactivate user accounts</p>
        </Link>

        <Link
          to="/admin/products"
          className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-green-400 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-800">Product Verification</h2>
          <p className="text-sm text-gray-500 mt-1">Approve or reject pending product listings</p>
        </Link>

        <Link
          to="/admin/orders"
          className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-green-400 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-800">Transaction Monitor</h2>
          <p className="text-sm text-gray-500 mt-1">View all orders and payment details</p>
        </Link>
      </div>
    </div>
  )
}
