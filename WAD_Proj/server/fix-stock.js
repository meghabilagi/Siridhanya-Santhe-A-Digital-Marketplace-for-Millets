require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const result = await mongoose.connection
      .collection('products')
      .updateMany(
        { quantity: { $lte: 0 } },
        { $set: { quantity: 100 } }
      );
    console.log('✅ Fixed', result.modifiedCount, 'out-of-stock products. Set quantity to 100.');

    // Also show all products and their quantities
    const products = await mongoose.connection.collection('products').find({}).toArray();
    products.forEach(p => console.log(`  - ${p.name}: qty=${p.quantity}, status=${p.verificationStatus}`));

    await mongoose.disconnect();
  })
  .catch(e => { console.error('❌', e.message); process.exit(1); });
