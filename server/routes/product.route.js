const express = require('express');
const router = express.Router();
const multer = require('../config/multer');
const upload = multer.single('image');
const auth = require('../middleware/auth');
const { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/product.controller');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Product ID
 *         userId:
 *           type: string
 *           description: ID of the user
 *         businessId:
 *           type: string
 *           description: Associated business ID
 *         name:
 *           type: string
 *         image:
 *           type: string
 *           description: Image filename
 *         primaryUnit:
 *           type: string
 *         secondaryUnit:
 *           type: string
 *         salePrice:
 *           type: number
 *         purchasePrice:
 *           type: number
 *         taxIncluded:
 *           type: boolean
 *         openingStock:
 *           type: number
 *         lowStockAlert:
 *           type: number
 *         HSN:
 *           type: string
 *         GST:
 *           type: string
 *         note:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Create a new product (auth required)
 *     description: Create a new product with optional image/HSN/GST. openingStock & lowStockAlert now required. Requires authentication.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - businessId
 *               - name
 *               - primaryUnit
 *               - salePrice
 *               - purchasePrice
 *               - openingStock
 *               - lowStockAlert
 *             properties:
 *               userId:
 *                 type: string
 *               businessId:
 *                 type: string
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file
 *               primaryUnit:
 *                 type: string
 *               secondaryUnit:
 *                 type: string
 *               salePrice:
 *                 type: number
 *               purchasePrice:
 *                 type: number
 *               taxIncluded:
 *                 type: boolean
 *               openingStock:
 *                 type: number
 *               lowStockAlert:
 *                 type: number
 *               HSN:
 *                 type: string
 *                 description: Optional HSN code
 *               GST:
 *                 type: string
 *                 description: Optional GST value
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/product', auth, upload, createProduct);

/**
 * @swagger
 * /product:
 *   get:
 *     summary: Get all products with pagination & filters (auth required)
 *     description: Retrieve products filtered by user/business/name. Requires authentication.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: businessId
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       400:
 *         description: Missing userId
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/product', auth, getAllProducts);

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Get a product by ID (auth required)
 *     description: Retrieve a specific product by its ID. Requires authentication.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/product/:id', auth, getProductById);

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: Update a product by ID (auth required)
 *     description: Update a product's details or image. HSN, GST, image optional. openingStock & lowStockAlert can be updated and must be >=0.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               primaryUnit:
 *                 type: string
 *               secondaryUnit:
 *                 type: string
 *               salePrice:
 *                 type: number
 *               purchasePrice:
 *                 type: number
 *               taxIncluded:
 *                 type: boolean
 *               openingStock:
 *                 type: number
 *               lowStockAlert:
 *                 type: number
 *               HSN:
 *                 type: string
 *               GST:
 *                 type: string
 *               note:
 *                 type: string
 *               businessId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.put('/product/:id', auth, upload, updateProduct);

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Delete a product by ID (auth required)
 *     description: Delete a product. Requires authentication.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete('/product/:id', auth, deleteProduct);

module.exports = router;