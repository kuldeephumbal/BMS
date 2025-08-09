const Service = require('../models/service.modal');

// Create Service
module.exports.createService = async (req, res) => {
    try {
        const { userId, businessId, name, image, price, unit, includeTax, SACCode, GST } = req.body;
        if (!userId || !businessId || !name || !image || !price || !unit || !SACCode || !GST) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const newService = new Service({
            userId,
            businessId,
            name: name.trim(),
            image,
            price,
            unit,
            includeTax: includeTax === 'true' || includeTax === true,
            SACCode: SACCode.trim(),
            GST: GST.trim()
        });
        await newService.save();
        res.status(201).json({ message: 'Service created successfully.', service: newService });
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({ message: 'Server error creating service.' });
    }
};

// Get All Services
module.exports.getAllServices = async (req, res) => {
    try {
        const { userId, businessId, name, page = 1, limit = 20 } = req.query;
        if (!userId) return res.status(400).json({ message: 'userId is required.' });
        const query = { userId };
        if (businessId) query.businessId = businessId;
        if (name) query.name = { $regex: name, $options: 'i' };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const services = await Service.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
        const total = await Service.countDocuments(query);
        res.status(200).json({
            message: 'Services retrieved successfully',
            count: services.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            services
        });
    } catch (error) {
        console.error('Get all services error:', error);
        res.status(500).json({ message: 'Server error retrieving services.' });
    }
};

// Get Service by ID
module.exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await Service.findById(id);
        if (!service) return res.status(404).json({ message: 'Service not found.' });
        res.status(200).json({ message: 'Service retrieved successfully', service });
    } catch (error) {
        console.error('Get service by ID error:', error);
        res.status(500).json({ message: 'Server error retrieving service.' });
    }
};

// Update Service
module.exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, price, unit, includeTax, SACCode, GST, businessId } = req.body;
        const service = await Service.findById(id);
        if (!service) return res.status(404).json({ message: 'Service not found.' });
        if (name) service.name = name.trim();
        if (image) service.image = image;
        if (price) service.price = price;
        if (unit) service.unit = unit;
        if (includeTax !== undefined) service.includeTax = includeTax === 'true' || includeTax === true;
        if (SACCode) service.SACCode = SACCode.trim();
        if (GST) service.GST = GST.trim();
        if (businessId) service.businessId = businessId;
        await service.save();
        res.status(200).json({ message: 'Service updated successfully', service });
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({ message: 'Server error updating service.' });
    }
};

// Delete Service
module.exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await Service.findById(id);
        if (!service) return res.status(404).json({ message: 'Service not found.' });
        await Service.findByIdAndDelete(id);
        res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ message: 'Server error deleting service.' });
    }
};
