import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Contact from './pages/Contact'

// Consumer/Buyer pages
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'
import OrderDetail from './pages/OrderDetail'

// Farmer pages
import FarmerDashboard from './pages/farmer/FarmerDashboard'
import ProductForm from './pages/farmer/ProductForm'
import IncomingOrders from './pages/farmer/IncomingOrders'
import MyProducts from './pages/farmer/MyProducts'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import ProductVerification from './pages/admin/ProductVerification'
import TransactionMonitor from './pages/admin/TransactionMonitor'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/contact" element={<Contact />} />

        {/* Consumer / Buyer protected routes */}
        <Route element={<ProtectedRoute allowedRoles={['consumer', 'buyer']} />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
        </Route>

        {/* Farmer protected routes */}
        <Route element={<ProtectedRoute allowedRoles={['farmer']} />}>
          <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
          <Route path="/farmer/products" element={<MyProducts />} />
          <Route path="/farmer/products/new" element={<ProductForm />} />
          <Route path="/farmer/products/:id/edit" element={<ProductForm />} />
          <Route path="/farmer/orders" element={<IncomingOrders />} />
        </Route>

        {/* Admin protected routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/products" element={<ProductVerification />} />
          <Route path="/admin/orders" element={<TransactionMonitor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
