const mongoose = require("mongoose");

// Stock record schema for product inventory movements
// type: 'IN' adds to stock, 'OUT' subtracts from stock
const stockSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    type: { type: String, enum: ['in', 'out'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 }, // unit purchase price for this movement
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true, default: '' }
}, { timestamps: true });

module.exports = mongoose.model("Stock", stockSchema);
