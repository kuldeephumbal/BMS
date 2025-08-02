const mongoose = require('mongoose');

const partiesSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    type: { type: String, enum: ["customer", "supplier"], required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    address: { type: String },
    gst_number: { type: String },
    state: { type: String },
    city: { type: String },
    pin_code: { type: String },
    notes: { type: String },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Parties', partiesSchema);

