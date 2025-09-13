const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String },
    primaryUnit: { type: String, required: true, trim: true },
    secondaryUnit: { type: String, default: "" },
    salePrice: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    taxIncluded: { type: Boolean, default: false },
    openingStock: { type: Number, required: true, min: 0 },
    currentStock: { type: Number, required: true, min: 0 }, // Current stock after transactions
    lowStockAlert: { type: Number, required: true, min: 0 },
    HSN: { type: String, trim: true },
    GST: { type: String, trim: true },
    note: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);