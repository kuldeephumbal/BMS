const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    amount: { type: Number, required: true },
    note: { type: String, required: true },
    month: { type: String, required: true },
});

module.exports = mongoose.model("Budget", budgetSchema);
