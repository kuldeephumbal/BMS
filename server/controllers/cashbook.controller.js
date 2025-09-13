const Cashbook = require('../models/cashbook.modal');

// Create Cashbook Entry
module.exports.createCashbook = async (req, res) => {
    try {
        const { userId, businessId, amount, type, method, note, date } = req.body;
        if (!userId || !businessId || !amount || !type || !method) {
            return res.status(400).json({ message: 'userId, businessId, amount, type (in/out), method (cash/online) are required.' });
        }
        if (amount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0.' });
        if (!['in', 'out'].includes(type)) return res.status(400).json({ message: 'type must be in or out.' });
        if (!['cash', 'online'].includes(method)) return res.status(400).json({ message: 'method must be cash or online.' });
        const entry = new Cashbook({
            userId,
            businessId,
            amount,
            type, // direction
            method,
            note: note ? note.trim() : undefined,
            date: date ? new Date(date) : new Date()
        });
        await entry.save();
        res.status(201).json({ message: 'Cashbook entry created successfully', cashbook: entry });
    } catch (error) {
        console.error('Create cashbook error:', error);
        res.status(500).json({ message: 'Server error creating cashbook entry.' });
    }
};

// Get All Cashbook Entries (with pagination & filters)
module.exports.getCashbooks = async (req, res) => {
    try {
        const { userId, businessId, type, method, startDate, endDate, page = 1, limit = 20 } = req.query;
        if (!userId) return res.status(400).json({ message: 'userId is required.' });
        const query = { userId };
        if (businessId) query.businessId = businessId;
        if (type) query.type = type; // direction
        if (method) query.method = method;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const entries = await Cashbook.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit));
        const total = await Cashbook.countDocuments(query);
        const totalAmount = await Cashbook.aggregate([
            { $match: query },
            { $group: { _id: null, sum: { $sum: '$amount' } } }
        ]);
        res.status(200).json({
            message: 'Cashbook entries retrieved successfully',
            count: entries.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalAmount: totalAmount[0]?.sum || 0,
            cashbooks: entries
        });
    } catch (error) {
        console.error('Get cashbooks error:', error);
        res.status(500).json({ message: 'Server error retrieving cashbook entries.' });
    }
};

// Get Single Cashbook Entry
module.exports.getCashbookById = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await Cashbook.findById(id);
        if (!entry) return res.status(404).json({ message: 'Cashbook entry not found.' });
        res.status(200).json({ message: 'Cashbook entry retrieved successfully', cashbook: entry });
    } catch (error) {
        console.error('Get cashbook by id error:', error);
        res.status(500).json({ message: 'Server error retrieving cashbook entry.' });
    }
};

// Update Cashbook Entry
module.exports.updateCashbook = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, type, method, note, date, businessId } = req.body;
        const entry = await Cashbook.findById(id);
        if (!entry) return res.status(404).json({ message: 'Cashbook entry not found.' });
        if (amount !== undefined) {
            if (amount <= 0) return res.status(400).json({ message: 'Amount must be > 0.' });
            entry.amount = amount;
        }
        if (type) {
            if (!['in', 'out'].includes(type)) return res.status(400).json({ message: 'type must be in or out.' });
            entry.type = type;
        }
        if (method) {
            if (!['cash', 'online'].includes(method)) return res.status(400).json({ message: 'method must be cash or online.' });
            entry.method = method;
        }
        if (note !== undefined) entry.note = note ? note.trim() : undefined;
        if (date) entry.date = new Date(date);
        if (businessId) entry.businessId = businessId;
        await entry.save();
        res.status(200).json({ message: 'Cashbook entry updated successfully', cashbook: entry });
    } catch (error) {
        console.error('Update cashbook error:', error);
        res.status(500).json({ message: 'Server error updating cashbook entry.' });
    }
};

// Delete Cashbook Entry
module.exports.deleteCashbook = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await Cashbook.findById(id);
        if (!entry) return res.status(404).json({ message: 'Cashbook entry not found.' });
        await Cashbook.findByIdAndDelete(id);
        res.status(200).json({ message: 'Cashbook entry deleted successfully' });
    } catch (error) {
        console.error('Delete cashbook error:', error);
        res.status(500).json({ message: 'Server error deleting cashbook entry.' });
    }
};
