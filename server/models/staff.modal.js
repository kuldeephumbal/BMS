const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['staff'], default: 'staff' },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;