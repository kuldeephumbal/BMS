import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { FaArrowLeft, FaEdit, FaCalendarAlt, FaUser, FaPhone, FaMoneyBillWave, FaFileInvoice, FaClipboardList, FaNotesMedical, FaImage } from 'react-icons/fa';

export default function BillingDetails() {
    const navigate = useNavigate();
    const { type, id } = useParams(); // sale | purchase, bill id
    const billingType = ['sale', 'purchase'].includes(type) ? type : 'sale';

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [billData, setBillData] = useState(null);
    const [loading, setLoading] = useState(true);

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
        if (!id) {
            navigate(`/billing/${billingType}`);
            return;
        }

        // Fetch bill data
        setLoading(true);
        axios.get(`http://localhost:5000/api/billing/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            setBillData(res.data.billing);
        }).catch(err => {
            const msg = err.response?.data?.message || 'Error fetching bill details';
            toast.error(msg);
            navigate(`/billing/${billingType}`);
        }).finally(() => setLoading(false));
    }, [token, user._id, activeBusinessId, id, billingType, navigate]);

    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };

    const handleBack = () => {
        navigate(`/billing/${billingType}`);
    };

    const handleEdit = () => {
        navigate(`/billing/${billingType}/edit/${id}`);
    };

    const getPageTitle = () => {
        const operation = billingType === 'sale' ? 'Sale' : 'Purchase';
        const billNumber = billData?.billNumber ? ` #${billData.billNumber}` : '';
        return `${operation} Details${billNumber}`;
    };

    const getPaymentBadgeStyle = (method) => {
        const baseStyle = {
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '0.8rem',
            fontWeight: '600',
            textTransform: 'uppercase'
        };

        switch (method) {
            case 'unpaid':
                return { ...baseStyle, backgroundColor: '#fef3c7', color: '#d97706' };
            case 'cash':
                return { ...baseStyle, backgroundColor: '#d1fae5', color: '#059669' };
            case 'online':
                return { ...baseStyle, backgroundColor: '#dbeafe', color: '#2563eb' };
            default:
                return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#6b7280' };
        }
    };

    const calculateTotals = () => {
        if (!billData) return { productTotal: 0, additionalTotal: 0, discountTotal: 0, finalTotal: 0 };

        const productTotal = (billData.products || []).reduce((sum, product) => {
            return sum + (Number(product.quantity) * Number(product.price));
        }, 0);

        const additionalTotal = (billData.additionalCharges || []).reduce((sum, charge) => {
            return sum + Number(charge.amount || 0);
        }, 0);

        const discountTotal = (billData.discount || []).reduce((sum, discount) => {
            const value = Number(discount.value) || 0;
            if (discount.type === 'percentage') {
                return sum + ((productTotal * value) / 100);
            }
            return sum + value;
        }, 0);

        const finalTotal = productTotal + additionalTotal - discountTotal;

        return { productTotal, additionalTotal, discountTotal, finalTotal: Math.max(0, finalTotal) };
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
                                Select an active business to view bill details.
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
                                Loading bill details...
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    if (!billData) {
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

    const totals = calculateTotals();
    const isPaid = billData.method === 'cash' || billData.method === 'online';
    const displayAmount = isPaid ? (billData.totalAmount ?? totals.finalTotal) : (billData.balanceDue ?? totals.finalTotal);

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
                                    onClick={handleBack}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                >
                                    <FaArrowLeft /> Back
                                </button>
                                <h2 className="main-data-page-title">
                                    {getPageTitle()}
                                </h2>
                            </div>
                            <button
                                className='btn-primary-add'
                                onClick={handleEdit}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <FaEdit /> Edit
                            </button>
                        </div>

                        <div className="main-content-card" style={{ padding: 24, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>

                            {/* Bill Overview */}
                            <div className="row" style={{ marginBottom: 24 }}>
                                <div className="col-md-6">
                                    <div style={{ padding: 20, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                                        <h5 style={{ margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FaFileInvoice style={{ color: '#495057' }} />
                                            Bill Information
                                        </h5>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#6c757d' }}>Bill Number:</span>
                                                <span style={{ fontWeight: '600' }}>#{billData.billNumber}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#6c757d' }}>Type:</span>
                                                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{billData.type}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#6c757d' }}>Date:</span>
                                                <span style={{ fontWeight: '600' }}>
                                                    <FaCalendarAlt style={{ marginRight: 6, color: '#6c757d' }} />
                                                    {billData.date ? new Date(billData.date).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                            {billData.dueDate && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6c757d' }}>Due Date:</span>
                                                    <span style={{ fontWeight: '600' }}>
                                                        {new Date(billData.dueDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div style={{ padding: 20, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                                        <h5 style={{ margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FaUser style={{ color: '#495057' }} />
                                            Party Information
                                        </h5>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#6c757d' }}>Name:</span>
                                                <span style={{ fontWeight: '600' }}>{billData.parties?.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#6c757d' }}>Phone:</span>
                                                <span style={{ fontWeight: '600' }}>
                                                    <FaPhone style={{ marginRight: 6, color: '#6c757d' }} />
                                                    {billData.parties?.phone}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products Section */}
                            <div style={{ marginBottom: 24 }}>
                                <h5 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <FaClipboardList style={{ color: '#495057' }} />
                                    Products/Items
                                </h5>
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                                            <tr>
                                                <th>Product Name</th>
                                                <th>Quantity</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(billData.products || []).map((product, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ fontWeight: '500' }}>{product.name}</td>
                                                    <td>{product.quantity}</td>
                                                    <td>₹{Number(product.price).toLocaleString('en-IN')}</td>
                                                    <td style={{ fontWeight: '600' }}>₹{(Number(product.quantity) * Number(product.price)).toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Additional Charges */}
                            {(billData.additionalCharges || []).length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    <h6>Additional Charges</h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm">
                                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th>Charge Name</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {billData.additionalCharges.map((charge, idx) => (
                                                    <tr key={idx}>
                                                        <td>{charge.name}</td>
                                                        <td>₹{Number(charge.amount).toLocaleString('en-IN')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Discounts */}
                            {(billData.discount || []).length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    <h6>Discounts</h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm">
                                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Value</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {billData.discount.map((discount, idx) => {
                                                    const discountAmount = discount.type === 'percentage'
                                                        ? (totals.productTotal * Number(discount.value)) / 100
                                                        : Number(discount.value);

                                                    return (
                                                        <tr key={idx}>
                                                            <td style={{ textTransform: 'capitalize' }}>{discount.type}</td>
                                                            <td>
                                                                {discount.type === 'percentage' ? `${discount.value}%` : `₹${Number(discount.value).toLocaleString('en-IN')}`}
                                                            </td>
                                                            <td>₹{discountAmount.toLocaleString('en-IN')}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Payment Information */}
                            <div className="row" style={{ marginBottom: 24 }}>
                                <div className="col-md-6">
                                    <div style={{ padding: 20, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                                        <h5 style={{ margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FaMoneyBillWave style={{ color: '#495057' }} />
                                            Payment Details
                                        </h5>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#6c757d' }}>Method:</span>
                                                <span style={getPaymentBadgeStyle(billData.method)}>
                                                    {billData.method}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '600', paddingTop: 8, borderTop: '1px solid #dee2e6' }}>
                                                <span>{isPaid ? 'Total Amount:' : 'Balance Due:'}</span>
                                                <span style={{ color: isPaid ? '#059669' : '#d97706' }}>
                                                    ₹{displayAmount.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div style={{ padding: 20, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                                        <h5 style={{ margin: 0, marginBottom: 16 }}>Calculation Summary</h5>
                                        <div style={{ display: 'grid', gap: 8, fontSize: '0.9rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Products Total:</span>
                                                <span>₹{totals.productTotal.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Additional Charges:</span>
                                                <span>₹{totals.additionalTotal.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Discounts:</span>
                                                <span>-₹{totals.discountTotal.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #dee2e6', fontWeight: '600' }}>
                                                <span>Final Total:</span>
                                                <span>₹{totals.finalTotal.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms and Conditions */}
                            {(billData.optionalFields?.termsAndConditions || []).length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    <h6>Terms & Conditions</h6>
                                    <div style={{ padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                                        {billData.optionalFields.termsAndConditions.map((term, idx) => (
                                            <div key={idx} style={{ marginBottom: 8, fontSize: '0.9rem' }}>
                                                {idx + 1}. {term.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Note */}
                            {billData.note && (
                                <div style={{ marginBottom: 24 }}>
                                    <h6 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FaNotesMedical style={{ color: '#495057' }} />
                                        Note
                                    </h6>
                                    <div style={{ padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                                        {billData.note}
                                    </div>
                                </div>
                            )}

                            {/* Photos */}
                            {(billData.photos || []).length > 0 && (
                                <div>
                                    <h6 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FaImage style={{ color: '#495057' }} />
                                        Photos
                                    </h6>
                                    <div className="row">
                                        {billData.photos.map((photo, idx) => (
                                            <div key={idx} className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6 mb-3">
                                                <img
                                                    src={photo}
                                                    alt={`Bill attachment ${idx + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '120px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px',
                                                        border: '1px solid #dee2e6',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => window.open(photo, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </main>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
