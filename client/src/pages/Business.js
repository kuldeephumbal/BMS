import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { FaBuilding, FaEdit, FaSave, FaTimes, FaPlus, FaTrash, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaIdCard } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Business() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [businesses, setBusinesses] = useState([]);
    const [activeBusiness, setActiveBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({});
    const [editingBusiness, setEditingBusiness] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const navigate = useNavigate();

    // Form state for business
    const [formData, setFormData] = useState({
        business_name: '',
        address: '',
        city: '',
        state: '',
        pin_code: '',
        gst_number: ''
    });

    const handleToggleSidebar = () => setSidebarOpen(!sidebarOpen);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        // Try to get active business ID from localStorage first
        const storedActiveBusinessId = localStorage.getItem('activeBusinessId');
        if (storedActiveBusinessId) {
            // We'll fetch the full business data from API
            // The ID is just for quick reference
        }

        fetchBusinesses();
        fetchActiveBusiness();
    }, [navigate]);

    const fetchActiveBusiness = async () => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!user._id) {
                return;
            }
            
            const response = await axios.get(`http://localhost:5000/api/business/active/${user._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const activeBusinessData = response.data.business;
            setActiveBusiness(activeBusinessData);
            
            // Store only active business ID in localStorage
            localStorage.setItem('activeBusinessId', activeBusinessData._id);
        } catch (error) {
            console.error('Error fetching active business:', error);
            // Don't show error toast for this as it's not critical
        }
    };

    const fetchBusinesses = async () => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!user._id) {
                setError('User data not found. Please login again.');
                toast.error('User data not found. Please login again.');
                setLoading(false);
                return;
            }
            
            const response = await axios.get(`http://localhost:5000/api/business/get/${user._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Sort businesses: active business first, then others
            const sortedBusinesses = (response.data.businesses || []).sort((a, b) => {
                if (a.is_active && !b.is_active) return -1;
                if (!a.is_active && b.is_active) return 1;
                return 0;
            });
            
            setBusinesses(sortedBusinesses);
            
            // Debug: Log business data to check logo URLs
            if (sortedBusinesses.length > 0) {
                sortedBusinesses.forEach(business => {
                    if (business.logo_url) {
                        console.log('Logo URL:', `http://localhost:5000${business.logo_url}`);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching businesses:', error);
            const errorMessage = error.response?.data?.message || 'Error fetching businesses';
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setFormData({
            business_name: '',
            address: '',
            city: '',
            state: '',
            pin_code: '',
            gst_number: ''
        });
        setSelectedFile(null);
        setPreviewUrl('');
        setEditingBusiness(null);
    };

    const handleAddBusiness = () => {
        resetForm();
        setShowModal(true);
    };

    const handleEditBusiness = (business) => {
        setFormData({
            business_name: business.business_name || '',
            address: business.address || '',
            city: business.city || '',
            state: business.state || '',
            pin_code: business.pin_code || '',
            gst_number: business.gst_number || ''
        });
        setPreviewUrl(business.logo_url ? `http://localhost:5000${business.logo_url}` : '');
        setEditingBusiness(business);
        setShowModal(true);
    };

    const handleSetActiveBusiness = async (businessId) => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!user._id) {
                toast.error('User data not found. Please login again.');
                return;
            }
            
            await axios.put(`http://localhost:5000/api/business/activate/${businessId}`, 
                { user_id: user._id },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            toast.success('Business activated successfully!');
            fetchBusinesses();
            fetchActiveBusiness();
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('activeBusinessChanged'));
            
            // Update localStorage with new active business ID
            localStorage.setItem('activeBusinessId', businessId);
        } catch (error) {
            console.error('Error activating business:', error);
            const errorMessage = error.response?.data?.message || 'Error activating business';
            toast.error(errorMessage);
        }
    };

    const handleDeleteBusiness = (businessId) => {
        const business = businesses.find(b => b._id === businessId);
        setConfirmModalData({
            title: 'Delete Business',
            message: `Are you sure you want to delete "${business?.business_name}"? This action cannot be undone.`,
            confirmText: 'Delete Business',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: () => performDeleteBusiness(businessId)
        });
        setShowConfirmModal(true);
    };

    const performDeleteBusiness = async (businessId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/business/delete/${businessId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success('Business deleted successfully!');
            fetchBusinesses();
            fetchActiveBusiness();
            window.dispatchEvent(new CustomEvent('activeBusinessChanged'));
            
            // Clear localStorage if the deleted business was active
            const storedActiveBusinessId = localStorage.getItem('activeBusinessId');
            if (storedActiveBusinessId === businessId) {
                localStorage.removeItem('activeBusinessId');
            }
        } catch (error) {
            console.error('Error deleting business:', error);
            const errorMessage = error.response?.data?.message || 'Error deleting business';
            toast.error(errorMessage);
        } finally {
            setShowConfirmModal(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.business_name.trim()) {
            toast.error('Business name is required!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!user._id) {
                toast.error('User data not found. Please login again.');
                return;
            }
            
            const formDataToSend = new FormData();
            formDataToSend.append('user_id', user._id);
            formDataToSend.append('business_name', formData.business_name.trim());
            formDataToSend.append('address', formData.address.trim());
            formDataToSend.append('city', formData.city.trim());
            formDataToSend.append('state', formData.state.trim());
            formDataToSend.append('pin_code', formData.pin_code.trim());
            formDataToSend.append('gst_number', formData.gst_number.trim());
            
            if (selectedFile) {
                formDataToSend.append('logo', selectedFile);
            }

            let response;
            if (editingBusiness) {
                // Update existing business
                response = await axios.put(`http://localhost:5000/api/business/update/${editingBusiness._id}`, formDataToSend, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Business updated successfully!');
            } else {
                // Create new business
                response = await axios.post('http://localhost:5000/api/business/create', formDataToSend, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Business created successfully!');
            }

            setShowModal(false);
            resetForm();
            fetchBusinesses();
            fetchActiveBusiness();
        } catch (error) {
            console.error('Error saving business:', error);
            const errorMessage = error.response?.data?.message || 'Error saving business';
            toast.error(errorMessage);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
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
                        {/* Business Content */}
                        <div className="business-content">
                            <div className="business-header">
                                <div className="business-title-section">
                                    <h1 className="business-title">Business Management</h1>
                                    <p className="business-subtitle">Manage your business profiles and information</p>
                                </div>
                                <div className="business-actions">
                                    <button className="business-add-btn" onClick={handleAddBusiness}>
                                        <FaPlus /> Add Business
                                    </button>
                                </div>
                            </div>

                            <div className="business-grid">
                                {businesses.length === 0 ? (
                                    <div className="business-empty-state">
                                        <div className="business-empty-icon">
                                            <FaBuilding size={48} />
                                        </div>
                                        <h3>No Businesses Found</h3>
                                        <p>Get started by adding your first business profile</p>
                                        <button className="business-add-btn" onClick={handleAddBusiness}>
                                            <FaPlus /> Add Your First Business
                                        </button>
                                    </div>
                                ) : (
                                    businesses.map((business) => (
                                        <div key={business._id} className="business-card">
                                            <div className="business-card-header">
                                                <div className="business-logo">
                                                    {business.logo_url ? (
                                                        <img 
                                                            src={`http://localhost:5000${business.logo_url}`} 
                                                            alt={business.business_name}
                                                            className="business-logo-img"
                                                            onError={(e) => {
                                                                console.error('Image failed to load:', business.logo_url);
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="business-logo-placeholder" style={{ display: 'flex' }}>
                                                            <FaBuilding size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="business-card-actions">
                                                    {!business.is_active && (
                                                        <button 
                                                            className="business-icon-btn business-activate-btn" 
                                                            onClick={() => handleSetActiveBusiness(business._id)}
                                                            title="Set as Active Business"
                                                        >
                                                            <FaBuilding />
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="business-icon-btn" 
                                                        onClick={() => handleEditBusiness(business)}
                                                        title="Edit Business"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button 
                                                        className="business-icon-btn business-delete-btn" 
                                                        onClick={() => handleDeleteBusiness(business._id)}
                                                        title="Delete Business"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="business-card-body">
                                                <h3 className="business-name">{business.business_name}</h3>
                                                
                                                <div className="business-details">
                                                    {business.address && (
                                                        <div className="business-detail-item">
                                                            <FaMapMarkerAlt className="business-detail-icon" />
                                                            <span>{business.address}</span>
                                                        </div>
                                                    )}
                                                    
                                                    {(business.city || business.state) && (
                                                        <div className="business-detail-item">
                                                            <FaMapMarkerAlt className="business-detail-icon" />
                                                            <span>
                                                                {[business.city, business.state].filter(Boolean).join(', ')}
                                                                {business.pin_code && ` - ${business.pin_code}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {business.gst_number && (
                                                        <div className="business-detail-item">
                                                            <FaIdCard className="business-detail-icon" />
                                                            <span>{business.gst_number}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="business-status">
                                                    <span className={`business-status-badge ${business.is_active ? 'active' : 'inactive'}`}>
                                                        {business.is_active ? '✓ Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Business Modal */}
                        {showModal && (
                            <div className="business-modal-backdrop" onClick={handleCloseModal}>
                                <div className="business-modal" onClick={(e) => e.stopPropagation()}>
                                    <div className="business-modal-header">
                                        <h2 className="business-modal-title">
                                            {editingBusiness ? 'Edit Business' : 'Add New Business'}
                                        </h2>
                                        <button className="business-modal-close" onClick={handleCloseModal}>
                                            <FaTimes />
                                        </button>
                                    </div>
                                    
                                    <form className="business-modal-form" onSubmit={handleSubmit}>
                                        <div className="business-logo-upload">
                                            <label className="business-logo-label">Business Logo</label>
                                            <div className="business-logo-preview">
                                                {previewUrl ? (
                                                    <img src={previewUrl} alt="Logo preview" className="business-logo-preview-img" />
                                                ) : (
                                                    <div className="business-logo-preview-placeholder">
                                                        <FaBuilding size={32} />
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="business-logo-input"
                                                    id="logo-upload"
                                                />
                                                <label htmlFor="logo-upload" className="business-logo-upload-btn">
                                                    {previewUrl ? 'Change Logo' : 'Upload Logo'}
                                                </label>
                                            </div>
                                        </div>

                                        <div className="business-form-row">
                                            <div className="business-form-group">
                                                <label className="business-form-label">Business Name *</label>
                                                <input
                                                    type="text"
                                                    name="business_name"
                                                    value={formData.business_name}
                                                    onChange={handleInputChange}
                                                    className="business-form-input"
                                                    placeholder="Enter business name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="business-form-row">
                                            <div className="business-form-group">
                                                <label className="business-form-label">Address</label>
                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className="business-form-input"
                                                    placeholder="Enter business address"
                                                />
                                            </div>
                                        </div>

                                        <div className="business-form-row">
                                            <div className="business-form-group">
                                                <label className="business-form-label">City</label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    className="business-form-input"
                                                    placeholder="Enter city"
                                                />
                                            </div>
                                            <div className="business-form-group">
                                                <label className="business-form-label">State</label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    className="business-form-input"
                                                    placeholder="Enter state"
                                                />
                                            </div>
                                        </div>

                                        <div className="business-form-row">
                                            <div className="business-form-group">
                                                <label className="business-form-label">PIN Code</label>
                                                <input
                                                    type="text"
                                                    name="pin_code"
                                                    value={formData.pin_code}
                                                    onChange={handleInputChange}
                                                    className="business-form-input"
                                                    placeholder="Enter PIN code"
                                                />
                                            </div>
                                            <div className="business-form-group">
                                                <label className="business-form-label">GST Number</label>
                                                <input
                                                    type="text"
                                                    name="gst_number"
                                                    value={formData.gst_number}
                                                    onChange={handleInputChange}
                                                    className="business-form-input"
                                                    placeholder="Enter GST number"
                                                />
                                            </div>
                                        </div>

                                        <div className="business-modal-actions">
                                            <button type="button" className="business-modal-cancel" onClick={handleCloseModal}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="business-modal-submit">
                                                {editingBusiness ? <><FaSave /> Update Business</> : <><FaPlus /> Create Business</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            
            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmModalData.onConfirm}
                title={confirmModalData.title}
                message={confirmModalData.message}
                confirmText={confirmModalData.confirmText}
                cancelText={confirmModalData.cancelText}
                type={confirmModalData.type}
            />
            
            <ToastContainer />
        </div>
    );
}
