const Budget = require('../models/budget.modal');
const mongoose = require('mongoose');

// 🟩 Create Budget
module.exports.createBudget = async (req, res) => {
    try {
        const { userId, category, amount, note, month } = req.body;

        if (!userId || !category || !amount || !note || !month) {
            return res.status(400).json({ message: 'User ID, category, amount, note, and month are required.' });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero.' });
        }

        // Check if budget already exists for this user, category, and month
        const existingBudget = await Budget.findOne({ userId, category, month });
        if (existingBudget) {
            return res.status(400).json({ message: 'Budget already exists for this category and month.' });
        }

        const newBudget = new Budget({
            userId,
            category,
            amount,
            note: note.trim(),
            month
        });
        await newBudget.save();

        // Populate category and user for response
        await newBudget.populate('category', 'name');
        await newBudget.populate('userId', 'first_name last_name email');

        res.status(201).json({
            message: 'Budget created successfully.',
            budget: newBudget
        });
    } catch (error) {
        console.error('Budget creation error:', error);
        res.status(500).json({ message: 'Server error during budget creation.' });
    }
};

// 🟦 Get All Budgets
module.exports.getAllBudgets = async (req, res) => {
    try {
        const { userId, category, month, page = 1, limit = 10 } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        let query = { userId };

        // Filter by category if provided
        if (category) {
            query.category = category;
        }

        // Filter by month if provided
        if (month) {
            query.month = month;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const budgets = await Budget.find(query)
            .populate('category', 'name')
            .populate('userId', 'first_name last_name email')
            .sort({ month: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalBudgets = await Budget.countDocuments(query);
        const totalAmount = await Budget.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.status(200).json({
            message: 'Budgets retrieved successfully',
            count: budgets.length,
            totalBudgets,
            totalAmount: totalAmount[0]?.total || 0,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalBudgets / parseInt(limit)),
            budgets
        });
    } catch (error) {
        console.error('Get all budgets error:', error);
        res.status(500).json({ message: 'Server error during budgets retrieval.' });
    }
};

// 🟧 Get Budget by ID
module.exports.getBudgetById = async (req, res) => {
    try {
        const { id } = req.params;

        const budget = await Budget.findById(id)
            .populate('category', 'name')
            .populate('userId', 'first_name last_name email');

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found.' });
        }

        res.status(200).json({
            message: 'Budget retrieved successfully',
            budget
        });
    } catch (error) {
        console.error('Get budget by ID error:', error);
        res.status(500).json({ message: 'Server error during budget retrieval.' });
    }
};

// 🟪 Update Budget
module.exports.updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, amount, note, month } = req.body;

        if (!category && !amount && !note && !month) {
            return res.status(400).json({ message: 'At least one field is required for update.' });
        }

        if (amount && amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero.' });
        }

        // Find budget
        const budget = await Budget.findById(id);
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found.' });
        }

        // Check for duplicate if category or month is being updated
        if (category || month) {
            const checkCategory = category || budget.category;
            const checkMonth = month || budget.month;

            const existingBudget = await Budget.findOne({
                userId: budget.userId,
                category: checkCategory,
                month: checkMonth,
                _id: { $ne: id }
            });

            if (existingBudget) {
                return res.status(400).json({ message: 'Budget already exists for this category and month.' });
            }
        }

        // Update fields
        const updateData = {};
        if (category) updateData.category = category;
        if (amount) updateData.amount = amount;
        if (note) updateData.note = note.trim();
        if (month) updateData.month = month;

        const updatedBudget = await Budget.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate('category', 'name')
            .populate('userId', 'first_name last_name email');

        res.status(200).json({
            message: 'Budget updated successfully',
            budget: updatedBudget
        });
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({ message: 'Server error during budget update.' });
    }
};

// 🟥 Delete Budget
module.exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;

        const budget = await Budget.findById(id);
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found.' });
        }

        await Budget.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Budget deleted successfully'
        });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ message: 'Server error during budget deletion.' });
    }
};

// 📊 Get Budget Statistics
module.exports.getBudgetStats = async (req, res) => {
    try {
        const { userId, month } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        let matchQuery = { userId: mongoose.Types.ObjectId(userId) };

        // Filter by month if provided
        if (month) {
            matchQuery.month = month;
        }

        const stats = await Budget.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' },
                    months: { $addToSet: '$month' }
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
                    avgAmount: { $round: ['$avgAmount', 2] },
                    months: 1
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        const totalStats = await Budget.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalCount: { $sum: 1 },
                    avgAmount: { $avg: '$amount' },
                    uniqueCategories: { $addToSet: '$category' },
                    uniqueMonths: { $addToSet: '$month' }
                }
            },
            {
                $project: {
                    totalAmount: 1,
                    totalCount: 1,
                    avgAmount: { $round: ['$avgAmount', 2] },
                    categoriesCount: { $size: '$uniqueCategories' },
                    monthsCount: { $size: '$uniqueMonths' }
                }
            }
        ]);

        res.status(200).json({
            message: 'Budget statistics retrieved successfully',
            categoryStats: stats,
            totalStats: totalStats[0] || {
                totalAmount: 0,
                totalCount: 0,
                avgAmount: 0,
                categoriesCount: 0,
                monthsCount: 0
            }
        });
    } catch (error) {
        console.error('Get budget stats error:', error);
        res.status(500).json({ message: 'Server error during budget statistics retrieval.' });
    }
};

// 📈 Get Monthly Budget Comparison
module.exports.getMonthlyComparison = async (req, res) => {
    try {
        const { userId, startMonth, endMonth } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        let matchQuery = { userId: mongoose.Types.ObjectId(userId) };

        // Filter by month range if provided
        if (startMonth && endMonth) {
            matchQuery.month = { $gte: startMonth, $lte: endMonth };
        } else if (startMonth) {
            matchQuery.month = { $gte: startMonth };
        } else if (endMonth) {
            matchQuery.month = { $lte: endMonth };
        }

        const monthlyStats = await Budget.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$month',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            {
                $project: {
                    month: '$_id',
                    totalAmount: 1,
                    count: 1,
                    avgAmount: { $round: ['$avgAmount', 2] }
                }
            },
            { $sort: { month: 1 } }
        ]);

        res.status(200).json({
            message: 'Monthly budget comparison retrieved successfully',
            monthlyStats
        });
    } catch (error) {
        console.error('Get monthly comparison error:', error);
        res.status(500).json({ message: 'Server error during monthly comparison retrieval.' });
    }
};
