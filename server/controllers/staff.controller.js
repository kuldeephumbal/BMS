const Admin = require('../models/admin.modal');
const User = require('../models/user.modal');
const Staff = require('../models/staff.modal');
const jwt = require('jsonwebtoken');
require("dotenv").config();

// 🟩 Staff Registration
module.exports.registerStaff = async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone, user_id } = req.body;

        if (!first_name || !last_name || !email || !password || !phone || !user_id) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if staff exists by email
        const existingStaff = await Staff.findOne({ email });
        if (existingStaff) {
            return res.status(409).json({ message: 'Staff with this email already exists.' });
        }

        // Check if staff exists by phone
        const existingPhone = await Staff.findOne({ phone });
        if (existingPhone) {
            return res.status(409).json({ message: 'Staff with this phone number already exists.' });
        }

        // Verify user exists
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const admin_id = await Admin.findOne({ phone: "9725863699" });

        const newStaff = new Staff({
            admin_id,
            user_id,
            first_name,
            last_name,
            email,
            password,
            phone
        });
        await newStaff.save();

        res.status(201).json({
            message: 'Staff registered successfully.',
            staff: {
                _id: newStaff._id,
                first_name: newStaff.first_name,
                last_name: newStaff.last_name,
                email: newStaff.email,
                phone: newStaff.phone,
                role: newStaff.role,
                is_active: newStaff.is_active
            }
        });
    } catch (error) {
        console.error('Staff registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// 🟨 Staff Login
module.exports.loginStaff = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const staff = await Staff.findOne({ email, is_deleted: false });
        if (!staff || staff.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        if (!staff.is_active) {
            return res.status(403).json({ message: 'Account is deactivated. Please contact administrator.' });
        }

        const token = jwt.sign(
            { id: staff._id, role: staff.role, user_id: staff.user_id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            staff: {
                _id: staff._id,
                first_name: staff.first_name,
                last_name: staff.last_name,
                email: staff.email,
                phone: staff.phone,
                role: staff.role,
                user_id: staff.user_id
            }
        });
    } catch (error) {
        console.error('Staff login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// 🟦 Get Staff Profile
module.exports.getStaffProfile = async (req, res) => {
    try {
        const staffId = req.user.id; // From auth middleware

        const staff = await Staff.findById(staffId)
            .populate('user_id', 'first_name last_name email')
            .select('-password');

        if (!staff || staff.is_deleted) {
            return res.status(404).json({ message: 'Staff not found.' });
        }

        res.status(200).json({
            message: 'Profile retrieved successfully',
            staff
        });
    } catch (error) {
        console.error('Get staff profile error:', error);
        res.status(500).json({ message: 'Server error during profile retrieval.' });
    }
};

// 🟪 Update Staff Profile
module.exports.updateStaffProfile = async (req, res) => {
    try {
        const staffId = req.user.id; // From auth middleware
        const { first_name, last_name, email, phone, password } = req.body;

        // Find staff
        const staff = await Staff.findById(staffId);
        if (!staff || staff.is_deleted) {
            return res.status(404).json({ message: 'Staff not found.' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== staff.email) {
            const existingStaff = await Staff.findOne({ email, is_deleted: false });
            if (existingStaff) {
                return res.status(409).json({ message: 'Email already exists.' });
            }
        }

        // Check if phone is being changed and if it already exists
        if (phone && phone !== staff.phone) {
            const existingStaff = await Staff.findOne({ phone, is_deleted: false });
            if (existingStaff) {
                return res.status(409).json({ message: 'Phone number already exists.' });
            }
        }

        // Update fields
        const updateData = {};
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (password) updateData.password = password;

        const updatedStaff = await Staff.findByIdAndUpdate(
            staffId,
            updateData,
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: 'Profile updated successfully',
            staff: updatedStaff
        });
    } catch (error) {
        console.error('Update staff profile error:', error);
        res.status(500).json({ message: 'Server error during profile update.' });
    }
};

// 🟥 Get All Staff (for admin/user)
module.exports.getAllStaff = async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        const staff = await Staff.find({
            user_id: user_id,
            is_deleted: false
        })
            .populate('user_id', 'first_name last_name email')
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Staff retrieved successfully',
            count: staff.length,
            staff
        });
    } catch (error) {
        console.error('Get all staff error:', error);
        res.status(500).json({ message: 'Server error during staff retrieval.' });
    }
};

// 🟧 Get Staff by ID
module.exports.getStaffById = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findById(id)
            .populate('user_id', 'first_name last_name email')
            .select('-password');

        if (!staff || staff.is_deleted) {
            return res.status(404).json({ message: 'Staff not found.' });
        }

        res.status(200).json({
            message: 'Staff retrieved successfully',
            staff
        });
    } catch (error) {
        console.error('Get staff by ID error:', error);
        res.status(500).json({ message: 'Server error during staff retrieval.' });
    }
};

// 🟫 Update Staff by ID (for admin/user)
module.exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, phone, password, is_active } = req.body;

        // Find staff
        const staff = await Staff.findById(id);
        if (!staff || staff.is_deleted) {
            return res.status(404).json({ message: 'Staff not found.' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== staff.email) {
            const existingStaff = await Staff.findOne({
                email,
                is_deleted: false,
                _id: { $ne: id }
            });
            if (existingStaff) {
                return res.status(409).json({ message: 'Email already exists.' });
            }
        }

        // Check if phone is being changed and if it already exists
        if (phone && phone !== staff.phone) {
            const existingStaff = await Staff.findOne({
                phone,
                is_deleted: false,
                _id: { $ne: id }
            });
            if (existingStaff) {
                return res.status(409).json({ message: 'Phone number already exists.' });
            }
        }

        // Update fields
        const updateData = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (password !== undefined) updateData.password = password;
        if (is_active !== undefined) updateData.is_active = is_active;

        const updatedStaff = await Staff.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: 'Staff updated successfully',
            staff: updatedStaff
        });
    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ message: 'Server error during staff update.' });
    }
};

// 🟥 Delete Staff (soft delete)
module.exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findById(id);
        if (!staff || staff.is_deleted) {
            return res.status(404).json({ message: 'Staff not found.' });
        }

        // Soft delete - mark as deleted
        await Staff.findByIdAndUpdate(id, {
            is_deleted: true,
            is_active: false
        });

        res.status(200).json({
            message: 'Staff deleted successfully'
        });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ message: 'Server error during staff deletion.' });
    }
};

// 🔄 Toggle Staff Status
module.exports.toggleStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findById(id);
        if (!staff || staff.is_deleted) {
            return res.status(404).json({ message: 'Staff not found.' });
        }

        const updatedStaff = await Staff.findByIdAndUpdate(
            id,
            { is_active: !staff.is_active },
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: `Staff ${updatedStaff.is_active ? 'activated' : 'deactivated'} successfully`,
            staff: updatedStaff
        });
    } catch (error) {
        console.error('Toggle staff status error:', error);
        res.status(500).json({ message: 'Server error during status update.' });
    }
};
