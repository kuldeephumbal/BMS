const Admin = require('../models/admin.modal');
const jwt = require('jsonwebtoken');
require("dotenv").config();

module.exports.registerAdmin = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        const is_admin_exists = await Admin.findOne({ email });
        if (is_admin_exists) {
            return res.status(400).json({ message: 'Admin already exists.' });
        }
        const admin = await Admin.create({ name, email, password, phone });
        res.status(200).json({ message: 'Admin registered successfully.' });

    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
}


module.exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Check if admin exists
        const admin = await Admin.findOne({ email });
        if (!admin || admin.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};
