const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../config/multer');
const { createService, getAllServices, getServiceById, updateService, deleteService } = require('../controllers/service.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         businessId:
 *           type: string
 *         name:
 *           type: string
 *         image:
 *           type: string
 *         price:
 *           type: number
 *         unit:
 *           type: string
 *         includeTax:
 *           type: boolean
 *         SACCode:
 *           type: string
 *         GST:
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
 * /service:
 *   post:
 *     summary: Create a new service (auth required)
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/service', auth, upload.single('image'), createService);

/**
 * @swagger
 * /service:
 *   get:
 *     summary: Get all services (auth required)
 *     tags: [Service]
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *       400:
 *         description: Missing userId
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/service', auth, getAllServices);

/**
 * @swagger
 * /service/{id}:
 *   get:
 *     summary: Get a service by ID (auth required)
 *     tags: [Service]
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
 *         description: Service retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.get('/service/:id', auth, getServiceById);

/**
 * @swagger
 * /service/{id}:
 *   put:
 *     summary: Update a service by ID (auth required)
 *     tags: [Service]
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
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.put('/service/:id', auth, upload.single('image'), updateService);

/**
 * @swagger
 * /service/{id}:
 *   delete:
 *     summary: Delete a service by ID (auth required)
 *     tags: [Service]
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
 *         description: Service deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.delete('/service/:id', auth, deleteService);

module.exports = router;
