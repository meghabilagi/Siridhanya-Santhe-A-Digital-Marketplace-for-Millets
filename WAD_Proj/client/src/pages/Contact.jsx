export default function Contact() {
  return (
    <div className="min-h-screen bg-[#fdf8ee]">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-6 py-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-500 text-lg">We'd love to hear from you. Reach out anytime.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-12">

        {/* Contact form */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h2>
          <form className="space-y-5" onSubmit={e => { e.preventDefault(); alert('Message sent! We will get back to you soon.') }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input type="text" required placeholder="Ravi Kumar"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" required placeholder="ravi@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50">
                <option>General Inquiry</option>
                <option>Farmer Registration</option>
                <option>Order Support</option>
                <option>Partnership</option>
                <option>Report an Issue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea required rows={4} placeholder="Write your message here..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 resize-none" />
            </div>
            <button type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors">
              Send Message
            </button>
          </form>
        </div>

        {/* Contact info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Get in Touch</h2>
            <div className="space-y-4">
              {[
                { icon: '📍', label: 'Address', value: 'Siridhanya Santhe HQ\n12, Millet Nagar, Dharwad\nKarnataka – 580001, India' },
                { icon: '📞', label: 'Phone', value: '+91 98765 43210\n+91 80123 45678' },
                { icon: '📧', label: 'Email', value: 'support@siridhanyasanthe.in\nfarmers@siridhanyasanthe.in' },
                { icon: '🕐', label: 'Working Hours', value: 'Mon – Sat: 9:00 AM – 6:00 PM\nSunday: Closed' },
              ].map(item => (
                <div key={item.label} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-0.5">{item.label}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social links */}
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Follow Us</h3>
            <div className="flex gap-3">
              {[
                { name: 'Facebook', color: 'bg-blue-100 text-blue-700', icon: 'f' },
                { name: 'Instagram', color: 'bg-pink-100 text-pink-700', icon: '📸' },
                { name: 'Twitter', color: 'bg-sky-100 text-sky-700', icon: '𝕏' },
                { name: 'WhatsApp', color: 'bg-green-100 text-green-700', icon: '💬' },
              ].map(s => (
                <button key={s.name}
                  className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity`}
                  title={s.name}>
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl h-40 flex items-center justify-center text-amber-400">
            <div className="text-center">
              <div className="text-3xl mb-1">🗺️</div>
              <p className="text-sm font-medium">Dharwad, Karnataka</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ strip */}
      <div className="bg-amber-50 border-t border-amber-100 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How do I register as a farmer?', a: 'Click Register on the top right, select "Farmer" as your role, and fill in your details. Your products will be reviewed by our admin team before going live.' },
              { q: 'How long does delivery take?', a: 'Delivery typically takes 3–7 business days depending on your location. Farmers update the order status as they process and ship.' },
              { q: 'Are the products certified organic?', a: 'Products marked "Organic" have been verified by our admin team. Look for the green Organic badge on product cards.' },
              { q: 'How do I track my order?', a: 'After placing an order, go to My Orders in your account. The farmer will update the status from Processing → Shipped → Delivered.' },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-amber-100">
                <p className="font-semibold text-gray-900 mb-1">❓ {faq.q}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
