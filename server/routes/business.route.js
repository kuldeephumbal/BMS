const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const businessController = require('../controllers/business.controller');
const upload = require('../config/multer');

/**
 * @swagger
 * components:
 *   schemas:
 *     Business:
 *       type: object
 *       required:
 *         - user_id
 *         - business_name
 *       properties:
 *         user_id:
 *           type: string
 *           description: ID of the user who owns the business
 *           example: "507f1f77bcf86cd799439011"
 *         business_name:
 *           type: string
 *           description: Name of the business
 *           example: "ABC Corporation"
 *         logo_url:
 *           type: string
 *           description: URL of the business logo
 *           example: "/uploads/logos/logo123.png"
 *         address:
 *           type: string
 *           description: Business address
 *           example: "123 Business Street"
 *         city:
 *           type: string
 *           description: City where business is located
 *           example: "Mumbai"
 *         state:
 *           type: string
 *           description: State where business is located
 *           example: "Maharashtra"
 *         pin_code:
 *           type: string
 *           description: PIN code of the business location
 *           example: "400001"
 *         gst_number:
 *           type: string
 *           description: GST number of the business
 *           example: "27ABCDE1234F1Z5"
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the business is active
 *         is_deleted:
 *           type: boolean
 *           default: false
 *           description: Whether the business is deleted
 *     BusinessResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         business:
 *           $ref: '#/components/schemas/Business'
 *     BusinessListResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         businesses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Business'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Server error during business creation."
 */

/**
 * @swagger
 * /business/create:
 *   post:
 *     summary: Create a new business
 *     description: Create a new business for the authenticated user with optional logo upload
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - business_name
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: ID of the user who owns the business
 *                 example: "507f1f77bcf86cd799439011"
 *               business_name:
 *                 type: string
 *                 description: Name of the business
 *                 example: "ABC Corporation"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Business logo file (optional)
 *               address:
 *                 type: string
 *                 description: Business address
 *                 example: "123 Business Street"
 *               city:
 *                 type: string
 *                 description: City where business is located
 *                 example: "Mumbai"
 *               state:
 *                 type: string
 *                 description: State where business is located
 *                 example: "Maharashtra"
 *               pin_code:
 *                 type: string
 *                 description: PIN code of the business location
 *                 example: "400001"
 *               gst_number:
 *                 type: string
 *                 description: GST number of the business
 *                 example: "27ABCDE1234F1Z5"
 *     responses:
 *       200:
 *         description: Business created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessResponse'
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
router.post('/business/create', auth, upload.single('logo'), businessController.createBusiness);

/**
 * @swagger
 * /business/get/{user_id}:
 *   get:
 *     summary: Get businesses by user ID
 *     description: Retrieve all businesses for a specific user
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose businesses to retrieve
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Businesses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessListResponse'
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
router.get('/business/get/:user_id', auth, businessController.getBusinesses);

/**
 * @swagger
 * /business/update/{id}:
 *   put:
 *     summary: Update a business
 *     description: Update an existing business with optional logo upload
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the business to update
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               business_name:
 *                 type: string
 *                 description: Name of the business
 *                 example: "ABC Corporation Updated"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Business logo file (optional)
 *               address:
 *                 type: string
 *                 description: Business address
 *                 example: "456 Updated Business Street"
 *               city:
 *                 type: string
 *                 description: City where business is located
 *                 example: "Delhi"
 *               state:
 *                 type: string
 *                 description: State where business is located
 *                 example: "Delhi"
 *               pin_code:
 *                 type: string
 *                 description: PIN code of the business location
 *                 example: "110001"
 *               gst_number:
 *                 type: string
 *                 description: GST number of the business
 *                 example: "07ABCDE1234F1Z5"
 *     responses:
 *       200:
 *         description: Business updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Business not found
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
router.put('/business/update/:id', auth, upload.single('logo'), businessController.updateBusiness);

/**
 * @swagger
 * /business/delete/{id}:
 *   delete:
 *     summary: Delete a business
 *     description: Soft delete a business by setting is_deleted to true
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the business to delete
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Business deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Business not found
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
router.put('/business/activate/:id', auth, businessController.setActiveBusiness);
router.get('/business/active/:user_id', auth, businessController.getActiveBusiness);
router.delete('/business/delete/:id', auth, businessController.deleteBusiness);

module.exports = router;   