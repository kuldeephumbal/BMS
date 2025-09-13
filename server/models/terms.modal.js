const mongoose = require("mongoose");

const termSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    term: { type: String, required: true },
    is_delete: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Term", termSchema);