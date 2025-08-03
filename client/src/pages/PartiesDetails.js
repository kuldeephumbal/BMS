import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import {
    FaEdit,
    FaTrash,
    FaChevronLeft,
    FaChevronRight,
    FaSearch,
    FaPlus,
    FaArrowLeft,
    FaMoneyBillWave,
    FaArrowUp,
    FaArrowDown,
    FaBalanceScale,
    FaListAlt,
} from 'react-icons/fa';

export default function PartiesDetails() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [party, setParty] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Transaction modal states
    const [transactionModalOpen, setTransactionModalOpen] = useState(false);
    const [editTransactionModalOpen, setEditTransactionModalOpen] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({});

    // Transaction form states
    const [transactionForm, setTransactionForm] = useState({
        type: 'gave',
        amount: '',
        paymentMethod: 'cash',
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [editTransactionForm, setEditTransactionForm] = useState({
        id: null,
        type: 'gave',
        amount: '',
        paymentMethod: 'cash',
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Pagination for transactions
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(10);
    const [search, setSearch] = useState('');

    // Statistics
    const [stats, setStats] = useState({
        totalTransactions: 0,
        totalAmount: 0,
        gaveAmount: 0,
        gotAmount: 0,
        netAmount: 0
    });

    // Get user and business info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const [activeBusinessId, setActiveBusinessId] = useState(() => {
        return localStorage.getItem('activeBusinessId') || null;
    });

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
        if (!token || !user._id || !activeBusinessId || !id) {
            if (!token || !user._id) {
                navigate('/login');
            }
            return;
        }
        fetchPartyDetails();
        fetchTransactions();
        fetchTransactionStats();
    }, [id, activeBusinessId]);

    // Separate useEffect for search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (token && user._id && activeBusinessId && id) {
                setPage(1);
                fetchTransactions();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [search, activeBusinessId, id]);

    const fetchPartyDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/parties/get/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                setParty(response.data.party);
            }
        } catch (error) {
            console.error('Error fetching party details:', error);
            const errorMessage = error.response?.data?.message || 'Error fetching party details';
            toast.error(errorMessage);
            setError(errorMessage);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/transaction/party`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    partyId: id,
                    page,
                    limit: itemsPerPage,
                    search
                }
            });
            if (response.status === 200) {
                setTransactions(response.data.transactions || []);
                setTotalPages(response.data.pagination?.totalPages || 1);
                setTotalItems(response.data.pagination?.totalItems || 0);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            const errorMessage = error.response?.data?.message || 'Error fetching transactions';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactionStats = async () => {
        try {
            // Get all transactions for this party and calculate stats
            const response = await axios.get(`http://localhost:5000/api/transaction/party`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    partyId: id,
                    page: 1,
                    limit: 1000 // Get all transactions for stats calculation
                }
            });

            if (response.status === 200) {
                const transactions = response.data.transactions || [];

                // Calculate stats from transactions
                const stats = {
                    totalTransactions: transactions.length,
                    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
                    gaveAmount: transactions.filter(t => t.type === 'gave').reduce((sum, t) => sum + t.amount, 0),
                    gotAmount: transactions.filter(t => t.type === 'got').reduce((sum, t) => sum + t.amount, 0)
                };

                // Calculate net amount
                stats.netAmount = stats.gotAmount - stats.gaveAmount;

                setStats(stats);
            }
        } catch (error) {
            console.error('Error fetching transaction stats:', error);
        }
    };

    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };

    const handleTransactionChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            // Ensure amount is properly formatted to 2 decimal places
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue >= 0) {
                setTransactionForm({ ...transactionForm, [name]: value });
            } else if (value === '') {
                setTransactionForm({ ...transactionForm, [name]: '' });
            }
        } else {
            setTransactionForm({ ...transactionForm, [name]: value });
        }
    };

    const handleEditTransactionChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            // Ensure amount is properly formatted to 2 decimal places
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue >= 0) {
                setEditTransactionForm({ ...editTransactionForm, [name]: value });
            } else if (value === '') {
                setEditTransactionForm({ ...editTransactionForm, [name]: '' });
            }
        } else {
            setEditTransactionForm({ ...editTransactionForm, [name]: value });
        }
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();

        if (!transactionForm.amount || transactionForm.amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            // Send the amount directly without any processing
            const response = await axios.post('http://localhost:5000/api/transaction/create', {
                userId: user._id,
                businessId: activeBusinessId,
                partyId: id,
                ...transactionForm,
                amount: transactionForm.amount
            }, {
                headers: { Authorization: `Bearer ${token}` }
            }); if (response.status === 201) {
                toast.success('Transaction added successfully!');
                setTransactionForm({
                    type: 'gave',
                    amount: '',
                    paymentMethod: 'cash',
                    notes: '',
                    date: new Date().toISOString().split('T')[0]
                });
                setTransactionModalOpen(false);
                fetchTransactions();
                fetchTransactionStats();
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            const errorMessage = error.response?.data?.message || 'Error adding transaction';
            toast.error(errorMessage);
        }
    };

    const handleEditTransaction = async (e) => {
        e.preventDefault();

        if (!editTransactionForm.amount || editTransactionForm.amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            // Send the amount directly without any processing
            const response = await axios.put(`http://localhost:5000/api/transaction/update/${editTransactionForm.id}`, {
                ...editTransactionForm,
                amount: editTransactionForm.amount
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                toast.success('Transaction updated successfully!');
                setEditTransactionModalOpen(false);
                fetchTransactions();
                fetchTransactionStats();
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            const errorMessage = error.response?.data?.message || 'Error updating transaction';
            toast.error(errorMessage);
        }
    };

    const handleOpenEditTransaction = (transaction) => {
        setEditTransactionForm({
            id: transaction._id,
            type: transaction.type,
            amount: transaction.amount.toString(),
            paymentMethod: transaction.paymentMethod,
            notes: transaction.notes || '',
            date: new Date(transaction.date).toISOString().split('T')[0]
        });
        setEditTransactionModalOpen(true);
    };

    const handleDeleteTransaction = (transactionId) => {
        const transaction = transactions.find(t => t._id === transactionId);
        setConfirmModalData({
            title: 'Delete Transaction',
            message: `Are you sure you want to delete this transaction of ₹${transaction?.amount}? This action cannot be undone.`,
            confirmText: 'Delete Transaction',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: () => performDeleteTransaction(transactionId)
        });
        setShowConfirmModal(true);
    };

    const performDeleteTransaction = async (transactionId) => {
        try {
            const response = await axios.delete(`http://localhost:5000/api/transaction/delete/${transactionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                toast.success('Transaction deleted successfully!');
                fetchTransactions();
                fetchTransactionStats();
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            const errorMessage = error.response?.data?.message || 'Error deleting transaction';
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading && !party) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div>Loading party details...</div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    if (!party) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div style={{ fontSize: '1.2rem', color: '#7b7b93', marginBottom: '10px' }}>
                                    Party Not Found
                                </div>
                                <div style={{ color: '#7b7b93' }}>
                                    The party you're looking for doesn't exist or has been deleted.
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
                        {/* Header Section */}
                        <div className="parties-details-header">
                            <div className="parties-details-header-left">
                                <button
                                    className="btn-secondary-back"
                                    onClick={() => navigate(-1)}
                                >
                                    <FaArrowLeft />
                                    Back
                                </button>
                                <div className="parties-details-title-section">
                                    <h1 className="parties-details-title d-flex align-items-center justify-content-center">{party.name}</h1>
                                    <span className={`parties-details-type-badge ${party.type}`}>
                                        {party.type.charAt(0).toUpperCase() + party.type.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <button
                                className="btn-primary-add"
                                onClick={() => setTransactionModalOpen(true)}
                            >
                                <FaPlus />
                                Add Transaction
                            </button>
                        </div>

                        {/* Transaction Statistics */}
                        <div className="parties-details-stats-grid">
                            <div className="parties-details-stat-card">
                                <div className="parties-details-stat-icon" style={{ background: '#FDF1D5', color: '#f7b731' }}>
                                    <FaArrowUp size={28} />
                                </div>
                                <div className="parties-details-stat-content">
                                    <h3>Total Given</h3>
                                    <p className="parties-details-stat-amount">{formatCurrency(stats.gaveAmount)}</p>
                                </div>
                            </div>

                            <div className="parties-details-stat-card">
                                <div className="parties-details-stat-icon" style={{ background: '#D0F4E1', color: '#34c77b' }}>
                                    <FaArrowDown size={28} />
                                </div>
                                <div className="parties-details-stat-content">
                                    <h3>Total Received</h3>
                                    <p className="parties-details-stat-amount">{formatCurrency(stats.gotAmount)}</p>
                                </div>
                            </div>

                            <div className="parties-details-stat-card">
                                <div className="parties-details-stat-icon" style={{ background: '#DCE8FF', color: '#4f8cff' }}>
                                    <FaBalanceScale size={28} />
                                </div>
                                <div className="parties-details-stat-content">
                                    <h3>Net Balance</h3>
                                    <p className={`parties-details-stat-amount ${stats.netAmount >= 0 ? 'positive' : 'negative'}`}>
                                        {formatCurrency(Math.abs(stats.netAmount))}
                                    </p>
                                </div>
                            </div>

                            <div className="parties-details-stat-card">
                                <div className="parties-details-stat-icon" style={{ background: '#FAD9D9', color: '#e94f4f' }}>
                                    <FaListAlt size={28} />
                                </div>
                                <div className="parties-details-stat-content">
                                    <h3>Transactions</h3>
                                    <p className="parties-details-stat-amount">{stats.totalTransactions}</p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="parties-details-transactions-section">
                            <div className="parties-details-transactions-header">
                                <h2>Transaction History</h2>
                                <div className="parties-details-search">
                                    <FaSearch />
                                    <input
                                        type="text"
                                        placeholder="Search transactions..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="parties-details-transactions-table-wrapper">
                                {transactions.length === 0 ? (
                                    <div className="parties-details-empty-state">
                                        <FaMoneyBillWave size={48} color="#7b7b93" />
                                        <h3>No transactions yet</h3>
                                        <p>Start by adding your first transaction with this {party.type}.</p>
                                    </div>
                                ) : (
                                    <div className="parties-details-transactions-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Type</th>
                                                    <th>Amount</th>
                                                    <th>Payment Method</th>
                                                    <th>Notes</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.map((transaction) => (
                                                    <tr key={transaction._id}>
                                                        <td>{formatDate(transaction.date)}</td>
                                                        <td>
                                                            <span className={`transaction-type-badge ${transaction.type}`}>
                                                                {transaction.type === 'gave' ? 'Given' : 'Received'}
                                                            </span>
                                                        </td>
                                                        <td className="transaction-amount">
                                                            {formatCurrency(transaction.amount)}
                                                        </td>
                                                        <td>
                                                            <span className="payment-method-badge">
                                                                {transaction.paymentMethod}
                                                            </span>
                                                        </td>
                                                        <td className="transaction-notes">
                                                            {transaction.notes || '-'}
                                                        </td>
                                                        <td className="transaction-actions">
                                                            <button
                                                                className="btn"
                                                                onClick={() => handleOpenEditTransaction(transaction)}
                                                                title="Edit"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                className="btn"
                                                                onClick={() => handleDeleteTransaction(transaction._id)}
                                                                title="Delete"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {totalPages > 1 && (
                                <div className="parties-details-pagination">
                                    <button
                                        className="parties-details-pagination-arrow"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    {getPageNumbers().map((p, idx) =>
                                        p === '...'
                                            ? <span key={idx} className="parties-details-pagination-info">...</span>
                                            : <button
                                                key={p}
                                                className={`parties-details-pagination-page${p === page ? ' active' : ''}`}
                                                onClick={() => setPage(p)}
                                            >
                                                {p}
                                            </button>
                                    )}
                                    <button
                                        className="parties-details-pagination-arrow"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Add Transaction Modal */}
                        {transactionModalOpen && (
                            <div className="parties-modal-backdrop" onClick={() => setTransactionModalOpen(false)}>
                                <div className="parties-modal" onClick={e => e.stopPropagation()}>
                                    <h3 className="parties-modal-title">Add Transaction</h3>
                                    <form onSubmit={handleAddTransaction} className="parties-modal-form">
                                        <div className="parties-modal-row">
                                            <label className="parties-modal-label">
                                                Transaction Type
                                                <select
                                                    name="type"
                                                    value={transactionForm.type}
                                                    onChange={handleTransactionChange}
                                                    className="parties-modal-input"
                                                    required
                                                >
                                                    <option value="gave">Given (You gave money)</option>
                                                    <option value="got">Received (You received money)</option>
                                                </select>
                                            </label>
                                            <label className="parties-modal-label">
                                                Amount (₹)
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={transactionForm.amount}
                                                    onChange={handleTransactionChange}
                                                    className="parties-modal-input"
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                />
                                            </label>
                                        </div>
                                        <label className="parties-modal-label">
                                            Payment Method
                                            <select
                                                name="paymentMethod"
                                                value={transactionForm.paymentMethod}
                                                onChange={handleTransactionChange}
                                                className="parties-modal-input"
                                                required
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="online">Online</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </label>
                                        <label className="parties-modal-label">
                                            Date
                                            <input
                                                type="date"
                                                name="date"
                                                value={transactionForm.date}
                                                onChange={handleTransactionChange}
                                                className="parties-modal-input"
                                                required
                                            />
                                        </label>
                                        <label className="parties-modal-label">
                                            Notes
                                            <textarea
                                                name="notes"
                                                value={transactionForm.notes}
                                                onChange={handleTransactionChange}
                                                className="parties-modal-input"
                                                rows="3"
                                                placeholder="Optional notes about this transaction"
                                            />
                                        </label>
                                        <div className="parties-modal-actions">
                                            <button
                                                type="button"
                                                className="btn-cancel"
                                                onClick={() => setTransactionModalOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn-submit">
                                                Add Transaction
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Edit Transaction Modal */}
                        {editTransactionModalOpen && (
                            <div className="parties-modal-backdrop" onClick={() => setEditTransactionModalOpen(false)}>
                                <div className="parties-modal" onClick={e => e.stopPropagation()}>
                                    <h3 className="parties-modal-title">Edit Transaction</h3>
                                    <form onSubmit={handleEditTransaction} className="parties-modal-form">
                                        <div className="parties-modal-row">
                                            <label className="parties-modal-label">
                                                Transaction Type
                                                <select
                                                    name="type"
                                                    value={editTransactionForm.type}
                                                    onChange={handleEditTransactionChange}
                                                    className="parties-modal-input"
                                                    required
                                                >
                                                    <option value="gave">Given (You gave money)</option>
                                                    <option value="got">Received (You received money)</option>
                                                </select>
                                            </label>
                                            <label className="parties-modal-label">
                                                Amount (₹)
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={editTransactionForm.amount}
                                                    onChange={handleEditTransactionChange}
                                                    className="parties-modal-input"
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                />
                                            </label>
                                        </div>
                                        <label className="parties-modal-label">
                                            Payment Method
                                            <select
                                                name="paymentMethod"
                                                value={editTransactionForm.paymentMethod}
                                                onChange={handleEditTransactionChange}
                                                className="parties-modal-input"
                                                required
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="online">Online</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </label>
                                        <label className="parties-modal-label">
                                            Date
                                            <input
                                                type="date"
                                                name="date"
                                                value={editTransactionForm.date}
                                                onChange={handleEditTransactionChange}
                                                className="parties-modal-input"
                                                required
                                            />
                                        </label>
                                        <label className="parties-modal-label">
                                            Notes
                                            <textarea
                                                name="notes"
                                                value={editTransactionForm.notes}
                                                onChange={handleEditTransactionChange}
                                                className="parties-modal-input"
                                                rows="3"
                                                placeholder="Optional notes about this transaction"
                                            />
                                        </label>
                                        <div className="parties-modal-actions">
                                            <button
                                                type="button"
                                                className="btn-cancel"
                                                onClick={() => setEditTransactionModalOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn-submit">
                                                Update Transaction
                                            </button>
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
