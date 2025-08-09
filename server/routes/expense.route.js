const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Expense:
 *       type: object
 *       required:
 *         - userId
 *         - category
 *         - amount
 *         - note
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user who owns this expense
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         category:
 *           type: string
 *           description: ID of the expense category
 *           example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *         amount:
 *           type: number
 *           description: Expense amount (must be greater than 0)
 *           example: 150.50
 *         note:
 *           type: string
 *           description: Description or note about the expense
 *           example: "Lunch at restaurant"
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the expense
 *           example: "2025-08-06T10:30:00.000Z"
 *     ExpenseResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Expense retrieved successfully"
 *         expense:
 *           $ref: '#/components/schemas/Expense'
 *     ExpenseListResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Expenses retrieved successfully"
 *         count:
 *           type: number
 *           example: 10
 *         totalExpenses:
 *           type: number
 *           example: 25
 *         totalAmount:
 *           type: number
 *           example: 1250.75
 *         currentPage:
 *           type: number
 *           example: 1
 *         totalPages:
 *           type: number
 *           example: 3
 *         expenses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Expense'
 *     ExpenseCreateRequest:
 *       type: object
 *       required:
 *         - userId
 *         - category
 *         - amount
 *         - note
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user who owns this expense
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         category:
 *           type: string
 *           description: ID of the expense category
 *           example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *         amount:
 *           type: number
 *           description: Expense amount (must be greater than 0)
 *           example: 150.50
 *         note:
 *           type: string
 *           description: Description or note about the expense
 *           example: "Lunch at restaurant"
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the expense (optional, defaults to current date)
 *           example: "2025-08-06T10:30:00.000Z"
 *     ExpenseUpdateRequest:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           description: ID of the expense category
 *           example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *         amount:
 *           type: number
 *           description: Expense amount (must be greater than 0)
 *           example: 175.25
 *         note:
 *           type: string
 *           description: Description or note about the expense
 *           example: "Updated lunch expense"
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the expense
 *           example: "2025-08-06T11:00:00.000Z"
 *     ExpenseStatsResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Expense statistics retrieved successfully"
 *         categoryStats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
 *                 example: "Food & Dining"
 *               totalAmount:
 *                 type: number
 *                 example: 450.75
 *               count:
 *                 type: number
 *                 example: 8
 *               avgAmount:
 *                 type: number
 *                 example: 56.34
 *         totalStats:
 *           type: object
 *           properties:
 *             totalAmount:
 *               type: number
 *               example: 1250.75
 *             totalCount:
 *               type: number
 *               example: 25
 *             avgAmount:
 *               type: number
 *               example: 50.03
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Expense not found."
 */

/**
 * @swagger
 * /expense:
 *   post:
 *     summary: Create a new expense
 *     description: Create a new expense record (requires authentication)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpenseCreateRequest'
 *           example:
 *             userId: "60f7b3b3b3b3b3b3b3b3b3b3"
 *             category: "60f7b3b3b3b3b3b3b3b3b3b4"
 *             amount: 150.50
 *             note: "Lunch at restaurant"
 *             date: "2025-08-06T10:30:00.000Z"
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Expense created successfully."
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Bad request - Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 value:
 *                   message: "User ID, category, amount, and note are required."
 *               invalidAmount:
 *                 value:
 *                   message: "Amount must be greater than zero."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied. No token provided."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/expense', auth, expenseController.createExpense);

/**
 * @swagger
 * /expense:
 *   get:
 *     summary: Get all expenses
 *     description: Get all expenses with pagination and filtering options (requires authentication)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose expenses to retrieve
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter expenses from this date (YYYY-MM-DD)
 *         example: "2025-08-01"
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter expenses until this date (YYYY-MM-DD)
 *         example: "2025-08-31"
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Expenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExpenseListResponse'
 *       400:
 *         description: Bad request - Missing user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "User ID is required."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied. No token provided."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/expense', auth, expenseController.getAllExpenses);

/**
 * @swagger
 * /expense/stats:
 *   get:
 *     summary: Get expense statistics
 *     description: Get expense statistics by category and overall totals (requires authentication)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose expense statistics to retrieve
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter statistics from this date (YYYY-MM-DD)
 *         example: "2025-08-01"
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter statistics until this date (YYYY-MM-DD)
 *         example: "2025-08-31"
 *     responses:
 *       200:
 *         description: Expense statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExpenseStatsResponse'
 *       400:
 *         description: Bad request - Missing user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "User ID is required."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied. No token provided."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/expense/stats', auth, expenseController.getExpenseStats);

/**
 * @swagger
 * /expense/{id}:
 *   get:
 *     summary: Get expense by ID
 *     description: Get a specific expense by its ID (requires authentication)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Expense retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExpenseResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied. No token provided."
 *       404:
 *         description: Expense not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Expense not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/expense/:id', auth, expenseController.getExpenseById);

/**
 * @swagger
 * /expense/{id}:
 *   put:
 *     summary: Update expense
 *     description: Update a specific expense by its ID (requires authentication)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpenseUpdateRequest'
 *           example:
 *             category: "60f7b3b3b3b3b3b3b3b3b3b4"
 *             amount: 175.25
 *             note: "Updated lunch expense"
 *             date: "2025-08-06T11:00:00.000Z"
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExpenseResponse'
 *       400:
 *         description: Bad request - Invalid data or no fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noFields:
 *                 value:
 *                   message: "At least one field is required for update."
 *               invalidAmount:
 *                 value:
 *                   message: "Amount must be greater than zero."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied. No token provided."
 *       404:
 *         description: Expense not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Expense not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/expense/:id', auth, expenseController.updateExpense);

/**
 * @swagger
 * /expense/{id}:
 *   delete:
 *     summary: Delete expense
 *     description: Delete a specific expense by its ID (requires authentication)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Expense deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied. No token provided."
 *       404:
 *         description: Expense not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Expense not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/expense/:id', auth, expenseController.deleteExpense);

module.exports = router;
