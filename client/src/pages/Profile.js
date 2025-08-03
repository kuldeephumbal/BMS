import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Profile() {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Form state for editing
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        // Fetch user profile data
        fetchUserProfile();

        // Listen for sidebar toggle events from other components
        const handleSidebarToggle = (event) => {
            setSidebarOpen(event.detail.isOpen);
        };

        window.addEventListener('sidebarToggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
    }, [navigate]);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setUser(response.data.user);
            setFormData({
                name: response.data.user.name || '',
                email: response.data.user.email || '',
                phone: response.data.user.phone || '',
                password: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            const errorMessage = error.response?.data?.message || 'Error fetching user profile';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = () => {
        setIsEditing(true);
        // Initialize form data with current user data
        setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            confirmPassword: ''
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form data to original values
        setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            confirmPassword: ''
        });
    };

    const handleSave = async () => {
        // Validate password confirmation
        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        // Validate required fields
        if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
            toast.error('First name, last name, email, and phone are required fields!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const updateData = {
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim()
            };

            // Only include password if it's being changed
            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await axios.put('http://localhost:5000/api/user/profile', updateData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setUser(response.data.user);
            // Update localStorage with new user data
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setIsEditing(false);
            toast.success('Profile updated successfully!');

            // Clear password fields after successful update
            setFormData(prev => ({
                ...prev,
                password: '',
                confirmPassword: ''
            }));
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.message || 'Error updating profile';
            toast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
                <ToastContainer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        </main>
                    </div>
                </div>
                <ToastContainer />
            </div>
        );
    }

    return (
        <div className="main-layout-root">
            <div className="main-layout-row">
                <Sidebar open={sidebarOpen} />
                <div className="main-content-container">
                    <Header onToggleSidebar={handleToggleSidebar} />
                    <main className="main-content">
                        {/* Profile Content */}
                        <div className="container-fluid">
                            <div className="row justify-content-center">
                                <div className="col-lg-8 col-md-10 col-12">
                                    <div className="profile-card">
                                        <div className="profile-avatar-section">
                                            <div className="d-flex align-items-center justify-content-between gap-3">
                                                <div className="profile-avatar">
                                                    <FaUser size={35} />
                                                </div>
                                                <div>
                                                    <h1 className='profile-title'>Profile</h1>
                                                    <p className='profile-subtitle'>Manage your account information</p>
                                                </div>
                                            </div>
                                            <div className="profile-actions">
                                                {!isEditing ? (
                                                    <button className="btn-edit" onClick={handleEdit}>
                                                        <FaEdit /> Edit Profile
                                                    </button>
                                                ) : (
                                                    <div className="profile-edit-actions">
                                                        <button className="btn-save" onClick={handleSave}>
                                                            <FaSave /> Save
                                                        </button>
                                                        <button className="btn-cancel" onClick={handleCancel}>
                                                            <FaTimes /> Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="profile-details">
                                            <div className="row mb-3">
                                                <div className="col-md-6">
                                                    <label className="profile-detail-label">First Name</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            name="first_name"
                                                            value={formData.first_name}
                                                            onChange={handleInputChange}
                                                            className="profile-input"
                                                            placeholder="Enter your first name"
                                                        />
                                                    ) : (
                                                        <div className="profile-detail-value">
                                                            <FaUser className="profile-detail-icon" />
                                                            {user?.first_name || 'Not provided'}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="profile-detail-label">Last Name</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            name="last_name"
                                                            value={formData.last_name}
                                                            onChange={handleInputChange}
                                                            className="profile-input"
                                                            placeholder="Enter your last name"
                                                        />
                                                    ) : (
                                                        <div className="profile-detail-value">
                                                            <FaUser className="profile-detail-icon" />
                                                            {user?.last_name || 'Not provided'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="row mb-3">
                                                <div className="col-md-6">
                                                    <label className="profile-detail-label">Email Address</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            className="profile-input"
                                                            placeholder="Enter your email"
                                                        />
                                                    ) : (
                                                        <div className="profile-detail-value">
                                                            <FaEnvelope className="profile-detail-icon" />
                                                            {user?.email || 'Not provided'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="profile-detail-label">Phone Number</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                            className="profile-input"
                                                            placeholder="Enter your phone number"
                                                        />
                                                    ) : (
                                                        <div className="profile-detail-value">
                                                            <FaPhone className="profile-detail-icon" />
                                                            {user?.phone || 'Not provided'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="row mb-3">
                                                <div className="col-md-6">
                                                    <label className="profile-detail-label">Member Since</label>
                                                    <div className="profile-detail-value">
                                                        <FaCalendar className="profile-detail-icon" />
                                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="profile-detail-label">Last Updated</label>
                                                    <div className="profile-detail-value">
                                                        <FaCalendar className="profile-detail-icon" />
                                                        {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Not available'}
                                                    </div>
                                                </div>
                                            </div>

                                            {isEditing && (
                                                <div className="profile-password-section">
                                                    <h3 className="profile-section-title">Change Password</h3>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <label className="profile-detail-label">New Password</label>
                                                            <input
                                                                type="password"
                                                                name="password"
                                                                value={formData.password}
                                                                onChange={handleInputChange}
                                                                className="profile-input"
                                                                placeholder="Enter new password (optional)"
                                                            />
                                                        </div>

                                                        <div className="col-md-6">
                                                            <label className="profile-detail-label">Confirm Password</label>
                                                            <input
                                                                type="password"
                                                                name="confirmPassword"
                                                                value={formData.confirmPassword}
                                                                onChange={handleInputChange}
                                                                className="profile-input"
                                                                placeholder="Confirm new password"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
