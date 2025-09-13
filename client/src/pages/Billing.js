import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { FaChevronLeft, FaChevronRight, FaEdit, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';

export default function Billing() {
    const navigate = useNavigate();
    const { type } = useParams(); // sale | purchase
    const billingType = ['sale', 'purchase'].includes(type) ? type : 'sale';

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmData, setConfirmData] = useState({});

    // pagination & search
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');

    // user and business
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const activeBusinessId = localStorage.getItem('activeBusinessId');


    const fetchList = React.useCallback(() => {
        if (!activeBusinessId) return;
        setLoading(true);
        axios.get('http://localhost:5000/api/billing', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                userId: user._id,
                businessId: activeBusinessId,
                type: billingType,
                search: search || undefined,
                page,
                limit
            }
        }).then(res => {
            setItems(res.data.billings || []);
            setTotalPages(res.data.totalPages || 1);
        }).catch(err => {
            const msg = err.response?.data?.message || 'Error fetching billings';
            toast.error(msg);
        }).finally(() => setLoading(false));
    }, [activeBusinessId, token, user._id, billingType, search, page, limit]);

    useEffect(() => {
        if (!token || !user._id) {
            navigate('/login');
            return;
        }
        const t = setTimeout(() => {
            setPage(1);
            fetchList();
        }, 300);
        return () => clearTimeout(t);
    }, [search, billingType, token, user._id, navigate, fetchList]);

    useEffect(() => { fetchList(); }, [page, activeBusinessId, billingType, fetchList]);

    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };



    const openCreateModal = () => {
        navigate(`/billing/${billingType}/add`);
    };

    const openEditModal = (item) => {
        navigate(`/billing/${billingType}/edit/${item._id}`);
    };

    const openViewModal = (item) => {
        navigate(`/billing/${billingType}/details/${item._id}`);
    };

    const handleDelete = (id) => {
        setConfirmData({
            title: 'Delete Billing',
            message: 'Are you sure you want to delete this billing?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: () => performDelete(id)
        });
        setShowConfirmModal(true);
    };
    const performDelete = (id) => {
        axios.delete(`http://localhost:5000/api/billing/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(() => {
            toast.success('Billing deleted');
            fetchList();
        }).catch(err => {
            const msg = err.response?.data?.message || 'Error deleting billing';
            toast.error(msg);
        }).finally(() => setShowConfirmModal(false));
    };

    const getTitle = useMemo(() => billingType === 'sale' ? 'Sales' : 'Purchases', [billingType]);

    if (!activeBusinessId) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div className="main-data-header-row">
                                <h2 className="main-data-page-title">{getTitle}</h2>
                            </div>
                            <div style={{ textAlign: 'center', padding: 40 }}>Select an active business to view billings.</div>
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
                            <div className="d-flex align-items-center justify-content-between w-100">
                                <div className="d-flex align-items-center gap-3">
                                    <h1 className="main-data-page-title d-flex align-items-center gap-2">{getTitle}</h1>
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
                                    <button className="btn-primary-add" onClick={openCreateModal}>
                                        <FaPlus /> Add {billingType === 'sale' ? 'Sale' : 'Purchase'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="main-data-table-wrapper">
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 40 }}>Loading…</div>
                            ) : items.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 40 }}>No records</div>
                            ) : (
                                <div className="modern-table-container">
                                    <table className="main-data-table modern-data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left' }}>BILL #</th>
                                                <th style={{ textAlign: 'left' }}>PARTY</th>
                                                <th style={{ textAlign: 'right' }}>AMOUNT</th>
                                                <th style={{ textAlign: 'left' }}>DATE</th>
                                                <th style={{ textAlign: 'left' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map(it => {
                                                // Determine which amount to show and payment status
                                                const isPaid = it.method === 'cash' || it.method === 'online';
                                                const displayAmount = isPaid ? (it.totalAmount ?? 0) : (it.balanceDue ?? 0);

                                                // Payment method badge styling
                                                const getBadgeStyle = (method) => {
                                                    const baseStyle = {
                                                        display: 'inline-block',
                                                        padding: '0px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        textTransform: 'uppercase',
                                                        marginTop: '4px'
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

                                                return (
                                                    <tr key={it._id} className='modern-table-row' onClick={() => openViewModal(it)} style={{ cursor: 'pointer' }}>
                                                        <td style={{ textAlign: 'left' }}><strong>#{it.billNumber}</strong></td>
                                                        <td style={{ textAlign: 'left' }}>
                                                            <div>
                                                                <div style={{ fontWeight: '500' }}>{it.parties?.name}</div>
                                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{it.parties?.phone}</div>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div>
                                                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                                                    ₹{displayAmount.toLocaleString('en-IN')}
                                                                </div>
                                                                <span style={getBadgeStyle(it.method)}>
                                                                    {it.method}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'left' }}>{it.date ? new Date(it.date).toLocaleDateString() : '-'}</td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button className='btn-edit' title='Edit' onClick={(e) => { e.stopPropagation(); openEditModal(it); }}><FaEdit /></button>
                                                                <button className='btn-delete-icon' title='Delete' onClick={(e) => { e.stopPropagation(); handleDelete(it._id); }}><FaTrash /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className='main-data-pagination'>
                                <button className='main-data-pagination-arrow' disabled={page === 1} onClick={() => setPage(p => p - 1)}><FaChevronLeft /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={`main-data-pagination-page${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className='main-data-pagination-arrow' disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><FaChevronRight /></button>
                            </div>
                        )}

                        {/* Modal removed - now using separate pages for add/edit */}

                        {/* Confirm */}
                        <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmData.onConfirm} title={confirmData.title} message={confirmData.message} confirmText={confirmData.confirmText} cancelText={confirmData.cancelText} type={confirmData.type} />
                    </main>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

