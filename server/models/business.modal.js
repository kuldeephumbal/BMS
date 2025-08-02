const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    business_name: { type: String, required: true },
    logo_url: { type: String, default: '' },
    address: String,
    city: String,
    state: String,
    pin_code: String,
    gst_number: { type: String, trim: true, uppercase: true },
    is_active: { type: Boolean, default: false }, // Changed default to false
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

// Index to ensure only one active business per user
businessSchema.index({ user_id: 1, is_active: 1 });

module.exports = mongoose.model('Business', businessSchema);

