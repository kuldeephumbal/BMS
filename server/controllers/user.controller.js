const Admin = require('../models/admin.modal');
const User = require('../models/user.modal');
const jwt = require('jsonwebtoken');
require("dotenv").config();

// 🟩 User Registration
module.exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists.' });
        }

        const admin_id = await Admin.findOne({ phone: "9725863699" });

        const newUser = new User({ admin_id, name, email, password, phone });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        console.error('User registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// 🟨 User Login
module.exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('User login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// 🟦 Get User Profile
module.exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'Profile retrieved successfully',
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error during profile retrieval.' });
    }
};

// 🟪 Update User Profile
module.exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware
        const { name, email, phone, password } = req.body;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ message: 'Email already exists.' });
            }
        }

        // Check if phone is being changed and if it already exists
        if (phone && phone !== user.phone) {
            const existingUser = await User.findOne({ phone });
            if (existingUser) {
                return res.status(409).json({ message: 'Phone number already exists.' });
            }
        }

        // Update fields
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (password) updateData.password = password;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error during profile update.' });
    }
};
