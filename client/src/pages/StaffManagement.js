import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { FaEdit, FaTrash, FaPlus, FaPhone, FaEnvelope, FaSearch, FaEye, FaEyeSlash, FaToggleOn, FaToggleOff, FaUserCheck, FaUserTimes, FaTimes } from 'react-icons/fa';

export default function StaffManagement() {
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editError, setEditError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Search state
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: ''
    });

    const [editForm, setEditForm] = useState({
        id: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        is_active: true
    });

    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    // Listen for sidebar toggle events from other components
    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarOpen(event.detail.isOpen);
        };

        window.addEventListener('sidebarToggle', handleSidebarToggle);
        return () => {
            window.removeEventListener('sidebarToggle', handleSidebarToggle);
        };
    }, []);

    const fetchStaff = React.useCallback(async () => {
        if (!user._id) return;

        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/staff`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    user_id: user._id
                }
            });

            if (response.status === 200) {
                let staffData = response.data.staff || [];

                // Filter staff based on search if search term exists
                if (search.trim()) {
                    staffData = staffData.filter(member =>
                        member.first_name.toLowerCase().includes(search.toLowerCase()) ||
                        member.last_name.toLowerCase().includes(search.toLowerCase()) ||
                        member.email.toLowerCase().includes(search.toLowerCase()) ||
                        member.phone.includes(search)
                    );
                }

                setStaff(staffData);
                console.log('Fetched staff:', staffData);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
            const errorMessage = error.response?.data?.message || 'Error fetching staff';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [user._id, token, search]);

    useEffect(() => {
        if (!token || !user._id) {
            navigate('/login');
            return;
        }
        if (user._id) {
            fetchStaff();
        }
    }, [user._id, token, navigate, fetchStaff]);

    // Separate useEffect for search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (token && user._id) {
                fetchStaff();
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
    }, [search, fetchStaff, token, user._id]);

    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm({
            ...editForm,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = (phone) => /^\d{10}$/.test(phone);

    const handleAddStaff = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!form.first_name || !form.last_name || !form.email || !form.phone || !form.password) {
            setError('All fields are required.');
            return;
        }

        if (!validateEmail(form.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (!validatePhone(form.phone)) {
            setError('Phone number must be exactly 10 digits.');
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            const response = await axios.post(`http://localhost:5000/api/staff/register`, {
                ...form,
                user_id: user._id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 201) {
                toast.success('Staff member added successfully!');
                setModalOpen(false);
                setForm({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    password: ''
                });
                fetchStaff();
            }
        } catch (error) {
            console.error('Error adding staff:', error);
            const errorMessage = error.response?.data?.message || 'Error adding staff member';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleEditStaff = async (e) => {
        e.preventDefault();
        setEditError('');

        // Validation
        if (!editForm.first_name || !editForm.last_name || !editForm.email || !editForm.phone) {
            setEditError('All fields except password are required.');
            return;
        }

        if (!validateEmail(editForm.email)) {
            setEditError('Please enter a valid email address.');
            return;
        }

        if (!validatePhone(editForm.phone)) {
            setEditError('Phone number must be exactly 10 digits.');
            return;
        }

        if (editForm.password && editForm.password.length < 6) {
            setEditError('Password must be at least 6 characters long.');
            return;
        }

        try {
            const updateData = {
                first_name: editForm.first_name,
                last_name: editForm.last_name,
                email: editForm.email,
                phone: editForm.phone,
                is_active: editForm.is_active
            };

            // Only include password if it's provided
            if (editForm.password) {
                updateData.password = editForm.password;
            }

            const response = await axios.put(`http://localhost:5000/api/staff/${editForm.id}`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                toast.success('Staff member updated successfully!');
                setEditModalOpen(false);
                setEditForm({
                    id: null,
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    password: '',
                    is_active: true
                });
                fetchStaff();
            }
        } catch (error) {
            console.error('Error updating staff:', error);
            const errorMessage = error.response?.data?.message || 'Error updating staff member';
            setEditError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleEdit = (staffMember) => {
        setEditForm({
            id: staffMember._id,
            first_name: staffMember.first_name,
            last_name: staffMember.last_name,
            email: staffMember.email,
            phone: staffMember.phone,
            password: '',
            is_active: staffMember.is_active
        });
        setEditError('');
        setEditModalOpen(true);
    };

    const handleDeleteClick = (staffMember) => {
        setConfirmModalData({
            title: 'Delete Staff Member',
            message: `Are you sure you want to delete ${staffMember.first_name} ${staffMember.last_name}? This action cannot be undone.`,
            onConfirm: () => handleDeleteStaff(staffMember._id),
            onCancel: () => setShowConfirmModal(false)
        });
        setShowConfirmModal(true);
    };

    const handleDeleteStaff = async (staffId) => {
        try {
            const response = await axios.delete(`http://localhost:5000/api/staff/${staffId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                toast.success('Staff member deleted successfully!');
                fetchStaff();
            }
        } catch (error) {
            console.error('Error deleting staff:', error);
            const errorMessage = error.response?.data?.message || 'Error deleting staff member';
            toast.error(errorMessage);
        } finally {
            setShowConfirmModal(false);
        }
    };

    const handleToggleStatus = async (staffId) => {
        try {
            const response = await axios.patch(`http://localhost:5000/api/staff/${staffId}/toggle-status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                toast.success(response.data.message);
                fetchStaff();
            }
        } catch (error) {
            console.error('Error toggling staff status:', error);
            const errorMessage = error.response?.data?.message || 'Error updating staff status';
            toast.error(errorMessage);
        }
    };

    const filteredStaff = staff.filter(member =>
        member.first_name.toLowerCase().includes(search.toLowerCase()) ||
        member.last_name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase()) ||
        member.phone.includes(search)
    );

    return (
        <div className="main-layout-root">
            <div className="main-layout-row">
                <Sidebar open={sidebarOpen} />
                <div className="main-content-container">
                    <Header onToggleSidebar={handleToggleSidebar} />
                    <div className="main-content">
                        <div className="main-data-header-row">
                            <div className='d-flex align-items-center justify-content-between gap-2'>
                                <h1 className="main-data-page-title">
                                    Staff Management
                                </h1>
                                <div>
                                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                                        <FaSearch
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '16px',
                                                transform: 'translateY(-50%)',
                                                color: '#888',
                                                fontSize: '16px',
                                                zIndex: 1
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search here..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px 12px 40px',
                                                border: '1.5px solid #e0e0e0',
                                                borderRadius: '10px',
                                                fontSize: '1rem',
                                                outline: 'none',
                                                backgroundColor: '#fff',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#232526';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e0e0e0';
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                className="btn-primary-add"
                                onClick={() => {
                                    setError('');
                                    setModalOpen(true);
                                }}
                            >
                                <FaPlus /> Add Staff
                            </button>
                        </div>

                        {/* Staff Table */}
                        <div className="main-data-table-wrapper">
                            <table className="main-data-table">
                                <thead>
                                    <tr>
                                        <th className="table-header-cell">
                                            <div className="table-header-content">
                                                #
                                            </div>
                                        </th>
                                        <th className="table-header-cell">
                                            <div className="table-header-content">
                                                Name
                                            </div>
                                        </th>
                                        <th className="table-header-cell">
                                            <div className="table-header-content">
                                                Email
                                            </div>
                                        </th>
                                        <th className="table-header-cell">
                                            <div className="table-header-content">
                                                Phone
                                            </div>
                                        </th>
                                        <th className="table-header-cell">
                                            <div className="table-header-content">
                                                Status
                                            </div>
                                        </th>
                                        <th className="table-header-cell">
                                            <div className="table-header-content">
                                                Actions
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                                Loading staff...
                                            </td>
                                        </tr>
                                    ) : filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                                {search ? 'No staff found matching your search.' : 'No staff members found. Add your first staff member!'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map((member, index) => (
                                            <tr key={member._id} className="main-data-table-row">
                                                <td style={{ textAlign: 'center', fontWeight: '600' }}>
                                                    {index + 1}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: member.is_active ? '#28a745' : '#dc3545',
                                                            color: '#fff',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '14px',
                                                            fontWeight: '600'
                                                        }}>
                                                            {member.first_name.charAt(0).toUpperCase()}{member.last_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: '500' }}>
                                                            {member.first_name} {member.last_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <FaEnvelope style={{ color: '#6c757d', fontSize: '12px' }} />
                                                        {member.email}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <FaPhone style={{ color: '#6c757d', fontSize: '12px' }} />
                                                        {member.phone}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            background: member.is_active ? '#d4edda' : '#f8d7da',
                                                            color: member.is_active ? '#155724' : '#721c24'
                                                        }}
                                                    >
                                                        {member.is_active ? <FaUserCheck /> : <FaUserTimes />}
                                                        {member.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                        <button
                                                            className="main-data-icon-btn"
                                                            onClick={() => handleEdit(member)}
                                                            title="Edit Staff"
                                                            style={{
                                                                color: '#5e72e4',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            className="main-data-icon-btn"
                                                            onClick={() => handleToggleStatus(member._id)}
                                                            title={member.is_active ? 'Deactivate' : 'Activate'}
                                                            style={{
                                                                color: member.is_active ? '#ffc107' : '#28a745',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            {member.is_active ? <FaToggleOff /> : <FaToggleOn />}
                                                        </button>
                                                        <button
                                                            className="main-data-icon-btn"
                                                            onClick={() => handleDeleteClick(member)}
                                                            title="Delete Staff"
                                                            style={{
                                                                color: '#dc3545',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Staff Modal */}
                        {modalOpen && (
                            <div className="main-data-modal-backdrop">
                                <div className="main-data-modal">
                                    <div className="main-data-modal-header">
                                        <h2 className="main-data-modal-title">Add New Staff Member</h2>
                                        <button
                                            type="button"
                                            className="main-data-modal-close"
                                            onClick={() => setModalOpen(false)}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddStaff} className="main-data-modal-form">
                                        {error && <div className="main-data-modal-error">{error}</div>}

                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">
                                                First Name *
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    value={form.first_name}
                                                    onChange={handleChange}
                                                    className="main-data-modal-input"
                                                    placeholder="Enter first name"
                                                    required
                                                />
                                            </label>
                                            <label className="main-data-modal-label">
                                                Last Name *
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    value={form.last_name}
                                                    onChange={handleChange}
                                                    className="main-data-modal-input"
                                                    placeholder="Enter last name"
                                                    required
                                                />
                                            </label>
                                        </div>

                                        <label className="main-data-modal-label">
                                            Email *
                                            <input
                                                type="email"
                                                name="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                className="main-data-modal-input"
                                                placeholder="Enter email address"
                                                required
                                            />
                                        </label>

                                        <label className="main-data-modal-label">
                                            Phone *
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={form.phone}
                                                onChange={handleChange}
                                                className="main-data-modal-input"
                                                placeholder="Enter 10-digit phone number"
                                                maxLength="10"
                                                required
                                            />
                                        </label>

                                        <label className="main-data-modal-label">
                                            Password *
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={form.password}
                                                    onChange={handleChange}
                                                    className="main-data-modal-input"
                                                    placeholder="Enter password (min 6 characters)"
                                                    minLength="6"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '12px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#6c757d',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </label>

                                        <div className="main-data-modal-actions">
                                            <button
                                                type="button"
                                                onClick={() => setModalOpen(false)}
                                                className="btn-cancel"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn-save">
                                                Add Staff
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Edit Staff Modal */}
                        {editModalOpen && (
                            <div className="main-data-modal-backdrop">
                                <div className="main-data-modal">
                                    <div className="main-data-modal-header">
                                        <h2 className="main-data-modal-title">Edit Staff Member</h2>
                                        <button
                                            type="button"
                                            className="main-data-modal-close"
                                            onClick={() => setEditModalOpen(false)}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <form onSubmit={handleEditStaff} className="main-data-modal-form">
                                        {editError && <div className="main-data-modal-error">{editError}</div>}

                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">
                                                First Name *
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    value={editForm.first_name}
                                                    onChange={handleEditChange}
                                                    className="main-data-modal-input"
                                                    placeholder="Enter first name"
                                                    required
                                                />
                                            </label>
                                            <label className="main-data-modal-label">
                                                Last Name *
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    value={editForm.last_name}
                                                    onChange={handleEditChange}
                                                    className="main-data-modal-input"
                                                    placeholder="Enter last name"
                                                    required
                                                />
                                            </label>
                                        </div>

                                        <label className="main-data-modal-label">
                                            Email *
                                            <input
                                                type="email"
                                                name="email"
                                                value={editForm.email}
                                                onChange={handleEditChange}
                                                className="main-data-modal-input"
                                                placeholder="Enter email address"
                                                required
                                            />
                                        </label>

                                        <label className="main-data-modal-label">
                                            Phone *
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={editForm.phone}
                                                onChange={handleEditChange}
                                                className="main-data-modal-input"
                                                placeholder="Enter 10-digit phone number"
                                                maxLength="10"
                                                required
                                            />
                                        </label>

                                        <label className="main-data-modal-label">
                                            New Password (leave blank to keep current)
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showEditPassword ? "text" : "password"}
                                                    name="password"
                                                    value={editForm.password}
                                                    onChange={handleEditChange}
                                                    className="main-data-modal-input"
                                                    placeholder="Enter new password (optional)"
                                                    minLength="6"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowEditPassword(!showEditPassword)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '12px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#6c757d',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {showEditPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </label>

                                        <label className="main-data-modal-label" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={editForm.is_active}
                                                onChange={handleEditChange}
                                                style={{ width: 'auto', margin: 0 }}
                                            />
                                            Active Status
                                        </label>

                                        <div className="main-data-modal-actions">
                                            <button
                                                type="button"
                                                onClick={() => setEditModalOpen(false)}
                                                className="btn-cancel"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn-save">
                                                Update Staff
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Confirm Modal */}
                        <ConfirmModal
                            isOpen={showConfirmModal}
                            title={confirmModalData.title}
                            message={confirmModalData.message}
                            onConfirm={confirmModalData.onConfirm}
                            onCancel={confirmModalData.onCancel}
                        />

                        <ToastContainer
                            position="top-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
