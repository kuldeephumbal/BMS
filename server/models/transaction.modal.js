const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    partyId: { type: mongoose.Schema.Types.ObjectId, ref: "Parties", required: true },
    type: { type: String, enum: ["gave", "got"], required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "online", "cheque", "other"], required: true },
    notes: { type: String },
    date: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
