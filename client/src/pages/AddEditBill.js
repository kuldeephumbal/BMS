import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import BillingForm from '../components/BillingForm';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';

export default function AddEditBill() {
    const navigate = useNavigate();
    const { type, id } = useParams(); // sale | purchase, bill id (optional for add)
    const billingType = ['sale', 'purchase'].includes(type) ? type : 'sale';
    const isEditMode = Boolean(id);

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEditMode);
    const [billData, setBillData] = useState(null);

    // Party modal state and form
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [customerForm, setCustomerForm] = useState({
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
    const [customerFormError, setCustomerFormError] = useState('');

    // Determine party type based on billing type
    const partyTypeForModal = billingType === 'sale' ? 'customer' : 'supplier';
    const partyLabelForModal = billingType === 'sale' ? 'Customer' : 'Supplier';

    // Product modal state and form
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '',
        primaryUnit: 'pcs',
        secondaryUnit: '',
        salePrice: '',
        purchasePrice: '',
        taxIncluded: false,
        openingStock: '0',
        lowStockAlert: '0',
        HSN: '',
        GST: '',
        note: '',
        image: null
    });
    const [productFormError, setProductFormError] = useState('');
    const [productImagePreview, setProductImagePreview] = useState(null);

    // user and business
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const activeBusinessId = localStorage.getItem('activeBusinessId');

    useEffect(() => {
        if (!token || !user._id) {
            navigate('/login');
            return;
        }
        if (!activeBusinessId) {
            navigate(`/billing/${billingType}`);
            return;
        }

        // If edit mode, fetch bill data
        if (isEditMode && id) {
            setLoading(true);
            axios.get(`http://localhost:5000/api/billing/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                const bill = res.data?.billing || res.data;
                if (!bill) {
                    toast.error('Bill not found');
                    navigate(`/billing/${billingType}`);
                    return;
                }
                setBillData(bill);
            }).catch(err => {
                const msg = err.response?.data?.message || 'Error fetching bill';
                toast.error(msg);
                navigate(`/billing/${billingType}`);
            }).finally(() => setLoading(false));
        }
    }, [token, user._id, activeBusinessId, id, billingType, navigate, isEditMode]);

    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };

    const handleSubmit = async (payload) => {
        if (!token || !user._id || !activeBusinessId) {
            toast.error('Missing auth or business.');
            return;
        }

        // For create mode, navigate to preview page
        if (!isEditMode) {
            navigate(`/billing/${billingType}/preview`, {
                state: { billData: payload }
            });
            return;
        }

        // For edit mode, submit directly
        submitBill(payload);
    };

    const submitBill = (payload) => {
        setSubmitting(true);

        if (isEditMode) {
            // Edit mode - PUT request
            if (!billData?._id) {
                toast.error('Missing bill data.');
                setSubmitting(false);
                return;
            }
            // Do not send businessId/type; backend forbids changing them
            axios.put(`http://localhost:5000/api/billing/${billData._id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(() => {
                toast.success('Billing updated successfully');
                navigate(`/billing/${billingType}`);
            }).catch(err => {
                const msg = err.response?.data?.message || 'Error updating billing';
                toast.error(msg);
            }).finally(() => setSubmitting(false));
        } else {
            // Add mode - POST request (this won't be used since we navigate to preview)
            const body = { userId: user._id, businessId: activeBusinessId, type: billingType, ...payload };
            axios.post('http://localhost:5000/api/billing', body, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(() => {
                toast.success('Billing created successfully');
                navigate(`/billing/${billingType}`);
            }).catch(err => {
                const msg = err.response?.data?.message || 'Error creating billing';
                toast.error(msg);
            }).finally(() => setSubmitting(false));
        }
    };

    const handleCancel = () => {
        navigate(`/billing/${billingType}`);
    };

    // Customer form validation functions
    const validatePhone = (phone) => /^\d{10}$/.test(phone);
    const validatePinCode = (pinCode) => /^\d{6}$/.test(pinCode);
    const validateGST = (gst) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);

    // Customer form handlers
    const handleCustomerFormChange = (e) => {
        const { name, value } = e.target;
        setCustomerForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setCustomerFormError('');

        if (!validatePhone(customerForm.phone)) {
            setCustomerFormError('Phone must be a 10-digit number');
            return;
        }
        if (customerForm.pin_code && !validatePinCode(customerForm.pin_code)) {
            setCustomerFormError('PIN code must be a 6-digit number');
            return;
        }
        if (customerForm.gst_number && !validateGST(customerForm.gst_number)) {
            setCustomerFormError('Please enter a valid GST number');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/parties/create', {
                user_id: user._id,
                business_id: activeBusinessId,
                type: partyTypeForModal,
                ...customerForm
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 201) {
                toast.success(`${partyLabelForModal} created successfully!`);
                setCustomerForm({
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
                setShowAddCustomerModal(false);
                setCustomerFormError('');

                // Notify BillingForm to refresh party list
                window.dispatchEvent(new CustomEvent('partyAdded', {
                    detail: { party: { ...response.data.party || response.data, type: partyTypeForModal } }
                }));
            }
        } catch (error) {
            console.error(`Error creating ${partyTypeForModal}:`, error);
            const errorMessage = error.response?.data?.message || `Error creating ${partyTypeForModal}`;
            setCustomerFormError(errorMessage);
            toast.error(errorMessage);
        }
    };

    // Product form handlers
    const handleProductFormChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            setProductForm(prev => ({ ...prev, image: file }));
            if (file) {
                setProductImagePreview(URL.createObjectURL(file));
            } else {
                setProductImagePreview(null);
            }
            return;
        }
        setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const validateProductForm = () => {
        if (!productForm.name || !productForm.primaryUnit || !productForm.salePrice || !productForm.purchasePrice || productForm.openingStock === '' || productForm.lowStockAlert === '') {
            return 'Name, Primary Unit, Sale Price, Purchase Price, Opening Stock, Low Stock Alert are required.';
        }
        if (parseFloat(productForm.salePrice) <= 0 || parseFloat(productForm.purchasePrice) <= 0) {
            return 'Sale & Purchase price must be greater than 0.';
        }
        if (parseFloat(productForm.openingStock) < 0 || parseFloat(productForm.lowStockAlert) < 0) {
            return 'Opening Stock and Low Stock Alert must be >= 0';
        }
        return '';
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setProductFormError('');

        const validationError = validateProductForm();
        if (validationError) {
            setProductFormError(validationError);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('userId', user._id);
            formData.append('businessId', activeBusinessId);
            formData.append('name', productForm.name.trim());
            formData.append('primaryUnit', productForm.primaryUnit.trim());
            if (productForm.secondaryUnit) formData.append('secondaryUnit', productForm.secondaryUnit.trim());
            formData.append('salePrice', productForm.salePrice);
            formData.append('purchasePrice', productForm.purchasePrice);
            formData.append('taxIncluded', productForm.taxIncluded);
            formData.append('openingStock', productForm.openingStock);
            formData.append('lowStockAlert', productForm.lowStockAlert);
            formData.append('HSN', productForm.HSN.trim());
            formData.append('GST', productForm.GST.trim());
            if (productForm.note) formData.append('note', productForm.note.trim());
            if (productForm.image) formData.append('image', productForm.image);

            const response = await axios.post('http://localhost:5000/api/product', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 201) {
                toast.success('Product created successfully!');
                setProductForm({
                    name: '',
                    primaryUnit: 'pcs',
                    secondaryUnit: '',
                    salePrice: '',
                    purchasePrice: '',
                    taxIncluded: false,
                    openingStock: '0',
                    lowStockAlert: '0',
                    HSN: '',
                    GST: '',
                    note: '',
                    image: null
                });
                setProductImagePreview(null);
                setShowAddProductModal(false);
                setProductFormError('');

                // Notify BillingForm to refresh product list
                window.dispatchEvent(new CustomEvent('productAdded', {
                    detail: { product: response.data.product || response.data }
                }));
            }
        } catch (error) {
            console.error('Error creating product:', error);
            const errorMessage = error.response?.data?.message || 'Error creating product';
            setProductFormError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const getPageTitle = () => {
        const operation = isEditMode ? 'Edit' : 'Add';
        const typeLabel = billingType === 'sale' ? 'Sale' : 'Purchase';
        const billNumber = isEditMode && billData?.billNumber ? ` #${billData.billNumber}` : '';
        return `${operation} ${typeLabel}${billNumber}`;
    };

    const getInitialValues = () => {
        if (!isEditMode || !billData) return undefined;

        return {
            parties: {
                id: billData?.parties?.id || '',
                name: billData?.parties?.name || '',
                phone: billData?.parties?.phone || '',
            },
            products: billData?.products || [{ id: '', name: '', quantity: 1, price: 0 }],
            additionalCharges: billData?.additionalCharges || [],
            discount: billData?.discount || [],
            optionalFields: billData?.optionalFields || {},
            note: billData?.note || '',
            photos: billData?.photos || [],
            method: billData?.method || 'unpaid',
            date: billData?.date ? (new Date(billData.date).toISOString().slice(0, 10)) : '',
            dueDate: billData?.dueDate ? (new Date(billData.dueDate).toISOString().slice(0, 10)) : '',
            balanceDue: billData?.balanceDue ?? '',
            totalAmount: billData?.totalAmount ?? '',
        };
    };

    if (!activeBusinessId) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                Select an active business to {isEditMode ? 'edit' : 'add'} billing.
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                Loading bill data...
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    if (isEditMode && !billData) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                Bill not found.
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
                            <div className='d-flex align-items-center gap-3'>
                                <button
                                    className='btn-cancel'
                                    onClick={handleCancel}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                >
                                    <FaArrowLeft /> Back
                                </button>
                                <h2 className="main-data-page-title">
                                    {getPageTitle()}
                                </h2>
                            </div>
                        </div>

                        <div className="main-content-card" style={{ padding: 24, backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <BillingForm
                                mode={isEditMode ? 'edit' : 'create'}
                                type={billingType}
                                initialValues={getInitialValues()}
                                onSubmit={handleSubmit}
                                onCancel={handleCancel}
                                submitting={submitting}
                                onAddParty={() => setShowAddCustomerModal(true)}
                                onAddProduct={() => setShowAddProductModal(true)}
                            />
                        </div>
                    </main>
                </div>
            </div>

            {/* Add Customer/Supplier Modal */}
            {showAddCustomerModal && (
                <div className="main-data-modal-backdrop" onClick={() => setShowAddCustomerModal(false)}>
                    <div className="main-data-modal" onClick={e => e.stopPropagation()}>
                        <div className="main-data-modal-header">
                            <h3 className="main-data-modal-title">Add {partyLabelForModal}</h3>
                            <button
                                type="button"
                                className="main-data-modal-close"
                                onClick={() => setShowAddCustomerModal(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleAddCustomer} className="main-data-modal-form">
                            <div className="main-data-modal-row">
                                <label className="main-data-modal-label">Name
                                    <input
                                        type="text"
                                        name="name"
                                        className="main-data-modal-input"
                                        value={customerForm.name}
                                        onChange={handleCustomerFormChange}
                                        required
                                    />
                                </label>
                                <label className="main-data-modal-label">Phone
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="main-data-modal-input"
                                        value={customerForm.phone}
                                        onChange={handleCustomerFormChange}
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
                                        value={customerForm.email}
                                        onChange={handleCustomerFormChange}
                                        placeholder="Optional"
                                    />
                                </label>
                                <label className="main-data-modal-label">GST Number
                                    <input
                                        type="text"
                                        name="gst_number"
                                        className="main-data-modal-input"
                                        value={customerForm.gst_number}
                                        onChange={handleCustomerFormChange}
                                        placeholder="Optional"
                                    />
                                </label>
                            </div>
                            <label className="main-data-modal-label">Address
                                <textarea
                                    name="address"
                                    className="main-data-modal-input"
                                    value={customerForm.address}
                                    onChange={handleCustomerFormChange}
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
                                        value={customerForm.state}
                                        onChange={handleCustomerFormChange}
                                        placeholder="State"
                                    />
                                </label>
                                <label className="main-data-modal-label">City
                                    <input
                                        type="text"
                                        name="city"
                                        className="main-data-modal-input"
                                        value={customerForm.city}
                                        onChange={handleCustomerFormChange}
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
                                        value={customerForm.pin_code}
                                        onChange={handleCustomerFormChange}
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
                                    value={customerForm.notes}
                                    onChange={handleCustomerFormChange}
                                    rows="3"
                                    placeholder={`Optional notes about the ${partyTypeForModal}`}
                                />
                            </label>
                            {customerFormError && <div className="main-data-modal-error">{customerFormError}</div>}
                            <div className="main-data-modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowAddCustomerModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {showAddProductModal && (
                <div className="main-data-modal-backdrop" onClick={() => setShowAddProductModal(false)}>
                    <div className="main-data-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 780 }}>
                        <div className="main-data-modal-header">
                            <h3 className="main-data-modal-title">Add Product</h3>
                            <button
                                type="button"
                                className="main-data-modal-close"
                                onClick={() => setShowAddProductModal(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleAddProduct} className="main-data-modal-form">
                            {productFormError && <div className="main-data-modal-error">{productFormError}</div>}

                            <div className="main-data-modal-row">
                                <label className="main-data-modal-label">Name *
                                    <input
                                        type="text"
                                        name="name"
                                        className="main-data-modal-input"
                                        value={productForm.name}
                                        onChange={handleProductFormChange}
                                        placeholder="Product name"
                                        required
                                    />
                                </label>
                                <label className="main-data-modal-label">Primary Unit *
                                    <input
                                        type="text"
                                        name="primaryUnit"
                                        className="main-data-modal-input"
                                        value={productForm.primaryUnit}
                                        onChange={handleProductFormChange}
                                        placeholder="e.g., pcs"
                                        required
                                    />
                                </label>
                                <label className="main-data-modal-label">Secondary Unit
                                    <input
                                        type="text"
                                        name="secondaryUnit"
                                        className="main-data-modal-input"
                                        value={productForm.secondaryUnit}
                                        onChange={handleProductFormChange}
                                        placeholder="Optional"
                                    />
                                </label>
                            </div>

                            <div className="main-data-modal-row">
                                <label className="main-data-modal-label">Sale Price *
                                    <input
                                        type="number"
                                        name="salePrice"
                                        className="main-data-modal-input"
                                        value={productForm.salePrice}
                                        onChange={handleProductFormChange}
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </label>
                                <label className="main-data-modal-label">Purchase Price *
                                    <input
                                        type="number"
                                        name="purchasePrice"
                                        className="main-data-modal-input"
                                        value={productForm.purchasePrice}
                                        onChange={handleProductFormChange}
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </label>
                                <label className="main-data-modal-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        name="taxIncluded"
                                        checked={productForm.taxIncluded}
                                        onChange={handleProductFormChange}
                                        style={{ width: 18, height: 18 }}
                                    />
                                    Tax Included
                                </label>
                            </div>

                            <div className="main-data-modal-row">
                                <label className="main-data-modal-label">Opening Stock *
                                    <input
                                        type="number"
                                        name="openingStock"
                                        className="main-data-modal-input"
                                        value={productForm.openingStock}
                                        onChange={handleProductFormChange}
                                        placeholder="0"
                                        min="0"
                                        required
                                    />
                                </label>
                                <label className="main-data-modal-label">Low Stock Alert *
                                    <input
                                        type="number"
                                        name="lowStockAlert"
                                        className="main-data-modal-input"
                                        value={productForm.lowStockAlert}
                                        onChange={handleProductFormChange}
                                        placeholder="0"
                                        min="0"
                                        required
                                    />
                                </label>
                                <label className="main-data-modal-label">Image
                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleProductFormChange}
                                        className="main-data-modal-input"
                                    />
                                </label>
                            </div>

                            <div className="main-data-modal-row">
                                <label className="main-data-modal-label">HSN
                                    <input
                                        type="text"
                                        name="HSN"
                                        className="main-data-modal-input"
                                        value={productForm.HSN}
                                        onChange={handleProductFormChange}
                                        placeholder="HSN (optional)"
                                    />
                                </label>
                                <label className="main-data-modal-label">GST
                                    <input
                                        type="text"
                                        name="GST"
                                        className="main-data-modal-input"
                                        value={productForm.GST}
                                        onChange={handleProductFormChange}
                                        placeholder="GST (optional)"
                                    />
                                </label>
                            </div>

                            {productImagePreview && (
                                <div style={{ marginBottom: 16 }}>
                                    <img src={productImagePreview} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                                </div>
                            )}

                            <label className="main-data-modal-label">Note
                                <textarea
                                    name="note"
                                    className="main-data-modal-input"
                                    value={productForm.note}
                                    onChange={handleProductFormChange}
                                    rows="3"
                                    placeholder="Optional note about the product"
                                />
                            </label>

                            <div className="main-data-modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowAddProductModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit">Add Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ToastContainer />
        </div>
    );
}
