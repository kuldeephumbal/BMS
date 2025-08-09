const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  amount: { type: Number, required: true },
  note: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;