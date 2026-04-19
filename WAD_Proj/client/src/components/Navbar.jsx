import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { items } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const cartCount = items?.length ?? 0
  const isConsumerOrBuyer = user?.role === 'consumer' || user?.role === 'buyer'

  function handleLogout() {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white border-b border-amber-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-lg">
            🌾
          </div>
          <div className="leading-tight">
            <div className="font-bold text-gray-900 text-base">Siridhanya Santhe</div>
            <div className="text-xs text-amber-600 font-medium">Connect</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-amber-600' : 'text-gray-600 hover:text-amber-600'}`}>
            Home
          </Link>
          <Link to="/products" className={`text-sm font-medium transition-colors ${isActive('/products') ? 'text-amber-600' : 'text-gray-600 hover:text-amber-600'}`}>
            Marketplace
          </Link>
          <Link to="/contact" className={`text-sm font-medium transition-colors ${isActive('/contact') ? 'text-amber-600' : 'text-gray-600 hover:text-amber-600'}`}>
            Contact
          </Link>
          {user?.role === 'farmer' && (
            <Link to="/farmer/products" className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/farmer') ? 'text-amber-600' : 'text-gray-600 hover:text-amber-600'}`}>
              My Farm
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin/dashboard" className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/admin') ? 'text-amber-600' : 'text-gray-600 hover:text-amber-600'}`}>
              Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {isConsumerOrBuyer && (
                <Link to="/cart" className="relative p-2 text-gray-600 hover:text-amber-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              )}
              <span className="text-sm text-gray-500">Hi, {user?.email?.split('@')[0]}</span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
                Login
              </Link>
              <Link to="/register" className="text-sm font-medium px-4 py-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMenuOpen(p => !p)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-amber-100 px-4 py-4 flex flex-col gap-4">
          <Link to="/" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/products" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>Marketplace</Link>
          <Link to="/contact" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>Contact</Link>
          {user?.role === 'farmer' && <Link to="/farmer/dashboard" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>My Farm</Link>}
          {user?.role === 'admin' && <Link to="/admin/dashboard" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>Admin</Link>}
          {isConsumerOrBuyer && <Link to="/cart" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>Cart ({cartCount})</Link>}
          {isAuthenticated
            ? <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="text-sm font-medium text-red-500 text-left">Logout</button>
            : <>
                <Link to="/login" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="text-sm font-medium px-4 py-2 rounded-full bg-amber-500 text-white text-center" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
          }
        </div>
      )}
    </nav>
  )
}
