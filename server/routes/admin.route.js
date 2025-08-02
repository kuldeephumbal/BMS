const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - phone
 *       properties:
 *         name:
 *           type: string
 *           description: Full name of the admin
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the admin
 *           example: "admin@example.com"
 *         password:
 *           type: string
 *           description: Password for the admin account
 *           example: "securePassword123"
 *         phone:
 *           type: string
 *           description: Phone number of the admin
 *           example: "+1234567890"
 *         role:
 *           type: string
 *           enum: [admin]
 *           default: admin
 *           description: Role of the user
 *         is_deleted:
 *           type: boolean
 *           default: false
 *           description: Soft delete flag
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     AdminResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         admin:
 *           $ref: '#/components/schemas/Admin'
 *     AdminListResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         admins:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Admin'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Server error during admin registration."
 */

/**
 * @swagger
 * /admin/register:
 *   post:
 *     summary: Register a new admin
 *     description: Create a new admin account with the provided details
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Admin'
 *           example:
 *             name: "John Doe"
 *             email: "admin@example.com"
 *             password: "securePassword123"
 *             phone: "+1234567890"
 *     responses:
 *       200:
 *         description: Admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminResponse'
 *             example:
 *               message: "Admin registered successfully"
 *       400:
 *         description: Bad request - Admin already exists or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Admin already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Server error during registration"
 */
router.post('/admin/register', adminController.registerAdmin);

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate admin with email and password to receive JWT token
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *           example:
 *             email: "admin@example.com"
 *             password: "securePassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               message: "Login successful"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1NzM5NzQ5NzQ5NzQ5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzAyMjQ5NzQ5LCJleHAiOjE3MDIzMzYxNDl9.example"
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Email and password are required"
 *       401:
 *         description: Unauthorized - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Invalid email or password"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Server error during login"
 */
router.post('/admin/login', adminController.loginAdmin);

module.exports = router;
