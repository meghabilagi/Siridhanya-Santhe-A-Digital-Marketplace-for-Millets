import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function FarmerDashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Farmer Dashboard</h1>
      {user?.name && (
        <p className="text-gray-500 mb-8">Welcome back, {user.name}</p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div className="bg-white border border-green-100 rounded-xl shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">My Products</h2>
          </div>
          <p className="text-sm text-gray-500">
            Manage your millet product listings. New products start as pending and require admin verification before appearing publicly.
          </p>
          <Link
            to="/farmer/products/new"
            className="mt-auto inline-block text-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Add New Product
          </Link>
          <Link
            to="/farmer/products"
            className="inline-block text-center px-4 py-2 border border-green-600 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors"
          >
            View My Products
          </Link>
        </div>

        <div className="bg-white border border-green-100 rounded-xl shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Incoming Orders</h2>
          </div>
          <p className="text-sm text-gray-500">
            View and manage orders placed for your products. Update item statuses as you process and ship them.
          </p>
          <Link
            to="/farmer/orders"
            className="mt-auto inline-block text-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-green-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/farmer/products/new"
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add New Product
          </Link>
          <Link
            to="/farmer/orders"
            className="px-4 py-2 bg-white border border-green-300 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors"
          >
            Manage Orders
          </Link>
        </div>
      </div>
    </div>
  )
}
