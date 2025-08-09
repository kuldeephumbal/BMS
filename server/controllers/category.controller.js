const Category = require('../models/category.modal');

// 🟩 Create Category
module.exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        // Check if category exists by name
        const existingCategory = await Category.findOne({
            name: name.trim(),
            is_delete: false
        });
        if (existingCategory) {
            return res.status(409).json({ message: 'Category with this name already exists.' });
        }

        const newCategory = new Category({
            name: name.trim()
        });
        await newCategory.save();

        res.status(201).json({
            message: 'Category created successfully.',
            category: {
                _id: newCategory._id,
                name: newCategory.name,
                is_delete: newCategory.is_delete,
                createdAt: newCategory.createdAt,
                updatedAt: newCategory.updatedAt
            }
        });
    } catch (error) {
        console.error('Category creation error:', error);
        res.status(500).json({ message: 'Server error during category creation.' });
    }
};

// 🟦 Get All Categories
module.exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({
            is_delete: false
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Categories retrieved successfully',
            count: categories.length,
            categories
        });
    } catch (error) {
        console.error('Get all categories error:', error);
        res.status(500).json({ message: 'Server error during categories retrieval.' });
    }
};

// 🟧 Get Category by ID
module.exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);

        if (!category || category.is_delete) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        res.status(200).json({
            message: 'Category retrieved successfully',
            category
        });
    } catch (error) {
        console.error('Get category by ID error:', error);
        res.status(500).json({ message: 'Server error during category retrieval.' });
    }
};

// 🟪 Update Category
module.exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        // Find category
        const category = await Category.findById(id);
        if (!category || category.is_delete) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // Check if name is being changed and if it already exists
        if (name.trim() !== category.name) {
            const existingCategory = await Category.findOne({
                name: name.trim(),
                is_delete: false,
                _id: { $ne: id }
            });
            if (existingCategory) {
                return res.status(409).json({ message: 'Category with this name already exists.' });
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name: name.trim() },
            { new: true }
        );

        res.status(200).json({
            message: 'Category updated successfully',
            category: updatedCategory
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ message: 'Server error during category update.' });
    }
};

// 🟥 Delete Category (soft delete)
module.exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category || category.is_delete) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // Soft delete - mark as deleted
        await Category.findByIdAndUpdate(id, {
            is_delete: true
        });

        res.status(200).json({
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ message: 'Server error during category deletion.' });
    }
};

// 🔍 Search Categories
module.exports.searchCategories = async (req, res) => {
    try {
        const { search } = req.query;

        let query = {
            is_delete: false
        };

        if (search && search.trim()) {
            query.name = { $regex: search.trim(), $options: 'i' };
        }

        const categories = await Category.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Categories search completed successfully',
            count: categories.length,
            categories
        });
    } catch (error) {
        console.error('Search categories error:', error);
        res.status(500).json({ message: 'Server error during categories search.' });
    }
};
