const mongoose = require('mongoose');

// Maintains a per-business, per-type sequence for bill numbers
const billingCounterSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  type: { type: String, enum: ['sale', 'purchase'], required: true },
  seq: { type: Number, default: 0 },
}, { timestamps: true });

billingCounterSchema.index({ businessId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('BillingCounter', billingCounterSchema);
