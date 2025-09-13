const mongoose = require('mongoose');

const billingTermsSchema = new mongoose.Schema({
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    type: { type: String, enum: ['sale', 'purchase'], required: true },
    terms: [{
        text: { type: String, required: true },
        isActive: { type: Boolean, default: true }
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Unique per businessId + type (one document per business per bill type)
billingTermsSchema.index({ businessId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('BillingTerms', billingTermsSchema);
