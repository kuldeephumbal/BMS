const Billing = require('../models/billing.modal');
const Product = require('../models/product.modal');

// Helper function to update product stock
const updateProductStock = async (products, type) => {
    for (const product of products) {
        try {
            const prod = await Product.findById(product.id);
            if (!prod) {
                console.warn(`Product not found: ${product.id}`);
                continue;
            }

            // Initialize currentStock if it doesn't exist
            if (prod.currentStock === undefined || prod.currentStock === null) {
                prod.currentStock = prod.openingStock;
            }

            let newStock;
            if (type === 'sale') {
                // Sales reduce stock
                newStock = Math.max(0, prod.currentStock - product.quantity);
            } else if (type === 'purchase') {
                // Purchases increase stock
                newStock = prod.currentStock + product.quantity;
            }

            await Product.findByIdAndUpdate(product.id, { currentStock: newStock });
        } catch (error) {
            console.error(`Error updating stock for product ${product.id}:`, error);
        }
    }
};

// Create Billing
module.exports.createBilling = async (req, res) => {
    try {
        const {
            userId,
            businessId,
            type, // 'sale' | 'purchase'
            date,
            parties,
            products,
            additionalCharges,
            discount,
            optionalFields,
            note,
            photos,
            method, // 'unpaid' | 'cash' | 'online'
            dueDate,
            balanceDue,
            totalAmount
        } = req.body;

        // Basic validations (align with schema)
        if (!userId || !businessId || !type) {
            return res.status(400).json({ message: 'userId, businessId and type are required.' });
        }
        if (!['sale', 'purchase'].includes(type)) {
            return res.status(400).json({ message: "type must be 'sale' or 'purchase'." });
        }
        if (!parties || !parties.id || !parties.name || !parties.phone) {
            return res.status(400).json({ message: 'parties (id, name, phone) are required.' });
        }
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'At least one product is required.' });
        }
        if (!method || !['unpaid', 'cash', 'online'].includes(method)) {
            return res.status(400).json({ message: "method must be 'unpaid', 'cash' or 'online'." });
        }
        // dueDate, note, photos, balanceDue, totalAmount are optional per updated model

        // Filter out empty additional charges and discounts
        const validAdditionalCharges = (additionalCharges || []).filter(charge =>
            charge && charge.name && charge.name.trim() && charge.amount !== undefined
        );
        const validDiscounts = (discount || []).filter(disc =>
            disc && disc.type && disc.value !== undefined
        );

        // Get and increment the bill number
        const BillingCounter = require('../models/billingCounter.modal');
        let counter = await BillingCounter.findOneAndUpdate(
            { businessId, type },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const doc = new Billing({
            userId,
            businessId,
            type,
            billNumber: counter.seq, // Assign the auto-incremented bill number
            date: date ? new Date(date) : undefined,
            parties,
            products,
            additionalCharges: validAdditionalCharges,
            discount: validDiscounts,
            optionalFields,
            note: note ? String(note).trim() : undefined,
            photos: Array.isArray(photos) ? photos : undefined,
            method,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            balanceDue: (balanceDue === undefined || balanceDue === null) ? undefined : balanceDue,
            totalAmount: (totalAmount === undefined || totalAmount === null) ? undefined : totalAmount
        });

        await doc.save();

        // Update product stock after successful billing creation
        await updateProductStock(products, type);

        return res.status(201).json({ message: 'Billing created successfully', billing: doc });
    } catch (error) {
        console.error('Create billing error:', error);
        return res.status(500).json({ message: 'Server error creating billing.' });
    }
};

