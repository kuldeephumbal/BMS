const BillingTerms = require('../models/billingTerms.modal');

// Get terms for a specific business and bill type
module.exports.getTerms = async (req, res) => {
    try {
        const { businessId, type } = req.query;

        if (!businessId || !type) {
            return res.status(400).json({ message: 'businessId and type are required.' });
        }

        if (!['sale', 'purchase'].includes(type)) {
            return res.status(400).json({ message: "type must be 'sale' or 'purchase'." });
        }

        const termsDoc = await BillingTerms.findOne({ businessId, type });
        const activeTerms = termsDoc ? termsDoc.terms.filter(term => term.isActive) : [];

        return res.status(200).json({
            message: 'Terms retrieved successfully',
            terms: activeTerms
        });
    } catch (error) {
        console.error('Get terms error:', error);
        return res.status(500).json({ message: 'Server error retrieving terms.' });
    }
};

// Add a new term
module.exports.addTerm = async (req, res) => {
    try {
        const { businessId, type, text, userId } = req.body;

        if (!businessId || !type || !text || !userId) {
            return res.status(400).json({ message: 'businessId, type, text, and userId are required.' });
        }

        if (!['sale', 'purchase'].includes(type)) {
            return res.status(400).json({ message: "type must be 'sale' or 'purchase'." });
        }

        const trimmedText = text.trim();
        if (!trimmedText) {
            return res.status(400).json({ message: 'Term text cannot be empty.' });
        }

        // Find or create terms document for this business and type
        let termsDoc = await BillingTerms.findOne({ businessId, type });

        if (!termsDoc) {
            termsDoc = new BillingTerms({
                businessId,
                type,
                terms: [],
                createdBy: userId
            });
        }

        // Check if term already exists (case-insensitive)
        const existingTerm = termsDoc.terms.find(
            term => term.text.toLowerCase() === trimmedText.toLowerCase() && term.isActive
        );

        if (existingTerm) {
            return res.status(400).json({ message: 'This term already exists.' });
        }

        // Add new term
        termsDoc.terms.push({
            text: trimmedText,
            isActive: true
        });

        await termsDoc.save();

        return res.status(201).json({
            message: 'Term added successfully',
            term: { text: trimmedText, isActive: true }
        });
    } catch (error) {
        console.error('Add term error:', error);
        return res.status(500).json({ message: 'Server error adding term.' });
    }
};

// Toggle term active status
module.exports.toggleTerm = async (req, res) => {
    try {
        const { businessId, type, termId } = req.body;

        if (!businessId || !type || !termId) {
            return res.status(400).json({ message: 'businessId, type, and termId are required.' });
        }

        const termsDoc = await BillingTerms.findOne({ businessId, type });
        if (!termsDoc) {
            return res.status(404).json({ message: 'Terms document not found.' });
        }

        const term = termsDoc.terms.id(termId);
        if (!term) {
            return res.status(404).json({ message: 'Term not found.' });
        }

        term.isActive = !term.isActive;
        await termsDoc.save();

        return res.status(200).json({
            message: 'Term status updated successfully',
            term: { text: term.text, isActive: term.isActive }
        });
    } catch (error) {
        console.error('Toggle term error:', error);
        return res.status(500).json({ message: 'Server error updating term.' });
    }
};

// Update term text
module.exports.updateTerm = async (req, res) => {
    try {
        const { businessId, type, termId, text } = req.body;

        if (!businessId || !type || !termId || !text) {
            return res.status(400).json({ message: 'businessId, type, termId, and text are required.' });
        }

        const trimmedText = text.trim();
        if (!trimmedText) {
            return res.status(400).json({ message: 'Term text cannot be empty.' });
        }

        const termsDoc = await BillingTerms.findOne({ businessId, type });
        if (!termsDoc) {
            return res.status(404).json({ message: 'Terms document not found.' });
        }

        const term = termsDoc.terms.id(termId);
        if (!term) {
            return res.status(404).json({ message: 'Term not found.' });
        }

        // Check if updated text already exists (case-insensitive, excluding current term)
        const existingTerm = termsDoc.terms.find(
            t => t._id.toString() !== termId &&
                t.text.toLowerCase() === trimmedText.toLowerCase() &&
                t.isActive
        );

        if (existingTerm) {
            return res.status(400).json({ message: 'This term already exists.' });
        }

        term.text = trimmedText;
        await termsDoc.save();

        return res.status(200).json({
            message: 'Term updated successfully',
            term: { text: term.text, isActive: term.isActive }
        });
    } catch (error) {
        console.error('Update term error:', error);
        return res.status(500).json({ message: 'Server error updating term.' });
    }
};
