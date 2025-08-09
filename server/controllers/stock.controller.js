const Stock = require('../models/stock.modal');
const Product = require('../models/product.modal');

// Create Stock Record (IN / OUT) and adjust product stock
module.exports.createStockRecord = async (req, res) => {
    try {
        const { productId, type, quantity, purchasePrice, date, note } = req.body;
        if (!productId || !type || quantity === undefined || purchasePrice === undefined) {
            return res.status(400).json({ message: 'productId, type, quantity, purchasePrice are required.' });
        }
        if (!['IN', 'OUT'].includes(type)) return res.status(400).json({ message: 'type must be IN or OUT.' });
        if (quantity < 0 || purchasePrice < 0) return res.status(400).json({ message: 'quantity and purchasePrice must be >= 0.' });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found.' });

        // Adjust stock
        let newStock = product.openingStock || 0;
        if (type === 'IN') newStock += Number(quantity);
        else {
            if (newStock < quantity) return res.status(400).json({ message: 'Not enough stock for OUT movement.' });
            newStock -= Number(quantity);
        }

        const stockRecord = new Stock({
            productId,
            type,
            quantity: Number(quantity),
            purchasePrice: Number(purchasePrice),
            date: date ? new Date(date) : new Date(),
            note: note?.trim() || ''
        });

        await stockRecord.save();
        product.openingStock = newStock; // persist updated stock
        await product.save();

        res.status(201).json({ message: 'Stock record created successfully', stock: stockRecord, currentStock: newStock });
    } catch (error) {
        console.error('Create stock record error:', error);
        res.status(500).json({ message: 'Server error creating stock record.' });
    }
};

// Get Stock Records (filter by product, type, date range, pagination)
module.exports.getStockRecords = async (req, res) => {
    try {
        const { productId, type, fromDate, toDate, page = 1, limit = 20 } = req.query;
        const query = {};
        if (productId) query.productId = productId;
        if (type && ['IN', 'OUT'].includes(type)) query.type = type;
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [records, total] = await Promise.all([
            Stock.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('productId', 'name openingStock'),
            Stock.countDocuments(query)
        ]);

        res.status(200).json({
            message: 'Stock records retrieved successfully',
            count: records.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            records
        });
    } catch (error) {
        console.error('Get stock records error:', error);
        res.status(500).json({ message: 'Server error retrieving stock records.' });
    }
};

// Get single stock record
module.exports.getStockRecordById = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Stock.findById(id).populate('productId', 'name openingStock');
        if (!record) return res.status(404).json({ message: 'Stock record not found.' });
        res.status(200).json({ message: 'Stock record retrieved successfully', stock: record });
    } catch (error) {
        console.error('Get stock record error:', error);
        res.status(500).json({ message: 'Server error retrieving stock record.' });
    }
};

// Update stock record (adjust product stock based on delta)
module.exports.updateStockRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, quantity, purchasePrice, date, note } = req.body;

        const record = await Stock.findById(id);
        if (!record) return res.status(404).json({ message: 'Stock record not found.' });

        const product = await Product.findById(record.productId);
        if (!product) return res.status(404).json({ message: 'Related product not found.' });

        let currentStock = product.openingStock || 0;

        // Reverse original movement
        if (record.type === 'IN') currentStock -= record.quantity;
        else currentStock += record.quantity;

        // Prepare new values
        const newType = type || record.type;
        const newQty = quantity !== undefined ? Number(quantity) : record.quantity;
        const newPrice = purchasePrice !== undefined ? Number(purchasePrice) : record.purchasePrice;

        if (!['IN', 'OUT'].includes(newType)) return res.status(400).json({ message: 'type must be IN or OUT.' });
        if (newQty < 0 || newPrice < 0) return res.status(400).json({ message: 'quantity and purchasePrice must be >= 0.' });

        // Apply new movement
        if (newType === 'IN') currentStock += newQty; else {
            if (currentStock < newQty) return res.status(400).json({ message: 'Not enough stock for OUT movement.' });
            currentStock -= newQty;
        }

        record.type = newType;
        record.quantity = newQty;
        record.purchasePrice = newPrice;
        if (date) record.date = new Date(date);
        if (note !== undefined) record.note = note.trim();

        await record.save();
        product.openingStock = currentStock;
        await product.save();

        res.status(200).json({ message: 'Stock record updated successfully', stock: record, currentStock });
    } catch (error) {
        console.error('Update stock record error:', error);
        res.status(500).json({ message: 'Server error updating stock record.' });
    }
};

// Delete stock record (reverse its effect)
module.exports.deleteStockRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Stock.findById(id);
        if (!record) return res.status(404).json({ message: 'Stock record not found.' });

        const product = await Product.findById(record.productId);
        if (!product) return res.status(404).json({ message: 'Related product not found.' });

        let currentStock = product.openingStock || 0;
        if (record.type === 'IN') currentStock -= record.quantity; else currentStock += record.quantity;
        if (currentStock < 0) currentStock = 0; // safeguard

        await Stock.findByIdAndDelete(id);
        product.openingStock = currentStock;
        await product.save();

        res.status(200).json({ message: 'Stock record deleted successfully', currentStock });
    } catch (error) {
        console.error('Delete stock record error:', error);
        res.status(500).json({ message: 'Server error deleting stock record.' });
    }
};
