import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import { BASE_URL } from '../components/BaseURL';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaBoxOpen,
    FaTimes
} from 'react-icons/fa';

export default function Product() {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    // Data
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);

    // Search
    const [search, setSearch] = useState('');

    // Total inventory value (must be before any conditional return)
    const totalInventoryValue = useMemo(() => {
        return products.reduce((sum, p) => {
            const qty = Number(p.openingStock) || 0;
            const rate = Number(p.purchasePrice) || 0;
            return sum + qty * rate;
        }, 0);
    }, [products]);

    // Modal / Form
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productError, setProductError] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    const initialForm = {
        businessId: '', // will be set automatically from activeBusinessId
        name: '',
        primaryUnit: '',
        secondaryUnit: '',
        salePrice: '',
        purchasePrice: '',
        taxIncluded: false,
        openingStock: '',
        lowStockAlert: '',
        HSN: '',
        GST: '',
        note: '',
        image: null
    };
    const [form, setForm] = useState(initialForm);

    // Confirm Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({});

    const navigate = useNavigate();

    // Active business
    const [activeBusiness, setActiveBusiness] = useState(null);
    const [activeBusinessId, setActiveBusinessId] = useState(() => localStorage.getItem('activeBusinessId') || '');

    // Handlers
    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingProduct(null);
        setImagePreview(null);
        setProductError('');
    };

    const handleOpenAdd = () => {
        resetForm();
        setProductModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            setForm(prev => ({ ...prev, image: file }));
            if (file) setImagePreview(URL.createObjectURL(file)); else setImagePreview(null);
            return;
        }
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setForm({
            businessId: activeBusinessId || product.businessId || '',
            name: product.name || '',
            primaryUnit: product.primaryUnit || '',
            secondaryUnit: product.secondaryUnit || '',
            salePrice: product.salePrice?.toString() || '',
            purchasePrice: product.purchasePrice?.toString() || '',
            taxIncluded: product.taxIncluded || false,
            openingStock: product.openingStock?.toString() || '',
            lowStockAlert: product.lowStockAlert?.toString() || '',
            HSN: product.HSN || '',
            GST: product.GST || '',
            note: product.note || '',
            image: null
        });
        setImagePreview(product.image ? `${BASE_URL}/uploads/logos/${product.image}` : null);
        setProductError('');
        setProductModalOpen(true);
    };

    const validateForm = () => {
        if (!activeBusinessId) return 'No active business selected. Activate a business first.';
        if (!form.name || !form.primaryUnit || !form.salePrice || !form.purchasePrice || form.openingStock === '' || form.lowStockAlert === '') {
            return 'Name, Primary Unit, Sale Price, Purchase Price, Opening Stock, Low Stock Alert are required.';
        }
        if (!editingProduct && !form.image) {
            // image optional now
        }
        if (parseFloat(form.salePrice) <= 0 || parseFloat(form.purchasePrice) <= 0) {
            return 'Sale & Purchase price must be greater than 0.';
        }
        if (parseFloat(form.openingStock) < 0 || parseFloat(form.lowStockAlert) < 0) {
            return 'Opening Stock and Low Stock Alert must be >= 0';
        }
        return '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProductError('');
        const err = validateForm();
        if (err) { setProductError(err); return; }

        const fd = new FormData();
        fd.append('userId', user._id);
        fd.append('businessId', activeBusinessId); // use active business id
        fd.append('name', form.name.trim());
        fd.append('primaryUnit', form.primaryUnit.trim());
        if (form.secondaryUnit) fd.append('secondaryUnit', form.secondaryUnit.trim());
        fd.append('salePrice', form.salePrice);
        fd.append('purchasePrice', form.purchasePrice);
        fd.append('taxIncluded', form.taxIncluded);
        if (form.openingStock) fd.append('openingStock', form.openingStock);
        if (form.lowStockAlert) fd.append('lowStockAlert', form.lowStockAlert);
        fd.append('HSN', form.HSN.trim());
        fd.append('GST', form.GST.trim());
        if (form.note) fd.append('note', form.note.trim());
        if (form.image) fd.append('image', form.image);

        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        };

        if (editingProduct) {
            axios.put(`${BASE_URL}/product/${editingProduct._id}`, fd, config)
                .then(res => {
                    toast.success('Product updated successfully');
                    setProducts(prev => prev.map(p => p._id === editingProduct._id ? res.data.product : p));
                    setProductModalOpen(false);
                    resetForm();
                })
                .catch(err => {
                    console.error('Update product error:', err);
                    toast.error(err?.response?.data?.message || 'Error updating product');
                });
        } else {
            axios.post(`${BASE_URL}/product`, fd, config)
                .then(res => {
                    toast.success('Product created successfully');
                    setProducts(prev => [res.data.product, ...prev]);
                    setProductModalOpen(false);
                    resetForm();
                })
                .catch(err => {
                    console.error('Create product error:', err);
                    toast.error(err?.response?.data?.message || 'Error creating product');
                });
        }
    };

    const handleDelete = (id) => {
        const product = products.find(p => p._id === id);
        setConfirmModalData({
            title: 'Delete Product',
            message: `Are you sure you want to delete product "${product?.name}"?`,
            onConfirm: () => {
                axios.delete(`${BASE_URL}/product/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(() => {
                    toast.success('Product deleted successfully');
                    setProducts(prev => prev.filter(p => p._id !== id));
                    setShowConfirmModal(false);
                }).catch(err => {
                    console.error('Delete product error:', err);
                    toast.error(err?.response?.data?.message || 'Error deleting product');
                });
            }
        });
        setShowConfirmModal(true);
    };

    const fetchProducts = useCallback(() => {
        if (!user?._id || !activeBusinessId) return;
        setProductsLoading(true);
        axios.get(`${BASE_URL}/product`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { userId: user._id, businessId: activeBusinessId, page: 1, limit: 100 }
        }).then(res => {
            if (res.data && res.data.products) setProducts(res.data.products);
        }).catch(err => {
            console.error('Fetch products error:', err);
            toast.error('Error fetching products');
        }).finally(() => setProductsLoading(false));
    }, [token, user._id, activeBusinessId]);

    // Fetch active business similar to Parties page / Sidebar
    const fetchActiveBusiness = useCallback(() => {
        if (!user?._id) return;
        axios.get(`${BASE_URL}/business/active/${user._id}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }).then(res => {
            if (res.data && res.data.business) {
                setActiveBusiness(res.data.business);
                setActiveBusinessId(res.data.business._id);
                localStorage.setItem('activeBusinessId', res.data.business._id);
                setForm(prev => ({ ...prev, businessId: res.data.business._id }));
            }
        }).catch(err => {
            console.error('Fetch active business error:', err);
        });
    }, [token, user._id]);

    useEffect(() => {
        fetchActiveBusiness();
    }, [fetchActiveBusiness]);
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Listen for active business changes like Parties page
    useEffect(() => {
        const handler = () => fetchActiveBusiness();
        window.addEventListener('activeBusinessChanged', handler);
        return () => window.removeEventListener('activeBusinessChanged', handler);
    }, [fetchActiveBusiness]);

    // Early return if no active business
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
                                <p className="text-muted mb-4">Please create and activate a business before managing products.</p>
                                <a className="btn-primary-add" href="/business">Go to Business Setup</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const filteredProducts = products.filter(p => {
        if (!search) return true;
        return (
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.HSN?.toLowerCase().includes(search.toLowerCase()) ||
            p.GST?.toLowerCase().includes(search.toLowerCase())
        );
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
    };

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
                                    <FaBoxOpen /> Products Management
                                </h1>
                                <button className="btn-primary-add" onClick={handleOpenAdd}>
                                    <FaPlus /> Add Product
                                </button>
                            </div>
                        </div>

                        <div className="common-card">
                            <div className="common-card-header d-flex align-items-center justify-content-between">
                                <div style={{ position: 'relative', maxWidth: 400 }}>
                                    <FaSearch style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: '#888', fontSize: 16, zIndex: 1 }} />
                                    <input
                                        type="text"
                                        placeholder="Search by name / HSN / GST..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        style={{ width: '100%', padding: '12px 16px 12px 40px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '1rem', outline: 'none', backgroundColor: '#fff' }}
                                        onFocus={e => e.target.style.borderColor = '#232526'}
                                        onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                                    />
                                </div>
                                <div className="text-end" style={{ minWidth: 180 }}>
                                    <div className="small text-muted" style={{ lineHeight: 1.2 }}>Total Value</div>
                                    <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{formatCurrency(totalInventoryValue)}</div>
                                </div>
                            </div>
                            <div className="main-data-table-wrapper">
                                <table className="main-data-table product-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Image</th>
                                            <th className="text-end">Sale Price</th>
                                            <th className="text-end">Purchase Price</th>
                                            <th>Stock</th>
                                            <th>Low Alert</th>
                                            <th>HSN</th>
                                            <th>GST</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productsLoading ? (
                                            <tr><td colSpan="9" className="text-center py-4">Loading products...</td></tr>
                                        ) : filteredProducts.length === 0 ? (
                                            <tr><td colSpan="9" className="text-center py-4">{search ? 'No products match your search.' : 'No products found. Add your first product!'}</td></tr>
                                        ) : (
                                            filteredProducts.map(product => (
                                                <tr key={product._id} className="main-data-table-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${product._id}/details`)}>
                                                    <td>
                                                        <div className="fw-medium text-primary text-decoration-underline" onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}/details`); }}>{product.name}</div>
                                                        {product.note && <small className="text-muted d-block">{product.note}</small>}
                                                    </td>
                                                    <td>
                                                        {product.image ? (
                                                            <img src={`${BASE_URL}/uploads/logos/${product.image}`} alt={product.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}/details`); }} />
                                                        ) : <span className="text-muted">No Image</span>}
                                                    </td>
                                                    <td className="fw-bold text-end">{formatCurrency(product.salePrice)}</td>
                                                    <td className="fw-bold text-end">{formatCurrency(product.purchasePrice)}</td>
                                                    <td>{product.openingStock ?? '-'}</td>
                                                    <td>{product.lowStockAlert ?? '-'}</td>
                                                    <td>{product.HSN || '-'}</td>
                                                    <td>{product.GST || '-'}</td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <button className="main-data-icon-btn" onClick={(e) => { e.stopPropagation(); handleEdit(product); }} title="Edit Product"><FaEdit /></button>
                                                            <button className="main-data-icon-btn text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(product._id); }} title="Delete Product"><FaTrash /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {productModalOpen && (
                            <div className="main-data-modal-backdrop">
                                <div className="main-data-modal" style={{ maxWidth: 780 }}>
                                    <div className="main-data-modal-header">
                                        <h2 className="main-data-modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                                        <button type="button" className="main-data-modal-close" onClick={() => { setProductModalOpen(false); resetForm(); }}><FaTimes /></button>
                                    </div>
                                    <form onSubmit={handleSubmit} className="main-data-modal-form">
                                        {productError && <div className="main-data-modal-error">{productError}</div>}

                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Active Business
                                                <input type="text" value={activeBusiness?.business_name || 'Active Business'} className="main-data-modal-input" disabled />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Name *
                                                <input type="text" name="name" value={form.name} onChange={handleChange} className="main-data-modal-input" placeholder="Product name" required />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Primary Unit *
                                                <input type="text" name="primaryUnit" value={form.primaryUnit} onChange={handleChange} className="main-data-modal-input" placeholder="e.g., pcs" required />
                                            </label>
                                        </div>

                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Secondary Unit
                                                <input type="text" name="secondaryUnit" value={form.secondaryUnit} onChange={handleChange} className="main-data-modal-input" placeholder="Optional" />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Sale Price *
                                                <input type="number" name="salePrice" value={form.salePrice} onChange={handleChange} className="main-data-modal-input" placeholder="0" min="0" step="0.01" required />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Purchase Price *
                                                <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} className="main-data-modal-input" placeholder="0" min="0" step="0.01" required />
                                            </label>
                                        </div>

                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Opening Stock *
                                                <input type="number" name="openingStock" value={form.openingStock} onChange={handleChange} className="main-data-modal-input" placeholder="0" min="0" required />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Low Stock Alert *
                                                <input type="number" name="lowStockAlert" value={form.lowStockAlert} onChange={handleChange} className="main-data-modal-input" placeholder="0" min="0" required />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <input type="checkbox" name="taxIncluded" checked={form.taxIncluded} onChange={handleChange} style={{ width: 18, height: 18 }} /> Tax Included
                                            </label>
                                        </div>

                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                HSN
                                                <input type="text" name="HSN" value={form.HSN} onChange={handleChange} className="main-data-modal-input" placeholder="HSN (optional)" />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                GST
                                                <input type="text" name="GST" value={form.GST} onChange={handleChange} className="main-data-modal-input" placeholder="GST (optional)" />
                                            </label>
                                            <label className="main-data-modal-label" style={{ flex: 1 }}>
                                                Image
                                                <input type="file" name="image" accept="image/*" onChange={handleChange} className="main-data-modal-input" />
                                            </label>
                                        </div>

                                        {imagePreview && (
                                            <div style={{ marginBottom: 16 }}>
                                                <img src={imagePreview} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                                            </div>
                                        )}

                                        <label className="main-data-modal-label">
                                            Note
                                            <textarea name="note" value={form.note} onChange={handleChange} className="main-data-modal-input" placeholder="Optional note" rows="3" />
                                        </label>

                                        <div className="main-data-modal-actions">
                                            <button type="button" className="btn-cancel" onClick={() => { setProductModalOpen(false); resetForm(); }}>Cancel</button>
                                            <button type="submit" className="btn-save">{editingProduct ? 'Update Product' : 'Add Product'}</button>
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

                        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
                    </div>
                </div>
            </div>
        </div>
    );
}