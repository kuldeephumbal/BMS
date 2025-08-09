import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import { BASE_URL } from '../components/BaseURL';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCogs, FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaRupeeSign } from 'react-icons/fa';

export default function Service() {
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

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    const [activeBusiness, setActiveBusiness] = useState(null);
    const [activeBusinessId, setActiveBusinessId] = useState(() => localStorage.getItem('activeBusinessId') || '');

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formError, setFormError] = useState('');
    const initialForm = { name: '', price: '', unit: '', includeTax: false, SACCode: '', GST: '', image: null };
    const [form, setForm] = useState(initialForm);
    const [imagePreview, setImagePreview] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({});

    const resetForm = () => { setForm(initialForm); setEditingService(null); setFormError(''); setImagePreview(null); };
    const handleOpenAdd = () => { resetForm(); setModalOpen(true); };
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') { const file = files[0]; setForm(p => ({ ...p, image: file })); setImagePreview(file ? URL.createObjectURL(file) : null); return; }
        setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };
    const validateForm = () => {
        if (!activeBusinessId) return 'No active business selected.';
        if (!form.name || !form.price || !form.unit || !form.SACCode || !form.GST) return 'Name, Price, Unit, SAC Code, GST are required.';
        if (parseFloat(form.price) <= 0) return 'Price must be greater than 0.';
        return '';
    };
    const handleEdit = (service) => {
        setEditingService(service);
        setForm({ name: service.name || '', price: service.price?.toString() || '', unit: service.unit || '', includeTax: service.includeTax || false, SACCode: service.SACCode || '', GST: service.GST || '', image: null });
        setImagePreview(service.image ? `${BASE_URL}/uploads/logos/${service.image}` : null);
        setFormError('');
        setModalOpen(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault(); setFormError('');
        const err = validateForm(); if (err) { setFormError(err); return; }
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        if (editingService) {
            const body = { name: form.name.trim(), price: parseFloat(form.price), unit: form.unit.trim(), includeTax: form.includeTax, SACCode: form.SACCode.trim(), GST: form.GST.trim(), businessId: activeBusinessId };
            axios.put(`${BASE_URL}/service/${editingService._id}`, body, config)
                .then(res => { toast.success('Service updated successfully'); setServices(prev => prev.map(s => s._id === editingService._id ? res.data.service : s)); setModalOpen(false); resetForm(); })
                .catch(err => { console.error('Update service error:', err); toast.error(err?.response?.data?.message || 'Error updating service'); });
        } else {
            const body = { userId: user._id, businessId: activeBusinessId, name: form.name.trim(), image: form.image ? form.image.name : 'placeholder.png', price: parseFloat(form.price), unit: form.unit.trim(), includeTax: form.includeTax, SACCode: form.SACCode.trim(), GST: form.GST.trim() };
            axios.post(`${BASE_URL}/service`, body, config)
                .then(res => { toast.success('Service created successfully'); setServices(prev => [res.data.service, ...prev]); setModalOpen(false); resetForm(); })
                .catch(err => { console.error('Create service error:', err); toast.error(err?.response?.data?.message || 'Error creating service'); });
        }
    };
    const handleDelete = (id) => {
        const service = services.find(s => s._id === id);
        setConfirmModalData({
            title: 'Delete Service',
            message: `Are you sure you want to delete service "${service?.name}"?`,
            onConfirm: () => {
                axios.delete(`${BASE_URL}/service/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                    .then(() => {
                        toast.success('Service deleted successfully');
                        setServices(prev => prev.filter(s => s._id !== id));
                        setShowConfirmModal(false);
                    })
                    .catch(err => {
                        console.error('Delete service error:', err);
                        toast.error(err?.response?.data?.message || 'Error deleting service');
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
            .catch(err => {
                console.error('Fetch active business error:', err);
            });
    }, [token, user._id]);
    const fetchServices = useCallback(() => {
        if (!user?._id || !activeBusinessId) return;
        setLoading(true);
        axios.get(`${BASE_URL}/service`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { userId: user._id, businessId: activeBusinessId, page: 1, limit: 200 }
        })
            .then(res => {
                if (res.data && res.data.services) setServices(res.data.services);
            })
            .catch(err => {
                console.error('Fetch services error:', err);
                toast.error('Error fetching services');
            })
            .finally(() => setLoading(false));
    }, [token, user._id, activeBusinessId]);
    useEffect(() => { fetchActiveBusiness(); }, [fetchActiveBusiness]);
    useEffect(() => { fetchServices(); }, [fetchServices]);
    useEffect(() => { const handler = () => fetchActiveBusiness(); window.addEventListener('activeBusinessChanged', handler); return () => window.removeEventListener('activeBusinessChanged', handler); }, [fetchActiveBusiness]);

    if (!activeBusinessId) {
        return (<div className="main-layout-root"><div className="main-layout-row"><Sidebar open={sidebarOpen} /><div className="main-content-container"><Header onToggleSidebar={handleToggleSidebar} /><div className="main-content"><div className="common-card text-center p-5"><h2 className="mb-3">No Active Business</h2><p className="text-muted mb-4">Please create and activate a business before managing services.</p><a className="btn-primary-add" href="/business">Go to Business Setup</a></div></div></div></div></div>);
    }
    const filteredServices = services.filter(s => { if (!search) return true; return (s.name?.toLowerCase().includes(search.toLowerCase()) || s.SACCode?.toLowerCase().includes(search.toLowerCase()) || s.GST?.toLowerCase().includes(search.toLowerCase())); });
    const formatCurrency = (amount) => { if (amount === null || amount === undefined) return '-'; return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0); };

    return (
        <div className="main-layout-root">
            <div className="main-layout-row">
                <Sidebar open={sidebarOpen} />
                <div className="main-content-container">
                    <Header onToggleSidebar={handleToggleSidebar} />
                    <div className="main-content">
                        <div className="main-data-header-row">
                            <div className="d-flex align-items-center justify-content-between w-100">
                                <h1 className="main-data-page-title d-flex align-items-center gap-2"><FaCogs /> Services Management</h1>
                                <button className="btn-primary-add" onClick={handleOpenAdd}><FaPlus /> Add Service</button>
                            </div>
                        </div>
                        <div className="common-card">
                            <div className="common-card-header d-flex align-items-center justify-content-between">
                                <div style={{ position: 'relative', maxWidth: 400 }}>
                                    <FaSearch style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: '#888', fontSize: 16, zIndex: 1 }} />
                                    <input type="text" placeholder="Search by name / SAC / GST..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 40px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '1rem', outline: 'none', backgroundColor: '#fff' }} onFocus={e => e.target.style.borderColor = '#232526'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                                </div>
                            </div>
                            <div className="main-data-table-wrapper">
                                <table className="main-data-table product-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Image</th>
                                            <th>Unit</th>
                                            <th className="text-end">Price</th>
                                            <th>SAC</th>
                                            <th>GST</th>
                                            <th>Tax Incl.</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (<tr><td colSpan="8" className="text-center py-4">Loading services...</td></tr>) : filteredServices.length === 0 ? (<tr><td colSpan="8" className="text-center py-4">{search ? 'No services match your search.' : 'No services found. Add your first service!'}</td></tr>) : (filteredServices.map(service => (
                                            <tr key={service._id} className="main-data-table-row">
                                                <td>{service.name}</td>
                                                <td>{service.image ? (<img src={`${BASE_URL}/uploads/logos/${service.image}`} alt={service.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />) : <span className="text-muted">No Image</span>}</td>
                                                <td>{service.unit}</td>
                                                <td className="fw-bold text-end">{formatCurrency(service.price)}</td>
                                                <td>{service.SACCode}</td>
                                                <td>{service.GST}</td>
                                                <td>{service.includeTax ? 'Yes' : 'No'}</td>
                                                <td><div className="d-flex gap-1"><button className="main-data-icon-btn" onClick={() => handleEdit(service)} title="Edit Service"><FaEdit /></button><button className="main-data-icon-btn text-danger" onClick={() => handleDelete(service._id)} title="Delete Service"><FaTrash /></button></div></td>
                                            </tr>)))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {modalOpen && (<div className="main-data-modal-backdrop"><div className="main-data-modal" style={{ maxWidth: 720 }}><div className="main-data-modal-header"><h2 className="main-data-modal-title">{editingService ? 'Edit Service' : 'Add New Service'}</h2><button type="button" className="main-data-modal-close" onClick={() => { setModalOpen(false); resetForm(); }}><FaTimes /></button></div><form onSubmit={handleSubmit} className="main-data-modal-form">{formError && <div className="main-data-modal-error">{formError}</div>}<div className="main-data-modal-row"><label className="main-data-modal-label" style={{ flex: 1 }}>Active Business<input type="text" value={activeBusiness?.business_name || 'Active Business'} className="main-data-modal-input" disabled /></label><label className="main-data-modal-label" style={{ flex: 1 }}>Name *<input type="text" name="name" value={form.name} onChange={handleChange} className="main-data-modal-input" placeholder="Service name" required /></label><label className="main-data-modal-label" style={{ flex: 1 }}>Unit *<input type="text" name="unit" value={form.unit} onChange={handleChange} className="main-data-modal-input" placeholder="e.g., hrs" required /></label></div><div className="main-data-modal-row"><label className="main-data-modal-label" style={{ flex: 1 }}>Price *<div className="d-flex align-items-center gap-2"><span className="text-muted"><FaRupeeSign size={14} /></span><input type="number" name="price" value={form.price} onChange={handleChange} className="main-data-modal-input" placeholder="0" min="0" step="0.01" required /></div></label><label className="main-data-modal-label" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" name="includeTax" checked={form.includeTax} onChange={handleChange} style={{ width: 18, height: 18 }} /> Tax Included</label><label className="main-data-modal-label" style={{ flex: 1 }}>Image<input type="file" name="image" accept="image/*" onChange={handleChange} className="main-data-modal-input" /></label></div>{imagePreview && (<div style={{ marginBottom: 16 }}><img src={imagePreview} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} /></div>)}<div className="main-data-modal-row"><label className="main-data-modal-label" style={{ flex: 1 }}>SAC Code *<input type="text" name="SACCode" value={form.SACCode} onChange={handleChange} className="main-data-modal-input" placeholder="SAC Code" required /></label><label className="main-data-modal-label" style={{ flex: 1 }}>GST *<input type="text" name="GST" value={form.GST} onChange={handleChange} className="main-data-modal-input" placeholder="GST" required /></label></div><div className="main-data-modal-actions"><button type="button" className="btn-cancel" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</button><button type="submit" className="btn-save">{editingService ? 'Update Service' : 'Add Service'}</button></div></form></div></div>)}
                        <ConfirmModal isOpen={showConfirmModal} title={confirmModalData.title} message={confirmModalData.message} onConfirm={confirmModalData.onConfirm} onClose={() => setShowConfirmModal(false)} />
                        <ToastContainer position="top-right" autoClose={3000} />
                    </div>
                </div>
            </div>
        </div>
    );
}

