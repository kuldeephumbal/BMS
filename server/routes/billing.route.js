const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createBilling, getBillings, getBillingById, updateBilling, deleteBilling, getNextBillNumber } = require('../controllers/billing.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     BillingProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         quantity:
 *           type: number
 *         price:
 *           type: number
 *     BillingDiscount:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [percentage, amount]
 *         value:
 *           type: number
 *     BillingCharge:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         amount:
 *           type: number
 *     BillingOptionalFields:
 *       type: object
 *       properties:
 *         customFields:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               fieldName:
 *                 type: string
 *               fieldValue:
 *                 type: string
 *         partyAddress:
 *           type: object
 *           properties:
 *             address: { type: string }
 *             pincode: { type: string }
 *             city: { type: string }
 *             state: { type: string }
 *         shippingAddress:
 *           type: object
 *           properties:
 *             address: { type: string }
 *             pincode: { type: string }
 *             city: { type: string }
 *             state: { type: string }
 *         businessAddress:
 *           type: object
 *           properties:
 *             address: { type: string }
 *             pincode: { type: string }
 *             city: { type: string }
 *             state: { type: string }
 *         termsAndConditions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               terms: { type: string }
 *     Billing:
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
 *           enum: [sale, purchase]
 *         billNumber:
 *           type: number
 *         date:
 *           type: string
 *           format: date-time
 *         parties:
 *           type: object
 *           properties:
 *             id: { type: string }
 *             name: { type: string }
 *             phone: { type: string }
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BillingProduct'
 *         additionalCharges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BillingCharge'
 *         discount:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BillingDiscount'
 *         optionalFields:
 *           $ref: '#/components/schemas/BillingOptionalFields'
 *         note:
 *           type: string
 *         photos:
 *           type: array
 *           items: { type: string }
 *         method:
 *           type: string
 *           enum: [unpaid, cash, online]
 *         dueDate:
 *           type: string
 *           format: date-time
 *         balanceDue:
 *           type: number
 *         balance:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /billing:
 *   post:
 *     summary: Create a billing (auth required)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Billing'
 *     responses:
 *       201: { description: Billing created successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.post('/billing', auth, createBilling);

/**
 * @swagger
 * /billing:
 *   get:
 *     summary: Get billings with filters (auth required)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: businessId
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [sale, purchase] }
 *       - in: query
 *         name: method
 *         schema: { type: string, enum: [unpaid, cash, online] }
 *       - in: query
 *         name: billNumber
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         description: Search by party name or phone
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Billings retrieved successfully }
 *       400: { description: Missing userId }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.get('/billing', auth, getBillings);

/**
 * @swagger
 * /billing/next-number:
 *   get:
 *     summary: Get next bill number for preview
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sale, purchase]
 *     responses:
 *       200:
 *         description: Next bill number retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nextNumber:
 *                   type: number
 *       400: { description: Bad request }
 *       500: { description: Server error }
 */
router.get('/billing/next-number', auth, getNextBillNumber);

/**
 * @swagger
 * /billing/{id}:
 *   get:
 *     summary: Get a billing by ID (auth required)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Billing retrieved successfully }
 *       401: { description: Unauthorized }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
router.get('/billing/:id', auth, getBillingById);

/**
 * @swagger
 * /billing/{id}:
 *   put:
 *     summary: Update a billing by ID (auth required)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Billing'
 *     responses:
 *       200: { description: Billing updated successfully }
 *       401: { description: Unauthorized }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
router.put('/billing/:id', auth, updateBilling);

/**
 * @swagger
 * /billing/{id}:
 *   delete:
 *     summary: Delete a billing by ID (auth required)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Billing deleted successfully }
 *       401: { description: Unauthorized }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
/**
 * @swagger
 * /api/billing/{id}:
 *   delete:
 *     summary: Delete a billing record
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: Billing deleted successfully }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
router.delete('/billing/:id', auth, deleteBilling);

module.exports = router;

