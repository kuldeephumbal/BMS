import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import { BASE_URL } from '../components/BaseURL';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes } from 'react-icons/fa';

export default function Cashbook() {
    // Sidebar
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };

    // Auth
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    // Active business
    const [activeBusiness, setActiveBusiness] = useState(null);
    const [activeBusinessId, setActiveBusinessId] = useState(() => localStorage.getItem('activeBusinessId') || '');

    // Data
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination / meta (for future use)
    const [page] = useState(1); // reserved for future pagination
    const [limit] = useState(200);

    // Search only
    const [search, setSearch] = useState('');

    // Date helper
    const todayISO = new Date().toISOString().substring(0, 10);

    // Modal / form
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [formError, setFormError] = useState('');
    const initialForm = { amount: '', type: 'in', method: 'cash', note: '', date: '' };
    const [form, setForm] = useState(initialForm);

    // Confirm delete
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({});

    const resetForm = () => { setForm(initialForm); setEditingEntry(null); setFormError(''); };
    const handleOpenAdd = () => { resetForm(); setModalOpen(true); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!activeBusinessId) return 'No active business selected.';
        if (!form.amount || parseFloat(form.amount) <= 0) return 'Amount must be greater than 0.';
        if (!form.type) return 'Type (in/out) is required.';
        if (!form.method) return 'Method (cash/online) is required.';
        // note optional
        // date optional (backend defaults to today if missing)
        return '';
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setForm({
            amount: entry.amount?.toString() || '',
            type: entry.type || 'in',
            method: entry.method || 'cash',
            note: entry.note || '',
            date: entry.date ? new Date(entry.date).toISOString().substring(0, 10) : todayISO
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        const err = validateForm();
        if (err) { setFormError(err); return; }
        const body = {
            userId: user._id,
            businessId: activeBusinessId,
            amount: parseFloat(form.amount),
            type: form.type,
            method: form.method,
            note: form.note.trim(),
            date: form.date || undefined
        };
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        if (editingEntry) {
            axios.put(`${BASE_URL}/cashbook/${editingEntry._id}`, body, config)
                .then(res => {
                    toast.success('Entry updated successfully');
                    setEntries(prev => prev.map(en => en._id === editingEntry._id ? res.data.cashbook : en));
                    setModalOpen(false); resetForm();
                })
                .catch(err2 => {
                    console.error('Update entry error:', err2);
                    toast.error(err2?.response?.data?.message || 'Error updating entry');
                });
        } else {
            axios.post(`${BASE_URL}/cashbook`, body, config)
                .then(res => {
                    toast.success('Entry created successfully');
                    setEntries(prev => [res.data.cashbook, ...prev]);
                    setModalOpen(false); resetForm();
                })
                .catch(err2 => {
                    console.error('Create entry error:', err2);
                    toast.error(err2?.response?.data?.message || 'Error creating entry');
                });
        }
    };

    const handleDelete = (id) => {
        const entry = entries.find(en => en._id === id);
        setConfirmModalData({
            title: 'Delete Cashbook Entry',
            message: `Are you sure you want to delete entry of amount ${entry?.amount}?`,
            onConfirm: () => {
                axios.delete(`${BASE_URL}/cashbook/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                    .then(() => {
                        toast.success('Entry deleted successfully');
                        setEntries(prev => prev.filter(en => en._id !== id));
                        setShowConfirmModal(false);
                    })
                    .catch(err2 => {
                        console.error('Delete entry error:', err2);
                        toast.error(err2?.response?.data?.message || 'Error deleting entry');
                    });
            }
        });
        setShowConfirmModal(true);
    };

    const fetchActiveBusiness = useCallback(() => {
        if (!user?._id) return;
        axios.get(`${BASE_URL}/business/active/${user._id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => {
                if (res.data && res.data.business) {
                    setActiveBusiness(res.data.business);
                    setActiveBusinessId(res.data.business._id);
                    localStorage.setItem('activeBusinessId', res.data.business._id);
                }
            })
            .catch(err2 => { console.error('Fetch active business error:', err2); });
    }, [token, user._id]);

    const fetchEntries = useCallback(() => {
        if (!user?._id || !activeBusinessId) return;
        setLoading(true);
        axios.get(`${BASE_URL}/cashbook`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
                userId: user._id,
                businessId: activeBusinessId,
                page,
                limit
            }
        }).then(res => {
            if (res.data && res.data.cashbooks) {
                setEntries(res.data.cashbooks);
            }
        }).catch(err2 => {
            console.error('Fetch entries error:', err2);
            toast.error('Error fetching entries');
        }).finally(() => setLoading(false));
    }, [token, user._id, activeBusinessId, page, limit]);

    useEffect(() => { fetchActiveBusiness(); }, [fetchActiveBusiness]);
    useEffect(() => { fetchEntries(); }, [fetchEntries]);
    useEffect(() => { const handler = () => fetchActiveBusiness(); window.addEventListener('activeBusinessChanged', handler); return () => window.removeEventListener('activeBusinessChanged', handler); }, [fetchActiveBusiness]);

    if (!activeBusinessId) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <div className="main-content">
                            <div className="common-card text-center p-5">
                                <h2 className="mb-3">No Active Business</h2>
                                <p className="text-muted mb-4">Please create and activate a business before managing cashbook entries.</p>
                                <a className="btn-primary-add" href="/business">Go to Business Setup</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const filteredEntries = entries.filter(en => {
        if (!search) return true;
        return en.note?.toLowerCase().includes(search.toLowerCase()) || String(en.amount).includes(search);
    });

    const formatAmount = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amt || 0);

    return (
        <div className="main-layout-root">
            <div className="main-layout-row">
                <Sidebar open={sidebarOpen} />
                <div className="main-content-container">
                    <Header onToggleSidebar={handleToggleSidebar} />
                    <div className="main-content">
                        <div className="main-data-header-row">
                            <div className="d-flex align-items-center justify-content-between w-100">
                                <div className="d-flex align-items-center gap-3">
                                    <h1 className="main-data-page-title d-flex align-items-center gap-2">Cashbook</h1>
                                    <div style={{ position: 'relative', maxWidth: 400 }}>
                                        <FaSearch style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: '#888', fontSize: 16, zIndex: 1 }} />
                                        <input
                                            type="text"
                                            placeholder="Search here..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            style={{ width: '100%', padding: '12px 16px 12px 40px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '1rem', outline: 'none', backgroundColor: '#fff' }}
                                            onFocus={e => e.target.style.borderColor = '#232526'}
                                            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                                        />
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <button className="btn-primary-add" onClick={handleOpenAdd}><FaPlus /> Add Entry</button>
                                </div>
                            </div>
                        </div>

                        <div className="main-data-table-wrapper">
                            <table className="main-data-table product-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>DATE</th>
                                        <th style={{ textAlign: 'left' }}>TYPE</th>
                                        <th style={{ textAlign: 'left' }}>METHOD</th>
                                        <th style={{ textAlign: 'right' }}>AMOUNT</th>
                                        <th style={{ textAlign: 'left' }}>NOTE</th>
                                        <th style={{ textAlign: 'left' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6" className="text-center py-4">Loading entries...</td></tr>
                                    ) : filteredEntries.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-4">{search ? 'No entries match your search.' : 'No entries found. Add your first entry!'}</td></tr>
                                    ) : (
                                        filteredEntries.map(entry => (
                                            <tr key={entry._id} className="main-data-table-row">
                                                <td style={{ textAlign: 'left' }}>{new Date(entry.date).toLocaleDateString()}</td>
                                                <td style={{ textAlign: 'left' }}><span className={`badge ${entry.type === 'in' ? 'bg-success' : 'bg-danger'}`}>{entry.type}</span></td>
                                                <td style={{ textAlign: 'left' }}><span className={`badge ${entry.method === 'cash' ? 'bg-secondary' : 'bg-info'}`}>{entry.method}</span></td>
                                                <td className="fw-bold" style={{ textAlign: 'right' }}>{formatAmount(entry.amount)}</td>
                                                <td style={{ textAlign: 'left' }}>{entry.note}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="btn-edit" onClick={() => handleEdit(entry)} title="Edit Entry"><FaEdit /></button>
                                                        <button className="btn-delete-icon" onClick={() => handleDelete(entry._id)} title="Delete Entry"><FaTrash /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {modalOpen && (
                            <div className="main-data-modal-backdrop">
                                <div className="main-data-modal" style={{ maxWidth: 640 }}>
                                    <div className="main-data-modal-header">
                                        <h2 className="main-data-modal-title">{editingEntry ? 'Edit Cashbook Entry' : 'Add Cashbook Entry'}</h2>
                                        <button type="button" className="main-data-modal-close" onClick={() => { setModalOpen(false); resetForm(); }}><FaTimes /></button>
                                    </div>
                                    <form onSubmit={handleSubmit} className="main-data-modal-form">
                                        {formError && <div className="main-data-modal-error">{formError}</div>}
                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Active Business
                                                <input type="text" value={activeBusiness?.business_name || 'Active Business'} className="main-data-modal-input" disabled />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Amount *
                                                <input type="number" name="amount" value={form.amount} onChange={handleChange} className="main-data-modal-input" placeholder="0" min="0" step="0.01" required />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Type *
                                                <select name="type" value={form.type} onChange={handleChange} className="main-data-modal-input" required>
                                                    <option value="in">In</option>
                                                    <option value="out">Out</option>
                                                </select>
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Method *
                                                <select name="method" value={form.method} onChange={handleChange} className="main-data-modal-input" required>
                                                    <option value="cash">Cash</option>
                                                    <option value="online">Online</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Date
                                                <input type="date" name="date" value={form.date} onChange={handleChange} className="main-data-modal-input" />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 2 }}>
                                                Note
                                                <input type="text" name="note" value={form.note} onChange={handleChange} className="main-data-modal-input" placeholder="Description (optional)" />
                                            </label>
                                        </div>
                                        <div className="main-data-modal-actions">
                                            <button type="button" className="btn-cancel" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</button>
                                            <button type="submit" className="btn-save">{editingEntry ? 'Update Entry' : 'Add Entry'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <ConfirmModal isOpen={showConfirmModal} title={confirmModalData.title} message={confirmModalData.message} onConfirm={confirmModalData.onConfirm} onClose={() => setShowConfirmModal(false)} />
                        <ToastContainer position="top-right" autoClose={3000} />
                    </div>
                </div>
            </div>
        </div>
    );
}

