const Business = require('../models/business.modal');

module.exports.createBusiness = async (req, res) => {
    try {
        const { user_id, business_name, address, city, state, pin_code, gst_number } = req.body;
        let logo_url = req.body.logo_url;
        if (req.file) {
            logo_url = `/uploads/logos/${req.file.filename}`;
        }

        // Check if this is the first business for the user
        const existingBusinesses = await Business.find({ user_id, is_deleted: false });
        const isFirstBusiness = existingBusinesses.length === 0;

        const newBusiness = await Business.create({
            user_id,
            business_name,
            logo_url,
            address,
            city,
            state,
            pin_code,
            gst_number,
            is_active: isFirstBusiness // Set as active if it's the first business
        });

        res.status(200).json({
            message: 'Business created successfully.',
            business: newBusiness,
            isActive: isFirstBusiness
        });
    } catch (error) {
        console.error('Business creation error:', error);
        res.status(500).json({ message: 'Server error during business creation.' });
    }
};

module.exports.getBusinesses = async (req, res) => {
    try {
        const { user_id } = req.params;
        const businesses = await Business.find({ user_id, is_deleted: false });
        res.status(200).json({ message: 'Businesses retrieved successfully.', businesses });
    } catch (error) {
        console.error('Business retrieval error:', error);
        res.status(500).json({ message: 'Server error during business retrieval.' });
    }
};

module.exports.updateBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const { business_name, address, city, state, pin_code, gst_number } = req.body;
        let logo_url = req.body.logo_url;
        if (req.file) {
            logo_url = `/uploads/logos/${req.file.filename}`;
        }

        const updatedBusiness = await Business.findByIdAndUpdate(
            id,
            { business_name, logo_url, address, city, state, pin_code, gst_number },
            { new: true }
        );
        res.status(200).json({ message: 'Business updated successfully.', business: updatedBusiness });
    } catch (error) {
        console.error('Business update error:', error);
        res.status(500).json({ message: 'Server error during business update.' });
    }
};

module.exports.setActiveBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        // First, deactivate all businesses for this user
        await Business.updateMany(
            { user_id, is_deleted: false },
            { is_active: false }
        );

        // Then activate the selected business
        const activeBusiness = await Business.findByIdAndUpdate(
            id,
            { is_active: true },
            { new: true }
        );

        if (!activeBusiness) {
            return res.status(404).json({ message: 'Business not found.' });
        }

        res.status(200).json({
            message: 'Business activated successfully.',
            business: activeBusiness
        });
    } catch (error) {
        console.error('Business activation error:', error);
        res.status(500).json({ message: 'Server error during business activation.' });
    }
};

module.exports.getActiveBusiness = async (req, res) => {
    try {
        const { user_id } = req.params;
        const activeBusiness = await Business.findOne({
            user_id,
            is_active: true,
            is_deleted: false
        });

        res.status(200).json({
            message: 'Active business retrieved successfully.',
            business: activeBusiness
        });
    } catch (error) {
        console.error('Active business retrieval error:', error);
        res.status(500).json({ message: 'Server error during active business retrieval.' });
    }
};

module.exports.deleteBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const businessToDelete = await Business.findById(id);

        if (!businessToDelete) {
            return res.status(404).json({ message: 'Business not found.' });
        }

        // If deleting the active business, activate another business if available
        if (businessToDelete.is_active) {
            const otherBusiness = await Business.findOne({
                user_id: businessToDelete.user_id,
                _id: { $ne: id },
                is_deleted: false
            });

            if (otherBusiness) {
                await Business.findByIdAndUpdate(otherBusiness._id, { is_active: true });
            }
        }

        const deletedBusiness = await Business.findByIdAndUpdate(id, { is_deleted: true });
        res.status(200).json({ message: 'Business deleted successfully.', business: deletedBusiness });
    } catch (error) {
        console.error('Business deletion error:', error);
        res.status(500).json({ message: 'Server error during business deletion.' });
    }
};
