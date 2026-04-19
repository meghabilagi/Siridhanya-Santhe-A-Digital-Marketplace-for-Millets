require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const result = await mongoose.connection
      .collection('products')
      .updateMany(
        { verificationStatus: 'pending', isDeleted: false },
        { $set: { verificationStatus: 'verified' } }
      );
    console.log('✅ Approved', result.modifiedCount, 'pending products.');

    const all = await mongoose.connection.collection('products')
      .find({ isDeleted: false }, { projection: { name: 1, verificationStatus: 1, quantity: 1 } })
      .toArray();
    console.log('\nAll products:');
    all.forEach(p => console.log(`  ✓ ${p.name} — ${p.verificationStatus} — qty: ${p.quantity}`));

    await mongoose.disconnect();
  })
  .catch(e => { console.error('❌', e.message); process.exit(1); });
