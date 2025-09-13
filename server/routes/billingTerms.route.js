const express = require('express');
const router = express.Router();
const billingTermsController = require('../controllers/billingTerms.controller');
const auth = require('../middleware/auth');

// Get terms for a business and bill type
router.get('/billing-terms', auth, billingTermsController.getTerms);

// Add a new term
router.post('/billing-terms', auth, billingTermsController.addTerm);

// Toggle term active status
router.patch('/billing-terms/toggle', auth, billingTermsController.toggleTerm);

// Update term text
router.put('/billing-terms', auth, billingTermsController.updateTerm);

module.exports = router;
