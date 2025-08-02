const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const transactionController = require('../controllers/transaction.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - userId
 *         - businessId
 *         - partyId
 *         - type
 *         - amount
 *         - paymentMethod
 *         - status
 *         - date
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user who created the transaction
 *         businessId:
 *           type: string
 *           description: ID of the business
 *         partyId:
 *           type: string
 *           description: ID of the party (customer/supplier)
 *         type:
 *           type: string
 *           enum: [gave, got]
 *           description: Transaction type - gave (money given) or got (money received)
 *         amount:
 *           type: number
 *           description: Transaction amount
 *           minimum: 0
 *         paymentMethod:
 *           type: string
 *           enum: [cash, online, cheque, other]
 *           description: Payment method used

 *         notes:
 *           type: string
 *           description: Additional notes about the transaction
 *         date:
 *           type: string
 *           format: date
 *           description: Transaction date
 *     TransactionResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         transaction:
 *           $ref: '#/components/schemas/Transaction'
 *     TransactionListResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         transactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Transaction'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalItems:
 *               type: integer
 *             itemsPerPage:
 *               type: integer
 *     TransactionStatsResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         stats:
 *           type: object
 *           properties:
 *             totalTransactions:
 *               type: integer
 *             totalAmount:
 *               type: number
 *             gaveAmount:
 *               type: number
 *             gotAmount:
 *               type: number
 *             netAmount:
 *               type: number

 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /transaction/create:
 *   post:
 *     summary: Create a new transaction
 *     description: Create a new transaction for a party (customer or supplier)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         description: Bad request - Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/transaction/create', auth, transactionController.createTransaction);

/**
 * @swagger
 * /transaction/get:
 *   get:
 *     summary: Get transactions for a business
 *     description: Retrieve all transactions for a specific business with pagination, search, and filters
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the business
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search term for notes, payment method, or status
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [gave, got]
 *         description: Filter by transaction type

 *       - in: query
 *         name: paymentMethod
 *         required: false
 *         schema:
 *           type: string
 *           enum: [cash, online, cheque, other]
 *         description: Filter by payment method
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionListResponse'
 *       400:
 *         description: Bad request - Missing businessId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/transaction/get', auth, transactionController.getTransactions);

/**
 * @swagger
 * /transaction/get/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     description: Retrieve a specific transaction by its ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the transaction to retrieve
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/transaction/get/:id', auth, transactionController.getTransactionById);

/**
 * @swagger
 * /transaction/update/{id}:
 *   put:
 *     summary: Update a transaction
 *     description: Update an existing transaction's information
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the transaction to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [gave, got]
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, online, cheque, other]

 *               notes:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         description: Bad request - Invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/transaction/update/:id', auth, transactionController.updateTransaction);

/**
 * @swagger
 * /transaction/delete/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     description: Delete a transaction by its ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the transaction to delete
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/transaction/delete/:id', auth, transactionController.deleteTransaction);

/**
 * @swagger
 * /transaction/stats:
 *   get:
 *     summary: Get transaction statistics
 *     description: Retrieve statistics about transactions for a business
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the business
 *     responses:
 *       200:
 *         description: Transaction statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionStatsResponse'
 *       400:
 *         description: Bad request - Missing businessId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/transaction/stats', auth, transactionController.getTransactionStats);

/**
 * @swagger
 * /transaction/party/{partyId}:
 *   get:
 *     summary: Get transactions by party
 *     description: Retrieve all transactions for a specific party (customer or supplier)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the party
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Party transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionListResponse'
 *       400:
 *         description: Bad request - Missing partyId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/transaction/party', auth, transactionController.getTransactionsByParty);

module.exports = router;
