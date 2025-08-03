const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Staff:
 *       type: object
 *       required:
 *         - first_name
 *         - last_name
 *         - email
 *         - phone
 *         - password
 *         - user_id
 *       properties:
 *         first_name:
 *           type: string
 *           description: Staff's first name
 *           example: "John"
 *         last_name:
 *           type: string
 *           description: Staff's last name
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Staff's email address
 *           example: "john.doe@company.com"
 *         phone:
 *           type: string
 *           description: Staff's phone number
 *           example: "9876543210"
 *         password:
 *           type: string
 *           description: Staff's password
 *           example: "password123"
 *         user_id:
 *           type: string
 *           description: ID of the user who owns this staff member
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         role:
 *           type: string
 *           enum: [staff]
 *           default: staff
 *           description: Staff role
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the staff account is active
 *         is_deleted:
 *           type: boolean
 *           default: false
 *           description: Whether the staff account is deleted
 *     StaffLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Staff's email address
 *           example: "john.doe@company.com"
 *         password:
 *           type: string
 *           description: Staff's password
 *           example: "password123"
 *     StaffLoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Login successful"
 *         token:
 *           type: string
 *           description: JWT token for authentication
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         staff:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *             first_name:
 *               type: string
 *               example: "John"
 *             last_name:
 *               type: string
 *               example: "Doe"
 *             email:
 *               type: string
 *               example: "john.doe@company.com"
 *             phone:
 *               type: string
 *               example: "9876543210"
 *             role:
 *               type: string
 *               example: "staff"
 *             user_id:
 *               type: string
 *               example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     StaffResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Staff retrieved successfully"
 *         staff:
 *           $ref: '#/components/schemas/Staff'
 *     StaffListResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Staff retrieved successfully"
 *         count:
 *           type: number
 *           example: 5
 *         staff:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Staff'
 *     StaffUpdateRequest:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *           description: Staff's first name
 *           example: "John Updated"
 *         last_name:
 *           type: string
 *           description: Staff's last name
 *           example: "Doe Updated"
 *         email:
 *           type: string
 *           format: email
 *           description: Staff's email address
 *           example: "john.updated@company.com"
 *         phone:
 *           type: string
 *           description: Staff's phone number
 *           example: "9876543211"
 *         password:
 *           type: string
 *           description: New password (optional)
 *           example: "newpassword123"
 *         is_active:
 *           type: boolean
 *           description: Whether the staff account is active
 *           example: true
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "All fields are required."
 */

/**
 * @swagger
 * /staff/register:
 *   post:
 *     summary: Register a new staff member
 *     description: Create a new staff account with the provided information
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Staff'
 *           example:
 *             first_name: "John"
 *             last_name: "Doe"
 *             email: "john.doe@company.com"
 *             phone: "9876543210"
 *             password: "password123"
 *             user_id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       201:
 *         description: Staff registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Staff registered successfully."
 *                 staff:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                     is_active:
 *                       type: boolean
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "All fields are required."
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "User not found."
 *       409:
 *         description: Conflict - Staff already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Staff with this email already exists."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/staff/register', staffController.registerStaff);

/**
 * @swagger
 * /staff/login:
 *   post:
 *     summary: Staff login
 *     description: Authenticate staff and return JWT token
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffLogin'
 *           example:
 *             email: "john.doe@company.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffLoginResponse'
 *       400:
 *         description: Bad request - Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Email and password are required."
 *       401:
 *         description: Unauthorized - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Invalid email or password."
 *       403:
 *         description: Forbidden - Account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Account is deactivated. Please contact administrator."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/staff/login', staffController.loginStaff);

/**
 * @swagger
 * /staff/profile:
 *   get:
 *     summary: Get staff profile
 *     description: Get the profile of the authenticated staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffResponse'
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Staff not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/staff/profile', auth, staffController.getStaffProfile);

/**
 * @swagger
 * /staff/profile:
 *   put:
 *     summary: Update staff profile
 *     description: Update the profile of the authenticated staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffUpdateRequest'
 *           example:
 *             first_name: "John Updated"
 *             last_name: "Doe Updated"
 *             email: "john.updated@company.com"
 *             phone: "9876543211"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffResponse'
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Staff not found."
 *       409:
 *         description: Conflict - Email or phone already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Email already exists."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/staff/profile', auth, staffController.updateStaffProfile);

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: Get all staff members
 *     description: Get all staff members for a specific user
 *     tags: [Staff]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose staff to retrieve
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffListResponse'
 *       400:
 *         description: Bad request - Missing user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "User ID is required."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/staff', staffController.getAllStaff);

/**
 * @swagger
 * /staff/{id}:
 *   get:
 *     summary: Get staff by ID
 *     description: Get a specific staff member by their ID
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffResponse'
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Staff not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/staff/:id', staffController.getStaffById);

/**
 * @swagger
 * /staff/{id}:
 *   put:
 *     summary: Update staff by ID
 *     description: Update a specific staff member by their ID
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffUpdateRequest'
 *           example:
 *             first_name: "John Updated"
 *             last_name: "Doe Updated"
 *             email: "john.updated@company.com"
 *             phone: "9876543211"
 *             is_active: true
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffResponse'
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Staff not found."
 *       409:
 *         description: Conflict - Email or phone already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Email already exists."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/staff/:id', staffController.updateStaff);

/**
 * @swagger
 * /staff/{id}:
 *   delete:
 *     summary: Delete staff by ID
 *     description: Soft delete a specific staff member by their ID
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Staff deleted successfully"
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Staff not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/staff/:id', staffController.deleteStaff);

/**
 * @swagger
 * /staff/{id}/toggle-status:
 *   patch:
 *     summary: Toggle staff status
 *     description: Toggle the active status of a specific staff member
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Staff status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Staff activated successfully"
 *                 staff:
 *                   $ref: '#/components/schemas/Staff'
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Staff not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/staff/:id/toggle-status', staffController.toggleStaffStatus);

module.exports = router;
