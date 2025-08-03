const Transaction = require('../models/transaction.modal');
const mongoose = require('mongoose');

// Create a new transaction
module.exports.createTransaction = async (req, res) => {
    try {
        const {
            userId,
            businessId,
            partyId,
            type,
            amount,
            paymentMethod,
            notes,
            date
        } = req.body;

        // Validate required fields
        if (!userId || !businessId || !partyId || !type || !amount || !paymentMethod || !date) {
            return res.status(400).json({
                message: 'User ID, Business ID, Party ID, Type, Amount, Payment Method, and Date are required fields.'
            });
        }

        // Validate ObjectId fields
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID.' });
        }
        if (!mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({ message: 'Invalid Business ID.' });
        }
        if (!mongoose.Types.ObjectId.isValid(partyId)) {
            return res.status(400).json({ message: 'Invalid Party ID.' });
        }

        // Validate enum values
        if (!['gave', 'got'].includes(type)) {
            return res.status(400).json({ message: 'Type must be either "gave" or "got".' });
        }
        if (!['cash', 'online', 'cheque', 'other'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Payment method must be cash, online, cheque, or other.' });
        }

        // Validate amount
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0.' });
        }

        // Simply use the amount as-is without any conversion
        const processedAmount = Number(amount);

        const newTransaction = await Transaction.create({
            userId,
            businessId,
            partyId,
            type,
            amount: processedAmount,
            paymentMethod,
            notes,
            date: new Date(date)
        });

        res.status(201).json({
            message: 'Transaction created successfully.',
            transaction: newTransaction
        });
    } catch (error) {
        console.error('Transaction creation error:', error);
        res.status(500).json({ message: 'Server error during transaction creation.' });
    }
};

// Get all transactions for a business (with pagination and search)
module.exports.getTransactions = async (req, res) => {
    try {
        const { businessId, page = 1, limit = 10, search = '', type, paymentMethod } = req.query;

        if (!businessId) {
            return res.status(400).json({ message: 'Business ID is required.' });
        }

        if (!mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({ message: 'Invalid Business ID.' });
        }

        const query = {
            businessId,
        };

        // Add search filter
        if (search) {
            query.$or = [
                { notes: { $regex: search, $options: 'i' } },
                { paymentMethod: { $regex: search, $options: 'i' } }
            ];
        }

        // Add type filter
        if (type && ['gave', 'got'].includes(type)) {
            query.type = type;
        }



        // Add payment method filter
        if (paymentMethod && ['cash', 'online', 'cheque', 'other'].includes(paymentMethod)) {
            query.paymentMethod = paymentMethod;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const transactions = await Transaction.find(query)
            .populate('partyId', 'name type')
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Transaction.countDocuments(query);

        res.status(200).json({
            message: 'Transactions retrieved successfully.',
            transactions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Transactions retrieval error:', error);
        res.status(500).json({ message: 'Server error during transactions retrieval.' });
    }
};

// Get a single transaction by ID
module.exports.getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Transaction ID.' });
        }

        const transaction = await Transaction.findById(id)
            .populate('partyId', 'name type');

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found.' });
        }

        res.status(200).json({
            message: 'Transaction retrieved successfully.',
            transaction
        });
    } catch (error) {
        console.error('Transaction retrieval error:', error);
        res.status(500).json({ message: 'Server error during transaction retrieval.' });
    }
};

// Update a transaction
module.exports.updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            type,
            amount,
            paymentMethod,
            notes,
            date
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Transaction ID.' });
        }

        const existingTransaction = await Transaction.findById(id);
        if (!existingTransaction) {
            return res.status(404).json({ message: 'Transaction not found.' });
        }

        // Validate enum values if provided
        if (type && !['gave', 'got'].includes(type)) {
            return res.status(400).json({ message: 'Type must be either "gave" or "got".' });
        }
        if (paymentMethod && !['cash', 'online', 'cheque', 'other'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Payment method must be cash, online, cheque, or other.' });
        }

        // Validate amount if provided
        if (amount !== undefined && amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0.' });
        }

        const updateData = {};
        if (type !== undefined) updateData.type = type;
        if (amount !== undefined) {
            updateData.amount = Number(amount);
        }
        if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
        if (notes !== undefined) updateData.notes = notes;
        if (date !== undefined) updateData.date = new Date(date);

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('partyId', 'name type');

        res.status(200).json({
            message: 'Transaction updated successfully.',
            transaction: updatedTransaction
        });
    } catch (error) {
        console.error('Transaction update error:', error);
        res.status(500).json({ message: 'Server error during transaction update.' });
    }
};

// Delete a transaction
module.exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Transaction ID.' });
        }

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found.' });
        }

        await Transaction.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Transaction deleted successfully.'
        });
    } catch (error) {
        console.error('Transaction deletion error:', error);
        res.status(500).json({ message: 'Server error during transaction deletion.' });
    }
};

// Get transaction statistics for a business
module.exports.getTransactionStats = async (req, res) => {
    try {
        const { businessId } = req.query;

        if (!businessId) {
            return res.status(400).json({ message: 'Business ID is required.' });
        }

        if (!mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({ message: 'Invalid Business ID.' });
        }

        const stats = await Transaction.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    gaveAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'gave'] }, '$amount', 0]
                        }
                    },
                    gotAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'got'] }, '$amount', 0]
                        }
                    },

                }
            }
        ]);

        const formattedStats = stats[0] || {
            totalTransactions: 0,
            totalAmount: 0,
            gaveAmount: 0,
            gotAmount: 0
        };

        // Calculate net amount (got - gave)
        formattedStats.netAmount = formattedStats.gotAmount - formattedStats.gaveAmount;

        res.status(200).json({
            message: 'Transaction statistics retrieved successfully.',
            stats: formattedStats
        });
    } catch (error) {
        console.error('Transaction statistics error:', error);
        res.status(500).json({ message: 'Server error during transaction statistics retrieval.' });
    }
};

// Get transactions by party
module.exports.getTransactionsByParty = async (req, res) => {
    try {
        const { partyId, page = 1, limit = 10 } = req.query;

        if (!partyId) {
            return res.status(400).json({ message: 'Party ID is required.' });
        }

        if (!mongoose.Types.ObjectId.isValid(partyId)) {
            return res.status(400).json({ message: 'Invalid Party ID.' });
        }

        const query = { partyId };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const transactions = await Transaction.find(query)
            .populate('partyId', 'name type')
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Transaction.countDocuments(query);

        res.status(200).json({
            message: 'Party transactions retrieved successfully.',
            transactions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Party transactions retrieval error:', error);
        res.status(500).json({ message: 'Server error during party transactions retrieval.' });
    }
};
