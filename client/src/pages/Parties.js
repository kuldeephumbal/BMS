import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaSearch, FaTimes } from 'react-icons/fa';

export default function Parties() {
    const navigate = useNavigate();
    const { type } = useParams(); // Get type from URL params (customer or supplier)

    // Validate type parameter and handle legacy routes
    const validTypes = ['customer', 'supplier'];
    let partyType = validTypes.includes(type) ? type : 'customer'; // Default to customer if invalid

    // Handle legacy routes - if no type param, check current pathname
    if (!type) {
        const pathname = window.location.pathname;
        if (pathname === '/customers') {
            partyType = 'customer';
        } else if (pathname === '/suppliers') {
            partyType = 'supplier';
        }
    }

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editError, setEditError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({});

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(7);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        gst_number: '',
        state: '',
        city: '',
        pin_code: '',
        notes: ''
    });

    const [editForm, setEditForm] = useState({
        id: null,
        name: '',
        phone: '',
        email: '',
        address: '',
        gst_number: '',
        state: '',
        city: '',
        pin_code: '',
        notes: ''
    });

    // Get user and business info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const [activeBusiness, setActiveBusiness] = useState(null);
    const [activeBusinessId, setActiveBusinessId] = useState(() => {
        // Initialize active business ID from localStorage
        return localStorage.getItem('activeBusinessId') || null;
    });

    // Fetch active business data when ID changes
    useEffect(() => {
        const fetchActiveBusiness = async () => {
            if (!activeBusinessId || !token || !user._id) return;

            try {
                const response = await axios.get(`http://localhost:5000/api/business/active/${user._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    setActiveBusiness(response.data.business);
                }
            } catch (error) {
                console.error('Error fetching active business:', error);
                setActiveBusiness(null);
            }
        };

        fetchActiveBusiness();
    }, [activeBusinessId, token, user._id]);

    // Listen for active business changes
    useEffect(() => {
        const handleActiveBusinessChange = () => {
            const updatedActiveBusinessId = localStorage.getItem('activeBusinessId');
            setActiveBusinessId(updatedActiveBusinessId);
        };

        // Listen for sidebar toggle events from other components
        const handleSidebarToggle = (event) => {
            setSidebarOpen(event.detail.isOpen);
        };

        window.addEventListener('activeBusinessChanged', handleActiveBusinessChange);
        window.addEventListener('sidebarToggle', handleSidebarToggle);
        return () => {
            window.removeEventListener('activeBusinessChanged', handleActiveBusinessChange);
            window.removeEventListener('sidebarToggle', handleSidebarToggle);
        };
    }, []);

    useEffect(() => {
        if (!token || !user._id || !activeBusinessId) {
            if (!token || !user._id) {
                navigate('/login');
            }
            return;
        }
        fetchParties();
    }, [page, activeBusinessId, partyType]);

    // Separate useEffect for search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (token && user._id && activeBusinessId) {
                setPage(1); // Reset to first page when searching
                fetchParties();
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
    }, [search, activeBusinessId, partyType]);

    // Store the party type in localStorage for sidebar active state
    useEffect(() => {
        localStorage.setItem('lastPartiesType', partyType);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('lastPartiesTypeChanged'));
    }, [partyType]);

    const fetchParties = async () => {
        if (!activeBusinessId) return;

        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/parties/get`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    business_id: activeBusinessId, // Using active business ID
                    type: partyType, // Dynamic type based on route
                    page,
                    limit: itemsPerPage,
                    search
                }
            });
            if (response.status === 200) {
                setParties(response.data.parties || []);
                console.log(`Fetched ${partyType}s:`, response.data.parties);
                setTotalPages(response.data.pagination?.totalPages || 1);
                setTotalItems(response.data.pagination?.totalItems || 0);
            }
        } catch (error) {
            console.error(`Error fetching ${partyType}s:`, error);
            const errorMessage = error.response?.data?.message || `Error fetching ${partyType}s`;
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

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
        const { name, value } = e.target;
        setEditForm({ ...editForm, [name]: value });
    };

    const validatePhone = (phone) => /^\d{10}$/.test(phone);
    const validatePinCode = (pinCode) => /^\d{6}$/.test(pinCode);
    const validateGST = (gst) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);

    const handleAddParty = async (e) => {
        e.preventDefault();

        if (!validatePhone(form.phone)) {
            setError('Phone must be a 10-digit number');
            return;
        }
        if (form.pin_code && !validatePinCode(form.pin_code)) {
            setError('PIN code must be a 6-digit number');
            return;
        }
        if (form.gst_number && !validateGST(form.gst_number)) {
            setError('Please enter a valid GST number');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/parties/create', {
                user_id: user._id,
                business_id: activeBusinessId,
                type: partyType, // Dynamic type
                ...form
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 201) {
                toast.success(`${partyType.charAt(0).toUpperCase() + partyType.slice(1)} created successfully!`);
                setForm({
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    gst_number: '',
                    state: '',
                    city: '',
                    pin_code: '',
                    notes: ''
                });
                setModalOpen(false);
                setError('');
                fetchParties();
            }
        } catch (error) {
            console.error(`Error creating ${partyType}:`, error);
            const errorMessage = error.response?.data?.message || `Error creating ${partyType}`;
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleEditParty = async (e) => {
        e.preventDefault();

        if (!validatePhone(editForm.phone)) {
            setEditError('Phone must be a 10-digit number');
            return;
        }
        if (editForm.pin_code && !validatePinCode(editForm.pin_code)) {
            setEditError('PIN code must be a 6-digit number');
            return;
        }
        if (editForm.gst_number && !validateGST(editForm.gst_number)) {
            setEditError('Please enter a valid GST number');
            return;
        }

        try {
            const response = await axios.put(`http://localhost:5000/api/parties/update/${editForm.id}`, {
                name: editForm.name,
                phone: editForm.phone,
                email: editForm.email,
                address: editForm.address,
                gst_number: editForm.gst_number,
                state: editForm.state,
                city: editForm.city,
                pin_code: editForm.pin_code,
                notes: editForm.notes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                toast.success(`${partyType.charAt(0).toUpperCase() + partyType.slice(1)} updated successfully!`);
                setEditModalOpen(false);
                setEditError('');
                fetchParties();
            }
        } catch (error) {
            console.error(`Error updating ${partyType}:`, error);
            const errorMessage = error.response?.data?.message || `Error updating ${partyType}`;
            setEditError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleOpenEdit = (party) => {
        setEditForm({
            id: party._id,
            name: party.name || '',
            phone: party.phone || '',
            email: party.email || '',
            address: party.address || '',
            gst_number: party.gst_number || '',
            state: party.state || '',
            city: party.city || '',
            pin_code: party.pin_code || '',
            notes: party.notes || ''
        });
        setEditModalOpen(true);
        setEditError('');
    };

    const handleDeleteParty = (partyId) => {
        const party = parties.find(p => p._id === partyId);
        setConfirmModalData({
            title: `Delete ${partyType.charAt(0).toUpperCase() + partyType.slice(1)}`,
            message: `Are you sure you want to delete "${party?.name}"? This action cannot be undone.`,
            confirmText: `Delete ${partyType.charAt(0).toUpperCase() + partyType.slice(1)}`,
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: () => performDeleteParty(partyId)
        });
        setShowConfirmModal(true);
    };

    const performDeleteParty = async (partyId) => {
        try {
            const response = await axios.delete(`http://localhost:5000/api/parties/delete/${partyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                toast.success(`${partyType.charAt(0).toUpperCase() + partyType.slice(1)} deleted successfully!`);
                fetchParties();
            }
        } catch (error) {
            console.error(`Error deleting ${partyType}:`, error);
            const errorMessage = error.response?.data?.message || `Error deleting ${partyType}`;
            toast.error(errorMessage);
        } finally {
            setShowConfirmModal(false);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (page <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (page >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
            }
        }
        return pages;
    };

    // Dynamic title and labels based on party type
    const getPartyTypeLabel = () => partyType.charAt(0).toUpperCase() + partyType.slice(1);
    const getPartyTypeLabelPlural = () => getPartyTypeLabel() + 's';

    if (loading && parties.length === 0) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div className="main-data-header-row">
                                <h2 className="main-data-page-title">{getPartyTypeLabelPlural()}</h2>
                            </div>
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div>Loading {partyType}s...</div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    // Show message if no active business
    if (!activeBusinessId) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div className="main-data-header-row">
                                <h2 className="main-data-page-title">{getPartyTypeLabelPlural()}</h2>
                            </div>
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div style={{ fontSize: '1.2rem', color: '#7b7b93', marginBottom: '10px' }}>
                                    No Active Business
                                </div>
                                <div style={{ color: '#7b7b93' }}>
                                    Please select an active business to manage {partyType}s
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
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
                        <div className="main-data-header-row">
                            <div className='d-flex align-items-center justify-content-between gap-2'>
                                <h2 className="main-data-page-title">{getPartyTypeLabelPlural()}</h2>
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
                            <button className="btn-primary-add" onClick={() => setModalOpen(true)}>
                                + Add {getPartyTypeLabel()}
                            </button>
                        </div>

                        <div className="main-data-table-wrapper">
                            {parties.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '1.2rem', color: '#7b7b93', marginBottom: '10px' }}>
                                        No {partyType}s found
                                    </div>
                                    <div style={{ color: '#7b7b93' }}>
                                        {search ? 'Try adjusting your search terms' : `Add your first ${partyType} to get started`}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="modern-table-container">
                                        <table className="main-data-table modern-data-table">
                                            <thead>
                                                <tr>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            <FaUser className="table-header-icon" />
                                                            <span className="table-header-text">Name</span>
                                                        </div>
                                                    </th>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            <FaPhone className="table-header-icon" />
                                                            <span className="table-header-text">Contact</span>
                                                        </div>
                                                    </th>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            <FaEnvelope className="table-header-icon" />
                                                            <span className="table-header-text">Email</span>
                                                        </div>
                                                    </th>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            <FaMapMarkerAlt className="table-header-icon" />
                                                            <span className="table-header-text">Location</span>
                                                        </div>
                                                    </th>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            <span className="table-header-text">Balance</span>
                                                        </div>
                                                    </th>
                                                    <th className="table-header-cell actions-column">
                                                        <div className="table-header-content">
                                                            <span className="table-header-text">Actions</span>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parties.map((party, idx) => (
                                                    <tr key={party._id} className="modern-table-row" onClick={() => navigate(`/parties/${party._id}/details`)}>
                                                        <td className="table-cell name-cell">
                                                            <div className="name-content">
                                                                <div className="party-avatar">
                                                                    {party.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="name-info">
                                                                    <div className="party-name">{party.name}</div>
                                                                    <div className="party-type">
                                                                        {party.type === 'customer' ? 'Customer' : 'Supplier'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="table-cell contact-cell">
                                                            <div className="contact-info">
                                                                <div className="phone-number">{party.phone}</div>
                                                                {party.gst_number && (
                                                                    <div className="gst-info">GST: {party.gst_number}</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="table-cell email-cell">
                                                            <div className="email-content">
                                                                {party.email ? (
                                                                    <span className="email-text">{party.email}</span>
                                                                ) : (
                                                                    <span className="no-data">No email</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="table-cell location-cell">
                                                            <div className="location-content">
                                                                {party.city || party.state ? (
                                                                    <>
                                                                        {party.city && <div className="city">{party.city}</div>}
                                                                        {party.state && <div className="state">{party.state}</div>}
                                                                    </>
                                                                ) : (
                                                                    <span className="no-data">No location</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="table-cell balance-cell">
                                                            <div className="balance-content">
                                                                <div className={`balance-amount ${party.balance >= 0 ? 'positive' : 'negative'}`}>
                                                                    ₹{Math.abs(party.balance || 0).toLocaleString('en-IN')}
                                                                </div>
                                                                <div className="balance-status">
                                                                    {party.balance > 0 ? 'To Receive' : party.balance < 0 ? 'To Pay' : 'Settled'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="table-cell actions-cell" onClick={(e) => e.stopPropagation()}>
                                                            <div className="action-buttons">
                                                                <button className="action-btn edit-btn" title="Edit" onClick={() => handleOpenEdit(party)}>
                                                                    <FaEdit />
                                                                </button>
                                                                <button className="action-btn delete-btn" title="Delete" onClick={() => handleDeleteParty(party._id)}>
                                                                    <FaTrash />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="main-data-pagination">
                                <button
                                    className="main-data-pagination-arrow"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                >
                                    <FaChevronLeft />
                                </button>
                                {getPageNumbers().map((p, idx) =>
                                    p === '...'
                                        ? <span key={idx} className="main-data-pagination-info">...</span>
                                        : <button
                                            key={p}
                                            className={`main-data-pagination-page${p === page ? ' active' : ''}`}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </button>
                                )}
                                <button
                                    className="main-data-pagination-arrow"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === totalPages}
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        )}

                        {/* Add Party Modal */}
                        {modalOpen && (
                            <div className="main-data-modal-backdrop" onClick={() => setModalOpen(false)}>
                                <div className="main-data-modal" onClick={e => e.stopPropagation()}>
                                    <div className="main-data-modal-header">
                                        <h3 className="main-data-modal-title">Add {getPartyTypeLabel()}</h3>
                                        <button
                                            type="button"
                                            className="main-data-modal-close"
                                            onClick={() => setModalOpen(false)}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddParty} className="main-data-modal-form">
                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">Name
                                                <input
                                                    type="text"
                                                    name="name"
                                                    className="main-data-modal-input"
                                                    value={form.name}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </label>
                                            <label className="main-data-modal-label">Phone
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    className="main-data-modal-input"
                                                    value={form.phone}
                                                    onChange={handleChange}
                                                    required
                                                    pattern="\d{10}"
                                                    maxLength={10}
                                                />
                                            </label>
                                        </div>
                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">Email
                                                <input
                                                    type="email"
                                                    name="email"
                                                    className="main-data-modal-input"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    placeholder="Optional"
                                                />
                                            </label>
                                            <label className="main-data-modal-label">GST Number
                                                <input
                                                    type="text"
                                                    name="gst_number"
                                                    className="main-data-modal-input"
                                                    value={form.gst_number}
                                                    onChange={handleChange}
                                                    placeholder="Optional"
                                                />
                                            </label>
                                        </div>
                                        <label className="main-data-modal-label">Address
                                            <textarea
                                                name="address"
                                                className="main-data-modal-input"
                                                value={form.address}
                                                onChange={handleChange}
                                                rows="3"
                                                placeholder="Full address"
                                            />
                                        </label>
                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">State
                                                <input
                                                    type="text"
                                                    name="state"
                                                    className="main-data-modal-input"
                                                    value={form.state}
                                                    onChange={handleChange}
                                                    placeholder="State"
                                                />
                                            </label>
                                            <label className="main-data-modal-label">City
                                                <input
                                                    type="text"
                                                    name="city"
                                                    className="main-data-modal-input"
                                                    value={form.city}
                                                    onChange={handleChange}
                                                    placeholder="City"
                                                />
                                            </label>
                                        </div>
                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">PIN Code
                                                <input
                                                    type="text"
                                                    name="pin_code"
                                                    className="main-data-modal-input"
                                                    value={form.pin_code}
                                                    onChange={handleChange}
                                                    pattern="\d{6}"
                                                    maxLength={6}
                                                    placeholder="6-digit PIN code"
                                                />
                                            </label>
                                        </div>
                                        <label className="main-data-modal-label">Notes
                                            <textarea
                                                name="notes"
                                                className="main-data-modal-input"
                                                value={form.notes}
                                                onChange={handleChange}
                                                rows="3"
                                                placeholder={`Optional notes about the ${partyType}`}
                                            />
                                        </label>
                                        {error && <div className="main-data-modal-error">{error}</div>}
                                        <div className="main-data-modal-actions">
                                            <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
                                            <button type="submit" className="btn-submit">Add</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Edit Party Modal */}
                        {editModalOpen && (
                            <div className="main-data-modal-backdrop" onClick={() => setEditModalOpen(false)}>
                                <div className="main-data-modal" onClick={e => e.stopPropagation()}>
                                    <div className="main-data-modal-header">
                                        <h3 className="main-data-modal-title">Edit {getPartyTypeLabel()}</h3>
                                        <button
                                            type="button"
                                            className="main-data-modal-close"
                                            onClick={() => setModalOpen(false)}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <form onSubmit={handleEditParty} className="main-data-modal-form">
                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">Name
                                                <input
                                                    type="text"
                                                    name="name"
                                                    className="main-data-modal-input"
                                                    value={editForm.name}
                                                    onChange={handleEditChange}
                                                    required
                                                />
                                            </label>
                                            <label className="main-data-modal-label">Phone
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    className="main-data-modal-input"
                                                    value={editForm.phone}
                                                    onChange={handleEditChange}
                                                    required
                                                    pattern="\d{10}"
                                                    maxLength={10}
                                                />
                                            </label>
                                        </div>
                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">Email
                                                <input
                                                    type="email"
                                                    name="email"
                                                    className="main-data-modal-input"
                                                    value={editForm.email}
                                                    onChange={handleEditChange}
                                                    placeholder="Optional"
                                                />
                                            </label>
                                            <label className="main-data-modal-label">GST Number
                                                <input
                                                    type="text"
                                                    name="gst_number"
                                                    className="main-data-modal-input"
                                                    value={editForm.gst_number}
                                                    onChange={handleEditChange}
                                                    placeholder="Optional"
                                                />
                                            </label>
                                        </div>
                                        <label className="main-data-modal-label">Address
                                            <textarea
                                                name="address"
                                                className="main-data-modal-input"
                                                value={editForm.address}
                                                onChange={handleEditChange}
                                                rows="3"
                                                placeholder="Full address"
                                            />
                                        </label>
                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">State
                                                <input
                                                    type="text"
                                                    name="state"
                                                    className="main-data-modal-input"
                                                    value={editForm.state}
                                                    onChange={handleEditChange}
                                                    placeholder="State"
                                                />
                                            </label>
                                            <label className="main-data-modal-label">City
                                                <input
                                                    type="text"
                                                    name="city"
                                                    className="main-data-modal-input"
                                                    value={editForm.city}
                                                    onChange={handleEditChange}
                                                    placeholder="City"
                                                />
                                            </label>
                                        </div>
                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">PIN Code
                                                <input
                                                    type="text"
                                                    name="pin_code"
                                                    className="main-data-modal-input"
                                                    value={editForm.pin_code}
                                                    onChange={handleEditChange}
                                                    pattern="\d{6}"
                                                    maxLength={6}
                                                    placeholder="6-digit PIN code"
                                                />
                                            </label>
                                        </div>
                                        <label className="main-data-modal-label">Notes
                                            <textarea
                                                name="notes"
                                                className="main-data-modal-input"
                                                value={editForm.notes}
                                                onChange={handleEditChange}
                                                rows="3"
                                                placeholder={`Optional notes about the ${partyType}`}
                                            />
                                        </label>
                                        {editError && <div className="main-data-modal-error">{editError}</div>}
                                        <div className="main-data-modal-actions">
                                            <button type="button" className="btn-cancel" onClick={() => setEditModalOpen(false)}>Cancel</button>
                                            <button type="submit" className="btn-submit">Save</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

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
                    </main>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
