const mongoose = require("mongoose");

const products = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    primaryUnit: { type: String, required: true },
    secondaryUnit: { type: String, required: true },
    salePrice: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    taxIncluded: { type: Boolean, default: false },
    openingStock: { type: Number, default: 0 },
    lowStockAlert: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    HSN: { type: String, required: true },
    GST: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Product", products);