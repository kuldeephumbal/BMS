const mongoose = require('mongoose');
const Product = require('../models/product.modal');
const Billing = require('../models/billing.modal');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/BMS', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function fixProductStocks() {
    console.log('🔄 Starting stock fix script...');

    try {
        // Step 1: Initialize all products with currentStock = openingStock
        console.log('\n📦 Step 1: Initializing currentStock for all products...');
        const initResult = await Product.updateMany(
            { $or: [{ currentStock: { $exists: false } }, { currentStock: null }] },
            [{ $set: { currentStock: "$openingStock" } }]
        );
        console.log(`✅ Initialized currentStock for ${initResult.modifiedCount} products`);

        // Step 2: Get all products and reset their currentStock to openingStock
        console.log('\n🔄 Step 2: Resetting all currentStock to openingStock...');
        const resetResult = await Product.updateMany(
            {},
            [{ $set: { currentStock: "$openingStock" } }]
        );
        console.log(`✅ Reset currentStock for ${resetResult.modifiedCount} products`);

        // Step 3: Apply all billing transactions in chronological order
        console.log('\n📝 Step 3: Applying all billing transactions...');
        const billings = await Billing.find({}).sort({ createdAt: 1 });
        console.log(`Found ${billings.length} billing transactions to process`);

        for (const billing of billings) {
            console.log(`\n--- Processing ${billing.type} #${billing.billNumber} ---`);

            for (const productItem of billing.products) {
                const product = await Product.findById(productItem.id);
                if (!product) {
                    console.warn(`⚠️ Product not found: ${productItem.id}`);
                    continue;
                }

                const oldStock = product.currentStock;
                let newStock;

                if (billing.type === 'sale') {
                    // Sales reduce stock
                    newStock = Math.max(0, product.currentStock - productItem.quantity);
                    console.log(`📉 SALE: ${product.name} - ${oldStock} - ${productItem.quantity} = ${newStock}`);
                } else if (billing.type === 'purchase') {
                    // Purchases increase stock
                    newStock = product.currentStock + productItem.quantity;
                    console.log(`📈 PURCHASE: ${product.name} - ${oldStock} + ${productItem.quantity} = ${newStock}`);
                }

                await Product.findByIdAndUpdate(productItem.id, { currentStock: newStock });
            }
        }

        // Step 4: Show final results
        console.log('\n📊 Step 4: Final stock summary...');
        const products = await Product.find({});
        for (const product of products) {
            console.log(`${product.name}: Opening=${product.openingStock}, Current=${product.currentStock}, Difference=${product.currentStock - product.openingStock}`);
        }

        console.log('\n✅ Stock fix completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fixing stocks:', error);
        process.exit(1);
    }
}

fixProductStocks();
