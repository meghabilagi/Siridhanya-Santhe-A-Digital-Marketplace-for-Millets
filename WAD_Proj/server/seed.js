/**
 * Seed script — inserts sample millet products with real images.
 * Run from the server folder: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/siridhanya-santhe';

const FARMERS = [
  { name: 'Ravi Kumar', email: 'ravi.farmer@seed.com', village: 'Dharwad', state: 'Karnataka', phone: '9876543210' },
  { name: 'Lakshmi Devi', email: 'lakshmi.farmer@seed.com', village: 'Anantapur', state: 'Andhra Pradesh', phone: '9845123456' },
  { name: 'Suresh Patil', email: 'suresh.farmer@seed.com', village: 'Solapur', state: 'Maharashtra', phone: '9765432109' },
];

const PRODUCTS = [
  {
    name: 'Organic Foxtail Millet (Kangni)',
    description: 'Premium organic foxtail millet sourced directly from Karnataka farms. Rich in iron, calcium and dietary fibre. Ideal for porridge, upma and khichdi. Naturally gluten-free and low glycemic index.',
    price: 89,
    quantity: 500,
    milletType: 'Foxtail',
    qualityGrade: 'Organic',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=85',
    farmerIndex: 0,
    averageRating: 4.5,
    reviewCount: 128,
  },
  {
    name: 'Pearl Millet Flour (Bajra Atta)',
    description: 'Stone-ground pearl millet flour from Rajasthan. High in protein and minerals. Perfect for rotis, bhakri and traditional Indian breads. No preservatives, 100% natural.',
    price: 65,
    quantity: 800,
    milletType: 'Pearl',
    qualityGrade: 'A',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=85',
    farmerIndex: 1,
    averageRating: 4.3,
    reviewCount: 95,
  },
  {
    name: 'Finger Millet (Ragi) Whole Grain',
    description: 'Whole grain finger millet (ragi) from Andhra Pradesh. Exceptionally high in calcium — ideal for growing children and elderly. Use for ragi mudde, dosa, idli and health drinks.',
    price: 72,
    quantity: 600,
    milletType: 'Finger',
    qualityGrade: 'Organic',
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=85',
    farmerIndex: 1,
    averageRating: 4.7,
    reviewCount: 214,
  },
  {
    name: 'Sorghum (Jowar) White Grain',
    description: 'Premium white sorghum grain from Maharashtra. Versatile grain for rotis, porridge and popped snacks. High in antioxidants and fibre. Suitable for diabetics.',
    price: 55,
    quantity: 1000,
    milletType: 'Sorghum',
    qualityGrade: 'A',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85',
    farmerIndex: 2,
    averageRating: 4.1,
    reviewCount: 67,
  },
  {
    name: 'Barnyard Millet (Sanwa) — Fasting Grain',
    description: 'Pure barnyard millet, widely used during fasting (vrat). Light on digestion, rich in fibre and minerals. Grown without pesticides in the Himalayan foothills.',
    price: 110,
    quantity: 300,
    milletType: 'Barnyard',
    qualityGrade: 'Organic',
    image: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b4b5?w=600&q=85',
    farmerIndex: 0,
    averageRating: 4.6,
    reviewCount: 83,
  },
  {
    name: 'Little Millet (Kutki) Whole Grain',
    description: 'Tiny but mighty little millet from Madhya Pradesh. Excellent source of B-vitamins and minerals. Cook like rice or use in khichdi, pongal and pulao.',
    price: 95,
    quantity: 400,
    milletType: 'Little',
    qualityGrade: 'A',
    image: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600&q=85',
    farmerIndex: 2,
    averageRating: 4.2,
    reviewCount: 41,
  },
  {
    name: 'Kodo Millet (Varagu) Grain',
    description: 'Traditional kodo millet from Tamil Nadu. Known for its blood sugar regulating properties. Nutty flavour, great for rice substitutes, idli and dosa batter.',
    price: 98,
    quantity: 350,
    milletType: 'Kodo',
    qualityGrade: 'B',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=85',
    farmerIndex: 1,
    averageRating: 4.0,
    reviewCount: 29,
  },
  {
    name: 'Mixed Millet Pack — 5 Varieties',
    description: 'Sampler pack containing 5 millet varieties: Foxtail, Pearl, Finger, Sorghum and Barnyard (200g each). Perfect for trying different millets. All organically grown.',
    price: 299,
    quantity: 200,
    milletType: 'Mixed',
    qualityGrade: 'Organic',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=85',
    farmerIndex: 0,
    averageRating: 4.8,
    reviewCount: 312,
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create or find farmers
  const farmerDocs = [];
  for (const f of FARMERS) {
    let farmer = await User.findOne({ email: f.email });
    if (!farmer) {
      farmer = await User.create({
        name: f.name,
        email: f.email,
        password: hashedPassword,
        role: 'farmer',
        village: f.village,
        state: f.state,
        phone: f.phone,
        status: 'active',
      });
      console.log(`👨‍🌾 Created farmer: ${f.name}`);
    } else {
      console.log(`👨‍🌾 Farmer already exists: ${f.name}`);
    }
    farmerDocs.push(farmer);
  }

  // Create products
  let created = 0;
  for (const p of PRODUCTS) {
    const farmer = farmerDocs[p.farmerIndex];
    const exists = await Product.findOne({ name: p.name });
    if (!exists) {
      await Product.create({
        name: p.name,
        description: p.description,
        price: p.price,
        quantity: p.quantity,
        milletType: p.milletType,
        qualityGrade: p.qualityGrade,
        image: p.image,
        farmer: farmer._id,
        farmerName: farmer.name,
        farmerVillage: farmer.village,
        farmerState: farmer.state,
        farmerPhone: farmer.phone,
        verificationStatus: 'verified',
        averageRating: p.averageRating,
        reviewCount: p.reviewCount,
        isDeleted: false,
      });
      created++;
      console.log(`🌾 Created product: ${p.name}`);
    } else {
      console.log(`⏭️  Product already exists: ${p.name}`);
    }
  }

  console.log(`\n✅ Seed complete! ${created} new products added.`);
  console.log('👉 Go to http://localhost:5173/products to see them.\n');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
