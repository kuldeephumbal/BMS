const Parties = require('../models/parties.modal');
const mongoose = require('mongoose');

// Create a new party (customer or supplier)
module.exports.createParty = async (req, res) => {
    try {
        const {
            user_id,
            business_id,
            type, // 'customer' or 'supplier'
            name,
            email,
            phone,
            address,
            gst_number,
            state,
            city,
            pin_code,
            notes
        } = req.body;

        if (!user_id || !business_id || !type || !name || !phone) {
            return res.status(400).json({ message: 'User ID, Business ID, Type, Name, and Phone are required.' });
        }
        if (!['customer', 'supplier'].includes(type)) {
            return res.status(400).json({ message: 'Type must be either customer or supplier.' });
        }
        // Uniqueness check for phone (only within the same type)
        const existingByPhone = await Parties.findOne({
            business_id,
            type,
            phone,
            is_deleted: false
        });
        if (existingByPhone) {
            return res.status(409).json({ message: `A ${type} with this phone already exists for this business.` });
        }
        // Uniqueness check for email (if provided, only within the same type)
        if (email) {
            const existingByEmail = await Parties.findOne({
                business_id,
                type,
                email,
                is_deleted: false
            });
            if (existingByEmail) {
                return res.status(409).json({ message: `A ${type} with this email already exists for this business.` });
            }
        }
        const newParty = await Parties.create({
            user_id,
            business_id,
            type,
            name,
            email,
            phone,
            address,
            gst_number,
            state,
            city,
            pin_code,
            notes
        });
        res.status(201).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully.`, party: newParty });
    } catch (error) {
        res.status(500).json({ message: 'Server error during party creation.' });
        console.log(error);
    }
};

// Get all parties for a business/type (with pagination and search)
module.exports.getParties = async (req, res) => {
    try {
        const { business_id, type, page = 1, limit = 10, search = '' } = req.query;
        if (!business_id || !type) {
            return res.status(400).json({ message: 'Business ID and type are required.' });
        }
        const query = {
            business_id,
            type,
            is_deleted: false
        };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { gst_number: { $regex: search, $options: 'i' } },
                { state: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { pin_code: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parties = await Parties.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        const total = await Parties.countDocuments(query);
        res.status(200).json({
            message: `${type.charAt(0).toUpperCase() + type.slice(1)}s retrieved successfully.`,
            parties,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during parties retrieval.' });
    }
};

// Get a single party by ID
module.exports.getPartyById = async (req, res) => {
    try {
        const { id } = req.params;
        const party = await Parties.findOne({ _id: id, is_deleted: false });
        if (!party) {
            return res.status(404).json({ message: 'Party not found.' });
        }
        res.status(200).json({ message: 'Party retrieved successfully.', party });
    } catch (error) {
        res.status(500).json({ message: 'Server error during party retrieval.' });
    }
};

// Update a party
module.exports.updateParty = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            email,
            phone,
            address,
            gst_number,
            state,
            city,
            pin_code,
            notes
        } = req.body;
        const existingParty = await Parties.findOne({ _id: id, is_deleted: false });
        if (!existingParty) {
            return res.status(404).json({ message: 'Party not found.' });
        }
        // Uniqueness check for phone (only within the same type)
        const phoneExists = await Parties.findOne({
            business_id: existingParty.business_id,
            type: existingParty.type,
            phone,
            _id: { $ne: id },
            is_deleted: false
        });
        if (phoneExists) {
            return res.status(409).json({ message: `A ${existingParty.type} with this phone already exists for this business.` });
        }
        // Uniqueness check for email (if provided, only within the same type)
        if (email) {
            const emailExists = await Parties.findOne({
                business_id: existingParty.business_id,
                type: existingParty.type,
                email,
                _id: { $ne: id },
                is_deleted: false
            });
            if (emailExists) {
                return res.status(409).json({ message: `A ${existingParty.type} with this email already exists for this business.` });
            }
        }
        const updatedParty = await Parties.findByIdAndUpdate(
            id,
            {
                name,
                email,
                phone,
                address,
                gst_number,
                state,
                city,
                pin_code,
                notes
            },
            { new: true }
        );
        res.status(200).json({ message: 'Party updated successfully.', party: updatedParty });
    } catch (error) {
        res.status(500).json({ message: 'Server error during party update.' });
    }
};

// Delete a party (soft delete)
module.exports.deleteParty = async (req, res) => {
    try {
        const { id } = req.params;
        const party = await Parties.findOne({ _id: id, is_deleted: false });
        if (!party) {
            return res.status(404).json({ message: 'Party not found.' });
        }
        const deletedParty = await Parties.findByIdAndUpdate(id, { is_deleted: true }, { new: true });
        res.status(200).json({ message: 'Party deleted successfully.', party: deletedParty });
    } catch (error) {
        res.status(500).json({ message: 'Server error during party deletion.' });
    }
};

// Get party statistics for a business/type
module.exports.getPartyStats = async (req, res) => {
    try {
        const { business_id, type } = req.query;
        if (!business_id || !type) {
            return res.status(400).json({ message: 'Business ID and type are required.' });
        }
        const stats = await Parties.aggregate([
            {
                $match: {
                    business_id: new mongoose.Types.ObjectId(business_id),
                    type,
                    is_deleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ['$is_active', 1, 0] } },
                    withEmail: { $sum: { $cond: [{ $ne: ['$email', null] }, 1, 0] } },
                    withGST: { $sum: { $cond: [{ $ne: ['$gst_number', null] }, 1, 0] } }
                }
            }
        ]);
        const formattedStats = stats[0] || { total: 0, active: 0, withEmail: 0, withGST: 0 };
        res.status(200).json({ message: 'Party statistics retrieved successfully.', stats: formattedStats });
    } catch (error) {
        res.status(500).json({ message: 'Server error during party statistics retrieval.' });
    }
};
