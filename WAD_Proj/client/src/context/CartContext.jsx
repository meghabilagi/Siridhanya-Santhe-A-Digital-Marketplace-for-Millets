import { createContext, useState, useContext } from 'react'
import api from '../api/axios'

export const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  async function fetchCart() {
    setLoading(true)
    try {
      const { data } = await api.get('/cart')
      // API returns { success, data: { items, grandTotal } }
      const cartData = data.data ?? data
      setItems(cartData.items ?? [])
      setGrandTotal(cartData.grandTotal ?? 0)
    } catch {
      // not logged in or not consumer/buyer — reset silently
      setItems([])
      setGrandTotal(0)
    } finally {
      setLoading(false)
    }
  }

  async function addItem(productId, quantity) {
    try {
      await api.post('/cart', { productId, quantity })
      await fetchCart()
    } catch (err) {
      throw err
    }
  }

  async function updateItem(productId, quantity) {
    try {
      await api.put(`/cart/${productId}`, { quantity })
      await fetchCart()
    } catch (err) {
      throw err
    }
  }

  async function removeItem(productId) {
    try {
      await api.put(`/cart/${productId}`, { quantity: 0 })
      await fetchCart()
    } catch (err) {
      throw err
    }
  }

  async function clearCart() {
    try {
      await api.delete('/cart')
      await fetchCart()
    } catch (err) {
      throw err
    }
  }

  return (
    <CartContext.Provider value={{ items, grandTotal, loading, fetchCart, addItem, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
