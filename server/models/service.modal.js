const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    includeTax: { type: Boolean, default: false },
    SACCode: { type: String, required: true },
    GST: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Service", serviceSchema);