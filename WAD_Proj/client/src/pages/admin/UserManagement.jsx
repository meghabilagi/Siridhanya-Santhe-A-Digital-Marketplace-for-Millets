import { useEffect, useState } from 'react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

function RoleBadge({ role }) {
  const colors = {
    admin: 'bg-purple-100 text-purple-700',
    farmer: 'bg-green-100 text-green-700',
    buyer: 'bg-blue-100 text-blue-700',
    consumer: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {role}
    </span>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {status}
    </span>
  )
}

function UserRow({ user, onStatusChange }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function toggleStatus() {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    setLoading(true)
    setError('')
    try {
      await api.put(`/admin/users/${user._id}/status`, { status: newStatus })
      onStatusChange(user._id, newStatus)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-gray-800">{user.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleStatus}
            disabled={loading}
            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              user.status === 'active'
                ? 'border-red-300 text-red-600 hover:bg-red-50'
                : 'border-green-300 text-green-700 hover:bg-green-50'
            }`}
          >
            {loading ? 'Saving…' : user.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </td>
    </tr>
  )
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    api
      .get('/admin/users', { params: { page, limit: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return
        const data = res.data
        setUsers(data.users ?? data.data ?? [])
        setTotalPages(data.totalPages ?? 1)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.message ?? 'Failed to load users.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [page])

  function handleStatusChange(userId, newStatus) {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && users.length === 0 && (
        <div className="text-center py-16 text-gray-500">No users found.</div>
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {users.map((user) => (
                  <UserRow key={user._id} user={user} onStatusChange={handleStatusChange} />
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
    </div>
  )
}
