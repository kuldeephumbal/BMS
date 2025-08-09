const Expense = require('../models/expense.modal');
const mongoose = require('mongoose');

// 🟩 Create Expense
module.exports.createExpense = async (req, res) => {
    try {
        const { userId, category, amount, note, date } = req.body;

        if (!userId || !category || !amount || !note) {
            return res.status(400).json({ message: 'User ID, category, amount, and note are required.' });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero.' });
        }

        const newExpense = new Expense({
            userId,
            category,
            amount,
            note: note.trim(),
            date: date || new Date()
        });
        await newExpense.save();

        // Populate category for response
        await newExpense.populate('category', 'name');
        await newExpense.populate('userId', 'first_name last_name email');

        res.status(201).json({
            message: 'Expense created successfully.',
            expense: newExpense
        });
    } catch (error) {
        console.error('Expense creation error:', error);
        res.status(500).json({ message: 'Server error during expense creation.' });
    }
};

// 🟦 Get All Expenses
module.exports.getAllExpenses = async (req, res) => {
    try {
        const { userId, category, startDate, endDate, page = 1, limit = 10 } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        let query = { userId };

        // Filter by category if provided
        if (category) {
            query.category = category;
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const expenses = await Expense.find(query)
            .populate('category', 'name')
            .populate('userId', 'first_name last_name email')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalExpenses = await Expense.countDocuments(query);
        const totalAmount = await Expense.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.status(200).json({
            message: 'Expenses retrieved successfully',
            count: expenses.length,
            totalExpenses,
            totalAmount: totalAmount[0]?.total || 0,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalExpenses / parseInt(limit)),
            expenses
        });
    } catch (error) {
        console.error('Get all expenses error:', error);
        res.status(500).json({ message: 'Server error during expenses retrieval.' });
    }
};

// 🟧 Get Expense by ID
module.exports.getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;

        const expense = await Expense.findById(id)
            .populate('category', 'name')
            .populate('userId', 'first_name last_name email');

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found.' });
        }

        res.status(200).json({
            message: 'Expense retrieved successfully',
            expense
        });
    } catch (error) {
        console.error('Get expense by ID error:', error);
        res.status(500).json({ message: 'Server error during expense retrieval.' });
    }
};

// 🟪 Update Expense
module.exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, amount, note, date } = req.body;

        if (!category && !amount && !note && !date) {
            return res.status(400).json({ message: 'At least one field is required for update.' });
        }

        if (amount && amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero.' });
        }

        // Find expense
        const expense = await Expense.findById(id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found.' });
        }

        // Update fields
        const updateData = {};
        if (category) updateData.category = category;
        if (amount) updateData.amount = amount;
        if (note) updateData.note = note.trim();
        if (date) updateData.date = new Date(date);

        const updatedExpense = await Expense.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate('category', 'name')
            .populate('userId', 'first_name last_name email');

        res.status(200).json({
            message: 'Expense updated successfully',
            expense: updatedExpense
        });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ message: 'Server error during expense update.' });
    }
};

// 🟥 Delete Expense
module.exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const expense = await Expense.findById(id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found.' });
        }

        await Expense.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ message: 'Server error during expense deletion.' });
    }
};

// 📊 Get Expense Statistics
module.exports.getExpenseStats = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        let matchQuery = { userId: mongoose.Types.ObjectId(userId) };

        // Filter by date range if provided
        if (startDate || endDate) {
            matchQuery.date = {};
            if (startDate) matchQuery.date.$gte = new Date(startDate);
            if (endDate) matchQuery.date.$lte = new Date(endDate);
        }

        const stats = await Expense.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $project: {
                    categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] },
                    totalAmount: 1,
                    count: 1,
                    avgAmount: { $round: ['$avgAmount', 2] }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        const totalStats = await Expense.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalCount: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]);

        res.status(200).json({
            message: 'Expense statistics retrieved successfully',
            categoryStats: stats,
            totalStats: totalStats[0] || { totalAmount: 0, totalCount: 0, avgAmount: 0 }
        });
    } catch (error) {
        console.error('Get expense stats error:', error);
        res.status(500).json({ message: 'Server error during expense statistics retrieval.' });
    }
};