// Get Billings with filters & pagination
module.exports.getBillings = async (req, res) => {
    try {
        const {
            userId,
            businessId,
            type,
            method,
            billNumber,
            search, // party name/phone search
            startDate,
            endDate,
            page = 1,
            limit = 20
        } = req.query;

        if (!userId) return res.status(400).json({ message: 'userId is required.' });

        const query = { userId };
        if (businessId) query.businessId = businessId;
        if (type) query.type = type;
        if (method) query.method = method;
        if (billNumber) query.billNumber = Number(billNumber);
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (search) {
            query.$or = [
                { 'parties.name': { $regex: search, $options: 'i' } },
                { 'parties.phone': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const docs = await Billing.find(query)
            .sort({ date: -1, billNumber: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        const total = await Billing.countDocuments(query);

        return res.status(200).json({
            message: 'Billings retrieved successfully',
            count: docs.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            billings: docs
        });
    } catch (error) {
        console.error('Get billings error:', error);
        return res.status(500).json({ message: 'Server error retrieving billings.' });
    }
};

// Get Billing by ID
module.exports.getBillingById = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Billing.findById(id);
        if (!doc) return res.status(404).json({ message: 'Billing not found.' });
        return res.status(200).json({ message: 'Billing retrieved successfully', billing: doc });
    } catch (error) {
        console.error('Get billing by id error:', error);
        return res.status(500).json({ message: 'Server error retrieving billing.' });
    }
};

// Update Billing
module.exports.updateBilling = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            type,
            businessId,
            date,
            parties,
            products,
            additionalCharges,
            discount,
            optionalFields,
            note,
            photos,
            method,
            dueDate,
            balanceDue,
            totalAmount
        } = req.body;

        const doc = await Billing.findById(id);
        if (!doc) return res.status(404).json({ message: 'Billing not found.' });

        // Store original products for stock reversal
        const originalProducts = doc.products;

        // Disallow changing businessId and type to avoid billNumber uniqueness issues
        if (businessId && String(businessId) !== String(doc.businessId)) {
            return res.status(400).json({ message: 'Changing businessId is not allowed for an existing bill.' });
        }
        if (type && type !== doc.type) {
            return res.status(400).json({ message: 'Changing type is not allowed for an existing bill.' });
        }

        if (date) doc.date = new Date(date);
        if (parties) doc.parties = parties;
        if (Array.isArray(products)) doc.products = products;
        if (Array.isArray(additionalCharges)) {
            // Filter out empty additional charges
            const validAdditionalCharges = additionalCharges.filter(charge =>
                charge && charge.name && charge.name.trim() && charge.amount !== undefined
            );
            doc.additionalCharges = validAdditionalCharges;
        }
        if (Array.isArray(discount)) {
            // Filter out empty discounts
            const validDiscounts = discount.filter(disc =>
                disc && disc.type && disc.value !== undefined
            );
            doc.discount = validDiscounts;
        }
        if (optionalFields !== undefined) doc.optionalFields = optionalFields;
        if (note !== undefined) doc.note = note;
        if (Array.isArray(photos)) doc.photos = photos;
        if (method) {
            if (!['unpaid', 'cash', 'online'].includes(method)) {
                return res.status(400).json({ message: "method must be 'unpaid', 'cash' or 'online'." });
            }
            doc.method = method;
        }
        if (dueDate) doc.dueDate = new Date(dueDate);
        if (balanceDue !== undefined) {
            if (Number(balanceDue) < 0) {
                return res.status(400).json({ message: 'balanceDue must be >= 0.' });
            }
            doc.balanceDue = balanceDue;
        }
        if (totalAmount !== undefined) {
            if (Number(totalAmount) < 0) {
                return res.status(400).json({ message: 'totalAmount must be >= 0.' });
            }
            doc.totalAmount = totalAmount;
        }

        await doc.save();

        // Update stock if products changed
        if (Array.isArray(products)) {
            // First, reverse the original stock changes
            const reversalProducts = originalProducts.map(p => ({ ...p, quantity: -p.quantity }));
            await updateProductStock(reversalProducts, doc.type);

            // Then apply the new stock changes
            await updateProductStock(products, doc.type);
        }

        return res.status(200).json({ message: 'Billing updated successfully', billing: doc });
    } catch (error) {
        console.error('Update billing error:', error);
        return res.status(500).json({ message: 'Server error updating billing.' });
    }
};

// Delete Billing
module.exports.deleteBilling = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Billing.findById(id);
        if (!doc) return res.status(404).json({ message: 'Billing not found.' });

        // Reverse stock changes before deleting
        const reversalProducts = doc.products.map(p => ({ ...p, quantity: -p.quantity }));
        await updateProductStock(reversalProducts, doc.type);

        await Billing.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Billing deleted successfully' });
    } catch (error) {
        console.error('Delete billing error:', error);
        return res.status(500).json({ message: 'Server error deleting billing.' });
    }
};

// Get Next Bill Number for preview
module.exports.getNextBillNumber = async (req, res) => {
    try {
        const { businessId, type } = req.query;

        if (!businessId || !type) {
            return res.status(400).json({ message: 'businessId and type are required.' });
        }

        if (!['sale', 'purchase'].includes(type)) {
            return res.status(400).json({ message: "type must be 'sale' or 'purchase'." });
        }

        const BillingCounter = require('../models/billingCounter.modal');

        // Find the current counter or create one if it doesn't exist
        let counter = await BillingCounter.findOne({ businessId, type });

        if (!counter) {
            counter = new BillingCounter({ businessId, type, seq: 0 });
        }

        // Return the next number (current seq + 1)
        const nextNumber = counter.seq + 1;

        return res.status(200).json({ nextNumber });
    } catch (error) {
        console.error('Get next bill number error:', error);
        return res.status(500).json({ message: 'Server error getting next bill number.' });
    }
};

