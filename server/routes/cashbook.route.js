const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createCashbook, getCashbooks, getCashbookById, updateCashbook, deleteCashbook } = require('../controllers/cashbook.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Cashbook:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         businessId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [in, out]
 *         amount:
 *           type: number
 *         method:
 *           type: string
 *           enum: [cash, online]
 *         note:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /cashbook:
 *   post:
 *     summary: Create a new cashbook entry (auth required)
 *     tags: [Cashbook]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - businessId
 *               - amount
 *               - type
 *               - method
 *             properties:
 *               userId:
 *                 type: string
 *               businessId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [in, out]
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [cash, online]
 *               note:
 *                 type: string
 *                 description: Optional note/description
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Optional; defaults to current date/time
 *     responses:
 *       201:
 *         description: Cashbook entry created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/cashbook', auth, createCashbook);

/**
 * @swagger
 * /cashbook:
 *   get:
 *     summary: Get cashbook entries with filters & pagination (auth required)
 *     tags: [Cashbook]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [in, out]
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [cash, online]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
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
 *         description: Cashbook entries retrieved successfully
 *       400:
 *         description: Missing userId
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/cashbook', auth, getCashbooks);

/**
 * @swagger
 * /cashbook/{id}:
 *   get:
 *     summary: Get a cashbook entry by ID (auth required)
 *     tags: [Cashbook]
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
 *         description: Cashbook entry retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entry not found
 *       500:
 *         description: Server error
 */
router.get('/cashbook/:id', auth, getCashbookById);

/**
 * @swagger
 * /cashbook/{id}:
 *   put:
 *     summary: Update a cashbook entry by ID (auth required)
 *     tags: [Cashbook]
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
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [in, out]
 *               method:
 *                 type: string
 *                 enum: [cash, online]
 *               note:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               businessId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cashbook entry updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entry not found
 *       500:
 *         description: Server error
 */
router.put('/cashbook/:id', auth, updateCashbook);

/**
 * @swagger
 * /cashbook/{id}:
 *   delete:
 *     summary: Delete a cashbook entry by ID (auth required)
 *     tags: [Cashbook]
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
 *         description: Cashbook entry deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entry not found
 *       500:
 *         description: Server error
 */
router.delete('/cashbook/:id', auth, deleteCashbook);

module.exports = router;
