import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import axios from 'axios';
import { BASE_URL } from '../components/BaseURL';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaPlus, FaBoxes, FaExchangeAlt, FaTrash, FaEdit } from 'react-icons/fa';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const token = localStorage.getItem('token');
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Stock form state
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [editingStock, setEditingStock] = useState(null);
    const [stockForm, setStockForm] = useState({
        type: 'IN',
        quantity: '',
        purchasePrice: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });
    const [stockError, setStockError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({});

    // Stock records
    const [records, setRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [recordsPage, setRecordsPage] = useState(1);
    const [recordsTotalPages, setRecordsTotalPages] = useState(1);
    const [recordsLimit] = useState(20);

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
    const formatDate = (d) => new Date(d).toLocaleDateString();

    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
    };

    const fetchProduct = useCallback(() => {
        if (!id) return;
        setLoading(true);
        axios.get(`${BASE_URL}/product/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                setProduct(res.data.product);
                setError('');
            })
            .catch(err => {
                setError(err?.response?.data?.message || 'Error fetching product');
            })
            .finally(() => setLoading(false));
    }, [id, token]);

    const fetchStockRecords = useCallback(() => {
        if (!id) return;
        setRecordsLoading(true);
        axios.get(`${BASE_URL}/stock`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { productId: id, page: recordsPage, limit: recordsLimit }
        }).then(res => {
            setRecords(res.data.records || []);
            setRecordsTotalPages(res.data.totalPages || 1);
        }).catch(err => {
            toast.error(err?.response?.data?.message || 'Error fetching stock history');
        }).finally(() => setRecordsLoading(false));
    }, [id, token, recordsPage, recordsLimit]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    useEffect(() => {
        fetchStockRecords();
    }, [fetchStockRecords]);

    const openAddStock = () => {
        setEditingStock(null);
        setStockForm({ type: 'IN', quantity: '', purchasePrice: product?.purchasePrice || '', date: new Date().toISOString().split('T')[0], note: '' });
        setStockError('');
        setStockModalOpen(true);
    };

    const openEditStock = (rec) => {
        setEditingStock(rec);
        setStockForm({ type: rec.type, quantity: rec.quantity.toString(), purchasePrice: rec.purchasePrice.toString(), date: rec.date.split('T')[0], note: rec.note || '' });
        setStockError('');
        setStockModalOpen(true);
    };

    const handleStockChange = (e) => {
        const { name, value } = e.target;
        setStockForm(prev => ({ ...prev, [name]: value }));
    };

    const validateStockForm = () => {
        if (!stockForm.type || !['IN', 'OUT'].includes(stockForm.type)) return 'Type required (IN or OUT).';
        if (stockForm.quantity === '' || Number(stockForm.quantity) < 0) return 'Quantity must be >= 0';
        if (stockForm.purchasePrice === '' || Number(stockForm.purchasePrice) < 0) return 'Purchase Price must be >= 0';
        return '';
    };

    const handleStockSubmit = (e) => {
        e.preventDefault();
        setStockError('');
        const err = validateStockForm();
        if (err) { setStockError(err); return; }

        const payload = {
            productId: id,
            type: stockForm.type,
            quantity: Number(stockForm.quantity),
            purchasePrice: Number(stockForm.purchasePrice),
            date: stockForm.date,
            note: stockForm.note.trim()
        };

        if (editingStock) {
            axios.put(`${BASE_URL}/stock/${editingStock._id}`, payload, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
                .then(res => {
                    toast.success('Stock record updated');
                    setRecords(prev => prev.map(r => r._id === editingStock._id ? res.data.stock : r));
                    setProduct(p => ({ ...p, openingStock: res.data.currentStock }));
                    setStockModalOpen(false);
                })
                .catch(err => toast.error(err?.response?.data?.message || 'Update failed'));
        } else {
            axios.post(`${BASE_URL}/stock`, payload, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
                .then(res => {
                    toast.success('Stock record added');
                    setRecords(prev => [res.data.stock, ...prev]);
                    setProduct(p => ({ ...p, openingStock: res.data.currentStock }));
                    setStockModalOpen(false);
                })
                .catch(err => toast.error(err?.response?.data?.message || 'Create failed'));
        }
    };

    const handleDeleteStock = (rec) => {
        setConfirmModalData({
            title: 'Delete Stock Record',
            message: `Delete ${rec.type} record of qty ${rec.quantity}?`,
            onConfirm: () => {
                axios.delete(`${BASE_URL}/stock/${rec._id}`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => {
                        toast.success('Stock record deleted');
                        setRecords(prev => prev.filter(r => r._id !== rec._id));
                        setProduct(p => ({ ...p, openingStock: res.data.currentStock }));
                        setShowConfirmModal(false);
                    })
                    .catch(err => toast.error(err?.response?.data?.message || 'Delete failed'));
            }
        });
        setShowConfirmModal(true);
    };

    if (loading) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <div className="main-content p-4">Loading product...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <div className="main-content p-4 text-danger">{error || 'Product not found'}</div>
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
                    <div className="main-content">
                        <div className="main-data-header-row">
                            <div className="d-flex align-items-center justify-content-between w-100">
                                <h1 className="main-data-page-title d-flex align-items-center gap-2">
                                    <button className="btn btn-link p-0 me-3" onClick={() => navigate('/products')}><FaArrowLeft /></button>
                                    <FaBoxes /> {product.name}
                                </h1>
                                <button className="btn-primary-add" onClick={openAddStock}><FaPlus /> Stock Movement</button>
                            </div>
                        </div>

                        <div className="common-card mb-3">
                            <div className="row g-3 p-3">
                                <div className="col-md-3">
                                    <div className="small text-muted">Current Stock</div>
                                    <div className="h5 mb-0">{product.openingStock}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="small text-muted">Sale Price</div>
                                    <div className="h5 mb-0">{formatCurrency(product.salePrice)}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="small text-muted">Purchase Price</div>
                                    <div className="h5 mb-0">{formatCurrency(product.purchasePrice)}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="small text-muted">Low Stock Alert</div>
                                    <div className="h5 mb-0">{product.lowStockAlert}</div>
                                </div>
                            </div>
                        </div>

                        <div className="common-card">
                            <div className="common-card-header d-flex align-items-center justify-content-between">
                                <h2 className="h6 mb-0 d-flex align-items-center gap-2"><FaExchangeAlt /> Stock History</h2>
                            </div>
                            <div className="main-data-table-wrapper">
                                <table className="main-data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th className="text-end">Quantity</th>
                                            <th className="text-end">Purchase Price</th>
                                            <th className="text-end">Total</th>
                                            <th>Note</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recordsLoading ? (
                                            <tr><td colSpan="7" className="text-center py-3">Loading...</td></tr>
                                        ) : records.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center py-3">No stock records found.</td></tr>
                                        ) : (
                                            records.map(r => (
                                                <tr key={r._id} className="main-data-table-row">
                                                    <td>{formatDate(r.date)}</td>
                                                    <td className={r.type === 'IN' ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>{r.type}</td>
                                                    <td className="text-end">{r.quantity}</td>
                                                    <td className="text-end">{formatCurrency(r.purchasePrice)}</td>
                                                    <td className="text-end">{formatCurrency(r.purchasePrice * r.quantity)}</td>
                                                    <td>{r.note || '-'}</td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <button className="main-data-icon-btn" onClick={() => openEditStock(r)} title="Edit"><FaEdit /></button>
                                                            <button className="main-data-icon-btn text-danger" onClick={() => handleDeleteStock(r)} title="Delete"><FaTrash /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {recordsTotalPages > 1 && (
                                <div className="d-flex justify-content-between align-items-center p-3">
                                    <div className="small text-muted">Page {recordsPage} of {recordsTotalPages}</div>
                                    <div className="d-flex gap-2">
                                        <button disabled={recordsPage === 1} onClick={() => setRecordsPage(p => p - 1)} className="btn btn-sm btn-outline-secondary">Prev</button>
                                        <button disabled={recordsPage === recordsTotalPages} onClick={() => setRecordsPage(p => p + 1)} className="btn btn-sm btn-outline-secondary">Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {stockModalOpen && (
                <div className="main-data-modal-backdrop">
                    <div className="main-data-modal" style={{ maxWidth: 520 }}>
                        <div className="main-data-modal-header">
                            <h2 className="main-data-modal-title">{editingStock ? 'Edit Stock Record' : 'Add Stock Movement'}</h2>
                            <button type="button" className="main-data-modal-close" onClick={() => setStockModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleStockSubmit} className="main-data-modal-form">
                            {stockError && <div className="main-data-modal-error">{stockError}</div>}
                            <div className="main-data-modal-row">
                                <label className="main-data-modal-label" style={{ flex: 1 }}>
                                    Type *
                                    <select name="type" value={stockForm.type} onChange={handleStockChange} className="main-data-modal-input" required>
                                        <option value="IN">IN (Add)</option>
                                        <option value="OUT">OUT (Remove)</option>
                                    </select>
                                </label>
                                <label className="main-data-modal-label" style={{ flex: 1 }}>
                                    Quantity *
                                    <input type="number" name="quantity" min="0" value={stockForm.quantity} onChange={handleStockChange} className="main-data-modal-input" required />
                                </label>
                            </div>
                            <div className="main-data-modal-row">
                                <label className="main-data-modal-label" style={{ flex: 1 }}>
                                    Purchase Price *
                                    <input type="number" name="purchasePrice" min="0" value={stockForm.purchasePrice} onChange={handleStockChange} className="main-data-modal-input" required />
                                </label>
                                <label className="main-data-modal-label" style={{ flex: 1 }}>
                                    Date *
                                    <input type="date" name="date" value={stockForm.date} onChange={handleStockChange} className="main-data-modal-input" required />
                                </label>
                            </div>
                            <label className="main-data-modal-label">
                                Note
                                <textarea name="note" rows="2" value={stockForm.note} onChange={handleStockChange} className="main-data-modal-input" placeholder="Optional note" />
                            </label>
                            <div className="main-data-modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setStockModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-save">{editingStock ? 'Update' : 'Add'} Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showConfirmModal}
                title={confirmModalData.title}
                message={confirmModalData.message}
                onConfirm={confirmModalData.onConfirm}
                onClose={() => setShowConfirmModal(false)}
            />

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}
