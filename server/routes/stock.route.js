const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createStockRecord, getStockRecords, getStockRecordById, updateStockRecord, deleteStockRecord } = require('../controllers/stock.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Stock:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         productId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [IN, OUT]
 *         quantity:
 *           type: number
 *         purchasePrice:
 *           type: number
 *         date:
 *           type: string
 *           format: date-time
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
 * /stock:
 *   post:
 *     summary: Create a stock record (IN / OUT) and adjust product stock (auth required)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, type, quantity, purchasePrice]
 *             properties:
 *               productId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [IN, OUT]
 *               quantity:
 *                 type: number
 *               purchasePrice:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stock record created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/stock', auth, createStockRecord);

/**
 * @swagger
 * /stock:
 *   get:
 *     summary: Get stock records with filters (auth required)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [IN, OUT]
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Stock records retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stock', auth, getStockRecords);

/**
 * @swagger
 * /stock/{id}:
 *   get:
 *     summary: Get a stock record by ID (auth required)
 *     tags: [Stock]
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
 *         description: Stock record retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stock record not found
 *       500:
 *         description: Server error
 */
router.get('/stock/:id', auth, getStockRecordById);

/**
 * @swagger
 * /stock/{id}:
 *   put:
 *     summary: Update a stock record (auth required)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [IN, OUT]
 *               quantity:
 *                 type: number
 *               purchasePrice:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock record updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stock record not found
 *       500:
 *         description: Server error
 */
router.put('/stock/:id', auth, updateStockRecord);

/**
 * @swagger
 * /stock/{id}:
 *   delete:
 *     summary: Delete a stock record (auth required)
 *     tags: [Stock]
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
 *         description: Stock record deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stock record not found
 *       500:
 *         description: Server error
 */
router.delete('/stock/:id', auth, deleteStockRecord);

module.exports = router;
