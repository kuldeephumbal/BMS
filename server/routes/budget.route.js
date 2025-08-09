const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budget.controller');
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
 *     Budget:
 *       type: object
 *       required:
 *         - userId
 *         - category
 *         - amount
 *         - note
 *         - month
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user who owns this budget
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         category:
 *           type: string
 *           description: ID of the budget category
 *           example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *         amount:
 *           type: number
 *           description: Budget amount (must be greater than 0)
 *           example: 10000.50
 *         note:
 *           type: string
 *           description: Description or note about the budget
 *           example: "Monthly office supplies budget"
 *         month:
 *           type: string
 *           description: Budget month in YYYY-MM format
 *           example: "2025-08"
 *     BudgetResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Budget retrieved successfully"
 *         budget:
 *           $ref: '#/components/schemas/Budget'
 *     BudgetListResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Budgets retrieved successfully"
 *         count:
 *           type: number
 *           example: 10
 *         totalBudgets:
 *           type: number
 *           example: 25
 *         totalAmount:
 *           type: number
 *           example: 125000.75
 *         currentPage:
 *           type: number
 *           example: 1
 *         totalPages:
 *           type: number
 *           example: 3
 *         budgets:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Budget'
 *     BudgetCreateRequest:
 *       type: object
 *       required:
 *         - userId
 *         - category
 *         - amount
 *         - note
 *         - month
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user who owns this budget
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         category:
 *           type: string
 *           description: ID of the budget category
 *           example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *         amount:
 *           type: number
 *           description: Budget amount (must be greater than 0)
 *           example: 10000.50
 *         note:
 *           type: string
 *           description: Description or note about the budget
 *           example: "Monthly office supplies budget"
 *         month:
 *           type: string
 *           description: Budget month in YYYY-MM format
 *           example: "2025-08"
 *     BudgetUpdateRequest:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           description: ID of the budget category
 *           example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *         amount:
 *           type: number
 *           description: Budget amount (must be greater than 0)
 *           example: 12000.25
 *         note:
 *           type: string
 *           description: Description or note about the budget
 *           example: "Updated monthly budget"
 *         month:
 *           type: string
 *           description: Budget month in YYYY-MM format
 *           example: "2025-09"
 *     BudgetStatsResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Budget statistics retrieved successfully"
 *         categoryStats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
 *                 example: "Office Supplies"
 *               totalAmount:
 *                 type: number
 *                 example: 45000.75
 *               count:
 *                 type: number
 *                 example: 8
 *               avgAmount:
 *                 type: number
 *                 example: 5625.09
 *               months:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["2025-08", "2025-07", "2025-06"]
 *         totalStats:
 *           type: object
 *           properties:
 *             totalAmount:
 *               type: number
 *               example: 125000.75
 *             totalCount:
 *               type: number
 *               example: 25
 *             avgAmount:
 *               type: number
 *               example: 5000.03
 *             categoriesCount:
 *               type: number
 *               example: 8
 *             monthsCount:
 *               type: number
 *               example: 6
 *     MonthlyComparisonResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Monthly budget comparison retrieved successfully"
 *         monthlyStats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 example: "2025-08"
 *               totalAmount:
 *                 type: number
 *                 example: 25000.00
 *               count:
 *                 type: number
 *                 example: 5
 *               avgAmount:
 *                 type: number
 *                 example: 5000.00
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Budget not found."
 */

/**
 * @swagger
 * /budget:
 *   post:
 *     summary: Create a new budget
 *     description: Create a new budget record (requires authentication)
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BudgetCreateRequest'
 *           example:
 *             userId: "60f7b3b3b3b3b3b3b3b3b3b3"
 *             category: "60f7b3b3b3b3b3b3b3b3b3b4"
 *             amount: 10000.50
 *             note: "Monthly office supplies budget"
 *             month: "2025-08"
 *     responses:
 *       201:
 *         description: Budget created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Budget created successfully."
 *                 budget:
 *                   $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Bad request - Missing required fields, invalid data, or budget already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 value:
 *                   message: "User ID, category, amount, note, and month are required."
 *               invalidAmount:
 *                 value:
 *                   message: "Amount must be greater than zero."
 *               budgetExists:
 *                 value:
 *                   message: "Budget already exists for this category and month."
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
router.post('/budget', auth, budgetController.createBudget);

/**
 * @swagger
 * /budget:
 *   get:
 *     summary: Get all budgets
 *     description: Get all budgets with pagination and filtering options (requires authentication)
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose budgets to retrieve
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by month (YYYY-MM format)
 *         example: "2025-08"
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
 *         description: Budgets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetListResponse'
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
router.get('/budget', auth, budgetController.getAllBudgets);

/**
 * @swagger
 * /budget/stats:
 *   get:
 *     summary: Get budget statistics
 *     description: Get budget statistics by category and overall totals (requires authentication)
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose budget statistics to retrieve
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter statistics by month (YYYY-MM format)
 *         example: "2025-08"
 *     responses:
 *       200:
 *         description: Budget statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetStatsResponse'
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
router.get('/budget/stats', auth, budgetController.getBudgetStats);

/**
 * @swagger
 * /budget/monthly-comparison:
 *   get:
 *     summary: Get monthly budget comparison
 *     description: Get budget comparison across different months (requires authentication)
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose budget comparison to retrieve
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *       - in: query
 *         name: startMonth
 *         required: false
 *         schema:
 *           type: string
 *         description: Start month for comparison (YYYY-MM format)
 *         example: "2025-06"
 *       - in: query
 *         name: endMonth
 *         required: false
 *         schema:
 *           type: string
 *         description: End month for comparison (YYYY-MM format)
 *         example: "2025-08"
 *     responses:
 *       200:
 *         description: Monthly budget comparison retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonthlyComparisonResponse'
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
router.get('/budget/monthly-comparison', auth, budgetController.getMonthlyComparison);

/**
 * @swagger
 * /budget/{id}:
 *   get:
 *     summary: Get budget by ID
 *     description: Get a specific budget by its ID (requires authentication)
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Budget retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied. No token provided."
 *       404:
 *         description: Budget not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Budget not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/budget/:id', auth, budgetController.getBudgetById);

/**
 * @swagger
 * /budget/{id}:
 *   put:
 *     summary: Update budget
 *     description: Update an existing budget (requires authentication)
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BudgetUpdateRequest'
 *           example:
 *             category: "60f7b3b3b3b3b3b3b3b3b3b4"
 *             amount: 12000.25
 *             note: "Updated monthly budget"
 *             month: "2025-09"
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Budget updated successfully"
 *                 budget:
 *                   $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Bad request - Missing fields, invalid data, or budget already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 value:
 *                   message: "At least one field is required for update."
 *               invalidAmount:
 *                 value:
 *                   message: "Amount must be greater than zero."
 *               budgetExists:
 *                 value:
 *                   message: "Budget already exists for this category and month."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied. No token provided."
 *       404:
 *         description: Budget not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Budget not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/budget/:id', auth, budgetController.updateBudget);

/**
 * @swagger
 * /budget/{id}:
 *   delete:
 *     summary: Delete budget
 *     description: Delete an existing budget (requires authentication)
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Budget deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Budget deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied. No token provided."
 *       404:
 *         description: Budget not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Budget not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/budget/:id', auth, budgetController.deleteBudget);

module.exports = router;
