const Product = require('../models/product.modal');
const path = require('path');
const fs = require('fs');

// 🟩 Create Product
module.exports.createProduct = async (req, res) => {
    try {
        const { userId, businessId, name, primaryUnit, secondaryUnit, salePrice, purchasePrice, taxIncluded, openingStock, lowStockAlert, HSN, GST, note } = req.body;

        if (!userId || !businessId || !name || !primaryUnit || !salePrice || !purchasePrice || openingStock === undefined || lowStockAlert === undefined) {
            return res.status(400).json({ message: 'userId, businessId, name, primaryUnit, salePrice, purchasePrice, openingStock and lowStockAlert are required.' });
        }

        if (salePrice <= 0 || purchasePrice <= 0) {
            return res.status(400).json({ message: 'salePrice and purchasePrice must be greater than zero.' });
        }

        if (openingStock < 0 || lowStockAlert < 0) {
            return res.status(400).json({ message: 'openingStock and lowStockAlert must be >= 0.' });
        }

        const newProduct = new Product({
            userId,
            businessId,
            name: name.trim(),
            image: req.file ? req.file.filename : undefined,
            primaryUnit: primaryUnit.trim(),
            secondaryUnit: secondaryUnit || '',
            salePrice,
            purchasePrice,
            taxIncluded: taxIncluded === 'true' || taxIncluded === true,
            openingStock: Number(openingStock),
            lowStockAlert: Number(lowStockAlert),
            HSN: HSN?.trim() || undefined,
            GST: GST?.trim() || undefined,
            note: note?.trim() || ''
        });

        await newProduct.save();

        res.status(201).json({
            message: 'Product created successfully.',
            product: newProduct
        });
    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({ message: 'Server error during product creation.' });
    }
};

// 🟦 Get All Products
module.exports.getAllProducts = async (req, res) => {
    try {
        const { userId, businessId, name, page = 1, limit = 10 } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }

        const query = { userId };
        if (businessId) query.businessId = businessId;
        if (name) query.name = { $regex: name, $options: 'i' };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalProducts = await Product.countDocuments(query);

        res.status(200).json({
            message: 'Products retrieved successfully',
            count: products.length,
            totalProducts,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalProducts / parseInt(limit)),
            products
        });
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({ message: 'Server error during products retrieval.' });
    }
};

// 🟧 Get Product by ID
module.exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product retrieved successfully', product });
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({ message: 'Server error during product retrieval.' });
    }
};

// 🟪 Update Product
module.exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, primaryUnit, secondaryUnit, salePrice, purchasePrice, taxIncluded, openingStock, lowStockAlert, HSN, GST, note, businessId } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const updateData = {};
        const unsetData = {};

        if (name) updateData.name = name.trim();
        if (businessId) updateData.businessId = businessId;
        if (primaryUnit) updateData.primaryUnit = primaryUnit.trim();
        if (secondaryUnit !== undefined) updateData.secondaryUnit = secondaryUnit;
        if (salePrice) {
            if (salePrice <= 0) return res.status(400).json({ message: 'salePrice must be greater than zero.' });
            updateData.salePrice = salePrice;
        }
        if (purchasePrice) {
            if (purchasePrice <= 0) return res.status(400).json({ message: 'purchasePrice must be greater than zero.' });
            updateData.purchasePrice = purchasePrice;
        }
        if (taxIncluded !== undefined) updateData.taxIncluded = taxIncluded === 'true' || taxIncluded === true;
        if (openingStock !== undefined) {
            if (openingStock < 0) return res.status(400).json({ message: 'openingStock must be >= 0.' });
            updateData.openingStock = openingStock;
        }
        if (lowStockAlert !== undefined) {
            if (lowStockAlert < 0) return res.status(400).json({ message: 'lowStockAlert must be >= 0.' });
            updateData.lowStockAlert = lowStockAlert;
        }
        if (HSN !== undefined) {
            const trimmedHSN = (HSN || '').trim();
            if (trimmedHSN === '') unsetData.HSN = '';
            else updateData.HSN = trimmedHSN;
        }
        if (GST !== undefined) {
            const trimmedGST = (GST || '').trim();
            if (trimmedGST === '') unsetData.GST = '';
            else updateData.GST = trimmedGST;
        }
        if (note !== undefined) updateData.note = note.trim();

        if (req.file) {
            try {
                if (product.image) {
                    const oldPath = path.join(__dirname, '../uploads/logos', product.image);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
            } catch (e) {
                console.warn('Failed to delete old product image:', e.message);
            }
            updateData.image = req.file.filename;
        }

        const updateOps = {};
        if (Object.keys(updateData).length) updateOps.$set = updateData;
        if (Object.keys(unsetData).length) updateOps.$unset = unsetData;

        if (!Object.keys(updateOps).length) {
            return res.status(400).json({ message: 'No valid fields provided for update.' });
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, updateOps, { new: true });
        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Server error during product update.' });
    }
};

// 🟥 Delete Product
module.exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Delete image file (optional)
        try {
            if (product.image) {
                const imgPath = path.join(__dirname, '../uploads/logos', product.image);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
        } catch (e) {
            console.warn('Failed to delete product image:', e.message);
        }

        await Product.findByIdAndDelete(id);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Server error during product deletion.' });
    }
};