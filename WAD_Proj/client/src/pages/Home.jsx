import { Link } from 'react-router-dom'

const MILLET_TYPES = [
  { name: 'Pearl Millet', local: 'Bajra', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&q=80', color: 'border-yellow-200' },
  { name: 'Finger Millet', local: 'Ragi', img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=200&q=80', color: 'border-green-200' },
  { name: 'Foxtail Millet', local: 'Kangni', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80', color: 'border-amber-200' },
  { name: 'Sorghum', local: 'Jowar', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80', color: 'border-orange-200' },
  { name: 'Barnyard Millet', local: 'Sanwa', img: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b4b5?w=200&q=80', color: 'border-lime-200' },
  { name: 'Little Millet', local: 'Kutki', img: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=200&q=80', color: 'border-teal-200' },
]

const FEATURES = [
  { icon: '🌾', title: 'Direct from Farmers', desc: 'Buy directly from verified farmers and SHGs across India' },
  { icon: '✅', title: 'Quality Certified', desc: 'All products verified and graded for quality assurance' },
  { icon: '📍', title: 'Full Traceability', desc: 'Know exactly where your millet comes from — farm to table' },
  { icon: '💰', title: 'Fair Prices', desc: 'No middlemen — farmers earn more, you pay less' },
]

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section
        className="relative min-h-[580px] flex items-center"
        style={{
          background: 'linear-gradient(135deg, #78350f 0%, #b45309 40%, #d97706 100%)',
        }}
      >
        {/* Overlay pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
              <span>🌾</span> India's Millet Marketplace
            </div>
            <h1 className="text-5xl font-extrabold leading-tight">
              Siridhanya<br />
              <span className="text-amber-300">Santhe</span>
            </h1>
            <p className="text-lg text-amber-100 leading-relaxed max-w-md">
              Connecting farmers, self-help groups, and consumers — bringing nutritious millets from farm to your table.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold rounded-full transition-colors shadow-lg"
              >
                Browse Marketplace →
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-full border border-white/40 transition-colors backdrop-blur-sm"
              >
                Join as Farmer
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '500+', label: 'Farmers' },
              { num: '50+', label: 'Millet Varieties' },
              { num: '10K+', label: 'Happy Customers' },
              { num: '100%', label: 'Traceable' },
            ].map(s => (
              <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 text-white text-center border border-white/20">
                <div className="text-3xl font-extrabold text-amber-300">{s.num}</div>
                <div className="text-sm text-amber-100 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Millet Types */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Explore Millet Varieties</h2>
          <p className="text-gray-500 mt-2">Discover the rich diversity of Indian millets</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {MILLET_TYPES.map(m => (
            <Link
              key={m.name}
              to={`/products?milletType=${encodeURIComponent(m.name)}`}
              className={`border-2 ${m.color} rounded-2xl overflow-hidden hover:shadow-md transition-all group bg-white`}
            >
              <div className="h-28 overflow-hidden">
                <img src={m.img} alt={m.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { e.target.style.display='none' }} />
              </div>
              <div className="p-3 text-center">
                <div className="font-semibold text-gray-800 text-sm">{m.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.local}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-amber-50 border-y border-amber-100 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Why Siridhanya Santhe?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 text-center">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Join thousands of farmers and consumers on India's trusted millet marketplace.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/products" className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full transition-colors shadow-md">
            Shop Now
          </Link>
          <Link to="/register" className="px-8 py-3 border-2 border-amber-500 text-amber-600 hover:bg-amber-50 font-bold rounded-full transition-colors">
            Sell Your Millets
          </Link>
        </div>
      </section>

    </div>
  )
}
