const mongoose = require('mongoose');
const BillingCounter = require('./billingCounter.modal');

const billingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    type: { type: String, enum: ['sale', 'purchase'], required: true },
    // Auto-incremented per businessId + type
    billNumber: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    parties: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Parties', required: true },
        name: { type: String, required: true },
        phone: { type: String, required: true },
    },
    products: [{
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        price: { type: Number, required: true, min: 0 },
    }],
    additionalCharges: [{
        name: { type: String },
        amount: { type: Number, min: 0, default: 0 },
    }],
    discount: [{
        type: { type: String, enum: ['percentage', 'amount'] },
        value: { type: Number, min: 0, default: 0 }
    }],
    optionalFields: {
        customFields: [{
            fieldName: { type: String },
            fieldValue: { type: String }
        }],
        partyAddress: {
            address: { type: String },
            pincode: { type: String },
            city: { type: String },
            state: { type: String }
        },
        shippingAddress: {
            address: { type: String },
            pincode: { type: String },
            city: { type: String },
            state: { type: String }
        },
        businessAddress: {
            address: { type: String },
            pincode: { type: String },
            city: { type: String },
            state: { type: String }
        },
        termsAndConditions: [{
            text: { type: String, required: true }
        }],
    },
    note: { type: String },
    photos: [{ type: String }],
    method: { type: String, enum: ['unpaid', 'cash', 'online'], required: true },
    dueDate: { type: Date },
    balanceDue: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
}, { timestamps: true });

// Unique per businessId + type + billNumber
billingSchema.index({ businessId: 1, type: 1, billNumber: 1 }, { unique: true });

// Auto-assign billNumber on create, separate sequence per businessId + type
billingSchema.pre('validate', async function (next) {
    try {
        if (!this.isNew) return next();
        if (typeof this.billNumber === 'number' && this.billNumber > 0) return next();
        if (!this.businessId || !this.type) {
            return next(new Error('businessId and type are required to generate billNumber'));
        }
        const counter = await BillingCounter.findOneAndUpdate(
            { businessId: this.businessId, type: this.type },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.billNumber = counter.seq;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('Billing', billingSchema);