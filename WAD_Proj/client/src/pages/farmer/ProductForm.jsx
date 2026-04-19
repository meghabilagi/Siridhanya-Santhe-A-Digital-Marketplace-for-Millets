import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'

const QUALITY_GRADES = ['A', 'B', 'C', 'Organic']

const EMPTY_FORM = {
  name: '',
  description: '',
  milletType: '',
  qualityGrade: '',
  price: '',
  quantity: '',
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [imagePreview, setImagePreview] = useState(null)   // base64 or existing URL
  const [imageFile, setImageFile] = useState(null)          // raw File object
  const [loadingProduct, setLoadingProduct] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [verificationStatus, setVerificationStatus] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    api.get(`/products/${id}`)
      .then(res => {
        if (cancelled) return
        const p = res.data.data ?? res.data.product ?? res.data
        setForm({
          name: p.name ?? '',
          description: p.description ?? '',
          milletType: p.milletType ?? '',
          qualityGrade: p.qualityGrade ?? '',
          price: p.price ?? '',
          quantity: p.quantity ?? '',
        })
        if (p.image) setImagePreview(p.image)
        setVerificationStatus(p.verificationStatus ?? null)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.response?.data?.message ?? 'Failed to load product.')
      })
      .finally(() => { if (!cancelled) setLoadingProduct(false) })
    return () => { cancelled = true }
  }, [id, isEdit])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB.')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
    setError('')
  }

  function handleRemoveImage() {
    setImagePreview(null)
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Build FormData so we can send the image file
      const formData = new FormData()
      formData.append('name', form.name.trim())
      formData.append('description', form.description.trim())
      formData.append('milletType', form.milletType.trim())
      formData.append('qualityGrade', form.qualityGrade)
      formData.append('price', Number(form.price))
      formData.append('quantity', Number(form.quantity))
      if (imageFile) {
        formData.append('image', imageFile)
      } else if (imagePreview && imagePreview.startsWith('http')) {
        // Keep existing URL when editing without changing image
        formData.append('imageUrl', imagePreview)
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      let res
      if (isEdit) {
        res = await api.put(`/products/${id}`, formData, config)
      } else {
        res = await api.post('/products', formData, config)
      }

      const saved = res.data.data ?? res.data.product ?? res.data
      setVerificationStatus(saved.verificationStatus ?? 'verified')
      // Redirect to marketplace so farmer can see their product live
      navigate('/products')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save product.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingProduct) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-[#fdf8ee]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-gray-500 text-sm mb-6">Fill in the details below to list your millet product.</p>

        {verificationStatus && verificationStatus !== 'verified' && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm border ${
            verificationStatus === 'rejected' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {verificationStatus === 'verified' && '✅ Your product is live on the marketplace.'}
            {verificationStatus === 'rejected' && '❌ Your product was rejected. Update and resubmit.'}
          </div>
        )}

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">

          {/* ── Product Image Upload ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Product Image
            </label>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-56 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs text-amber-600 hover:underline"
                >
                  Change image
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-amber-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors"
              >
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm font-medium text-gray-700">Click to upload product image</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — max 2MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* ── Product Details ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Product Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input id="name" name="name" type="text" required value={form.name} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
                placeholder="e.g. Organic Foxtail Millet" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                Description
              </label>
              <textarea id="description" name="description" rows={3} value={form.description} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 resize-none"
                placeholder="Describe your product — origin, benefits, how to use..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milletType">
                  Millet Type
                </label>
                <input id="milletType" name="milletType" type="text" value={form.milletType} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
                  placeholder="Foxtail, Pearl, Finger..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="qualityGrade">
                  Quality Grade <span className="text-red-500">*</span>
                </label>
                <select id="qualityGrade" name="qualityGrade" required value={form.qualityGrade} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50">
                  <option value="">Select grade</option>
                  {QUALITY_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price">
                  Price (₹/kg) <span className="text-red-500">*</span>
                </label>
                <input id="price" name="price" type="number" required min="0" step="0.01" value={form.price} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
                  placeholder="e.g. 80" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price2">
                  &nbsp;
                </label>
                <div className="flex gap-1">
                  {[50, 80, 100, 150].map(p => (
                    <button key={p} type="button"
                      onClick={() => setForm(prev => ({ ...prev, price: p }))}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${Number(form.price) === p ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-600 hover:bg-amber-50'}`}>
                      ₹{p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity — full width with quick buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="quantity">
                Available Quantity (kg) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3 mb-2">
                <button type="button"
                  onClick={() => setForm(prev => ({ ...prev, quantity: Math.max(0, Number(prev.quantity) - 10) }))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 flex-shrink-0">
                  −
                </button>
                <input id="quantity" name="quantity" type="number" required min="0" value={form.quantity} onChange={handleChange}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
                  placeholder="0" />
                <button type="button"
                  onClick={() => setForm(prev => ({ ...prev, quantity: Number(prev.quantity) + 10 }))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 flex-shrink-0">
                  +
                </button>
              </div>
              <div className="flex gap-2">
                {[50, 100, 200, 500, 1000].map(q => (
                  <button key={q} type="button"
                    onClick={() => setForm(prev => ({ ...prev, quantity: q }))}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${Number(form.quantity) === q ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-200 text-amber-700 hover:bg-amber-50'}`}>
                    {q} kg
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">How many kg do you have available to sell?</p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
            <button type="button" onClick={() => navigate('/farmer/dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
