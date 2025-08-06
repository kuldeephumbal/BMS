import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaMoneyBillWave,
    FaChartLine,
    FaTimes
} from 'react-icons/fa';

export default function ExpenseBudget() {
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Active tab state for mobile
    const [activeTab, setActiveTab] = useState('expenses');

    // Expenses state
    const [expenses, setExpenses] = useState([
        { id: 1, category: 'Office Supplies', amount: 2500, date: '2025-01-15', description: 'Stationery and office materials' },
        { id: 2, category: 'Marketing', amount: 15000, date: '2025-01-10', description: 'Social media advertising campaign' },
        { id: 3, category: 'Utilities', amount: 3200, date: '2025-01-05', description: 'Electricity and internet bills' }
    ]);
    const [expenseForm, setExpenseForm] = useState({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [expenseError, setExpenseError] = useState('');

    // Budget state
    const [budgets, setBudgets] = useState([
        { id: 1, category: 'Office Supplies', allocated: 10000, spent: 2500, month: '2025-01' },
        { id: 2, category: 'Marketing', allocated: 50000, spent: 15000, month: '2025-01' },
        { id: 3, category: 'Utilities', allocated: 5000, spent: 3200, month: '2025-01' }
    ]);
    const [budgetForm, setBudgetForm] = useState({
        category: '',
        allocated: '',
        month: new Date().toISOString().slice(0, 7)
    });
    const [budgetModalOpen, setBudgetModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [budgetError, setBudgetError] = useState('');

    // Search states
    const [expenseSearch, setExpenseSearch] = useState('');
    const [budgetSearch, setBudgetSearch] = useState('');

    // Confirm modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({});

    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token || !user._id) {
            navigate('/login');
            return;
        }
    }, [token, user._id, navigate]);

    // Listen for sidebar toggle events
    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarOpen(event.detail.isOpen);
        };

        window.addEventListener('sidebarToggle', handleSidebarToggle);
        return () => {
            window.removeEventListener('sidebarToggle', handleSidebarToggle);
        };
    }, []);

    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };

    // Expense handlers
    const handleExpenseChange = (e) => {
        const { name, value } = e.target;
        setExpenseForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setExpenseError('');

        if (!expenseForm.category || !expenseForm.amount || !expenseForm.date) {
            setExpenseError('Please fill in all required fields.');
            return;
        }

        if (parseFloat(expenseForm.amount) <= 0) {
            setExpenseError('Amount must be greater than 0.');
            return;
        }

        try {
            const newExpense = {
                id: editingExpense ? editingExpense.id : Date.now(),
                category: expenseForm.category,
                amount: parseFloat(expenseForm.amount),
                date: expenseForm.date,
                description: expenseForm.description
            };

            if (editingExpense) {
                setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? newExpense : exp));
                toast.success('Expense updated successfully!');
            } else {
                setExpenses(prev => [...prev, newExpense]);
                toast.success('Expense added successfully!');
            }

            setExpenseModalOpen(false);
            setExpenseForm({
                category: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: ''
            });
            setEditingExpense(null);
        } catch (error) {
            setExpenseError('Error saving expense');
            toast.error('Error saving expense');
        }
    };

    const handleEditExpense = (expense) => {
        setExpenseForm({
            category: expense.category,
            amount: expense.amount.toString(),
            date: expense.date,
            description: expense.description
        });
        setEditingExpense(expense);
        setExpenseError('');
        setExpenseModalOpen(true);
    };

    const handleDeleteExpense = (expenseId) => {
        const expense = expenses.find(exp => exp.id === expenseId);
        setConfirmModalData({
            title: 'Delete Expense',
            message: `Are you sure you want to delete the expense "${expense?.category}" of ₹${expense?.amount}?`,
            onConfirm: () => {
                setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
                toast.success('Expense deleted successfully!');
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };

    // Budget handlers
    const handleBudgetChange = (e) => {
        const { name, value } = e.target;
        setBudgetForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddBudget = async (e) => {
        e.preventDefault();
        setBudgetError('');

        if (!budgetForm.category || !budgetForm.allocated || !budgetForm.month) {
            setBudgetError('Please fill in all required fields.');
            return;
        }

        if (parseFloat(budgetForm.allocated) <= 0) {
            setBudgetError('Allocated amount must be greater than 0.');
            return;
        }

        try {
            const spent = expenses
                .filter(exp => exp.category === budgetForm.category && exp.date.startsWith(budgetForm.month))
                .reduce((sum, exp) => sum + exp.amount, 0);

            const newBudget = {
                id: editingBudget ? editingBudget.id : Date.now(),
                category: budgetForm.category,
                allocated: parseFloat(budgetForm.allocated),
                spent: spent,
                month: budgetForm.month
            };

            if (editingBudget) {
                setBudgets(prev => prev.map(budget => budget.id === editingBudget.id ? newBudget : budget));
                toast.success('Budget updated successfully!');
            } else {
                setBudgets(prev => [...prev, newBudget]);
                toast.success('Budget added successfully!');
            }

            setBudgetModalOpen(false);
            setBudgetForm({
                category: '',
                allocated: '',
                month: new Date().toISOString().slice(0, 7)
            });
            setEditingBudget(null);
        } catch (error) {
            setBudgetError('Error saving budget');
            toast.error('Error saving budget');
        }
    };

    const handleEditBudget = (budget) => {
        setBudgetForm({
            category: budget.category,
            allocated: budget.allocated.toString(),
            month: budget.month
        });
        setEditingBudget(budget);
        setBudgetError('');
        setBudgetModalOpen(true);
    };

    const handleDeleteBudget = (budgetId) => {
        const budget = budgets.find(b => b.id === budgetId);
        setConfirmModalData({
            title: 'Delete Budget',
            message: `Are you sure you want to delete the budget for "${budget?.category}"?`,
            onConfirm: () => {
                setBudgets(prev => prev.filter(b => b.id !== budgetId));
                toast.success('Budget deleted successfully!');
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };

    // Filter functions
    const getFilteredExpenses = () => {
        return expenses.filter(expense => {
            const matchesSearch = expense.category.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                expense.description.toLowerCase().includes(expenseSearch.toLowerCase());
            return matchesSearch;
        });
    };

    const getFilteredBudgets = () => {
        return budgets.filter(budget => {
            const matchesSearch = budget.category.toLowerCase().includes(budgetSearch.toLowerCase());
            return matchesSearch;
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getBudgetStatus = (budget) => {
        const percentage = (budget.spent / budget.allocated) * 100;
        if (percentage >= 100) return { status: 'exceeded', color: '#dc2626' };
        if (percentage >= 80) return { status: 'warning', color: '#d97706' };
        return { status: 'good', color: '#16a34a' };
    };

    return (
        <div className="main-layout-root">
            <div className="main-layout-row">
                <Sidebar open={sidebarOpen} />
                <div className="main-content-container">
                    <Header onToggleSidebar={handleToggleSidebar} />
                    <div className="main-content">
                        {/* Page Header with Toggle Buttons */}
                        <div className="main-data-header-row">
                            <div className="d-flex align-items-center justify-content-between w-100">
                                <h1 className="main-data-page-title">
                                    Expense & Budget Management
                                </h1>
                                <div className="expense-budget-toggle">
                                    <div className="btn-group" role="group">
                                        <button
                                            type="button"
                                            className={`btn ${activeTab === 'expenses' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setActiveTab('expenses')}
                                        >
                                            <FaMoneyBillWave className="me-2" />
                                            Expenses
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn ${activeTab === 'budgets' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setActiveTab('budgets')}
                                        >
                                            <FaChartLine className="me-2" />
                                            Budgets
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content - Single Section */}
                        <div className="row">
                            {/* Expenses Section */}
                            <div className={`col-12 ${activeTab === 'expenses' ? 'd-block' : 'd-none'}`}>
                                <div className="common-card">
                                    <div className="common-card-header d-flex align-items-center justify-content-between">
                                        <div className='d-flex align-items-center justify-content-between gap-2'>
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
                                                        value={expenseSearch}
                                                        onChange={(e) => setExpenseSearch(e.target.value)}
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
                                                setExpenseError('');
                                                setExpenseModalOpen(true);
                                            }}
                                        >
                                            <FaPlus /> Add Expense
                                        </button>
                                    </div>

                                    {/* Expense Table */}
                                    <div className="main-data-table-wrapper">
                                        <table className="main-data-table">
                                            <thead>
                                                <tr>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            Category
                                                        </div>
                                                    </th>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            Amount
                                                        </div>
                                                    </th>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            Date
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
                                                {getFilteredExpenses().length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="text-center py-4">
                                                            {expenseSearch
                                                                ? 'No expenses found matching your criteria.'
                                                                : 'No expenses found. Add your first expense!'}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    getFilteredExpenses().map((expense) => (
                                                        <tr key={expense.id} className="main-data-table-row">
                                                            <td>
                                                                <div>
                                                                    <div className="fw-medium">{expense.category}</div>
                                                                    {expense.description && (
                                                                        <small className="text-muted">{expense.description}</small>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="fw-bold text-danger">
                                                                {formatCurrency(expense.amount)}
                                                            </td>
                                                            <td>{formatDate(expense.date)}</td>
                                                            <td>
                                                                <div className="d-flex gap-1">
                                                                    <button
                                                                        className="main-data-icon-btn"
                                                                        onClick={() => handleEditExpense(expense)}
                                                                        title="Edit Expense"
                                                                    >
                                                                        <FaEdit />
                                                                    </button>
                                                                    <button
                                                                        className="main-data-icon-btn text-danger"
                                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                                        title="Delete Expense"
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
                                </div>
                            </div>

                            {/* Budgets Section */}
                            <div className={`col-12 ${activeTab === 'budgets' ? 'd-block' : 'd-none'}`}>
                                <div className="common-card">
                                    <div className="common-card-header d-flex align-items-center justify-content-between">
                                        <div className='d-flex align-items-center justify-content-between gap-2'>
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
                                                        value={budgetSearch}
                                                        onChange={(e) => setBudgetSearch(e.target.value)}
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
                                                setBudgetError('');
                                                setBudgetModalOpen(true);
                                            }}
                                        >
                                            <FaPlus /> Add Budget
                                        </button>
                                    </div>

                                    {/* Budget Table */}
                                    <div className="main-data-table-wrapper">
                                        <table className="main-data-table">
                                            <thead>
                                                <tr>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            Category
                                                        </div>
                                                    </th>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            Budget
                                                        </div>
                                                    </th>
                                                    <th className="table-header-cell">
                                                        <div className="table-header-content">
                                                            Spent
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
                                                {getFilteredBudgets().length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="text-center py-4">
                                                            {budgetSearch
                                                                ? 'No budgets found matching your criteria.'
                                                                : 'No budgets found. Add your first budget!'}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    getFilteredBudgets().map((budget) => {
                                                        const status = getBudgetStatus(budget);
                                                        const percentage = Math.min((budget.spent / budget.allocated) * 100, 100);

                                                        return (
                                                            <tr key={budget.id} className="main-data-table-row">
                                                                <td>
                                                                    <div>
                                                                        <div className="fw-medium">{budget.category}</div>
                                                                        <small className="text-muted">{budget.month}</small>
                                                                    </div>
                                                                </td>
                                                                <td className="fw-bold">
                                                                    {formatCurrency(budget.allocated)}
                                                                </td>
                                                                <td className="fw-bold text-danger">
                                                                    {formatCurrency(budget.spent)}
                                                                </td>
                                                                <td>
                                                                    <div>
                                                                        <div className="progress mb-1" style={{ height: '6px' }}>
                                                                            <div
                                                                                className="progress-bar"
                                                                                style={{
                                                                                    width: `${percentage}%`,
                                                                                    backgroundColor: status.color
                                                                                }}
                                                                            ></div>
                                                                        </div>
                                                                        <small style={{ color: status.color }}>
                                                                            {percentage.toFixed(1)}%
                                                                        </small>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="d-flex gap-1">
                                                                        <button
                                                                            className="main-data-icon-btn"
                                                                            onClick={() => handleEditBudget(budget)}
                                                                            title="Edit Budget"
                                                                        >
                                                                            <FaEdit />
                                                                        </button>
                                                                        <button
                                                                            className="main-data-icon-btn text-danger"
                                                                            onClick={() => handleDeleteBudget(budget.id)}
                                                                            title="Delete Budget"
                                                                        >
                                                                            <FaTrash />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Add/Edit Expense Modal */}
                        {expenseModalOpen && (
                            <div className="main-data-modal-backdrop">
                                <div className="main-data-modal">
                                    <div className="main-data-modal-header">
                                        <h2 className="main-data-modal-title">
                                            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                                        </h2>
                                        <button
                                            type="button"
                                            className="main-data-modal-close"
                                            onClick={() => {
                                                setExpenseModalOpen(false);
                                                setEditingExpense(null);
                                                setExpenseForm({
                                                    category: '',
                                                    amount: '',
                                                    date: new Date().toISOString().split('T')[0],
                                                    description: ''
                                                });
                                            }}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddExpense} className="main-data-modal-form">
                                        {expenseError && <div className="main-data-modal-error">{expenseError}</div>}

                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">
                                                Category *
                                                <input
                                                    type="text"
                                                    name="category"
                                                    value={expenseForm.category}
                                                    onChange={handleExpenseChange}
                                                    className="main-data-modal-input"
                                                    placeholder="e.g., Office Supplies, Marketing"
                                                    required
                                                />
                                            </label>
                                            <label className="main-data-modal-label">
                                                Amount *
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={expenseForm.amount}
                                                    onChange={handleExpenseChange}
                                                    className="main-data-modal-input"
                                                    placeholder="Enter amount"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </label>
                                        </div>

                                        <label className="main-data-modal-label">
                                            Date *
                                            <input
                                                type="date"
                                                name="date"
                                                value={expenseForm.date}
                                                onChange={handleExpenseChange}
                                                className="main-data-modal-input"
                                                required
                                            />
                                        </label>

                                        <label className="main-data-modal-label">
                                            Description
                                            <textarea
                                                name="description"
                                                value={expenseForm.description}
                                                onChange={handleExpenseChange}
                                                className="main-data-modal-input"
                                                placeholder="Enter expense description (optional)"
                                                rows="3"
                                            />
                                        </label>

                                        <div className="main-data-modal-actions">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setExpenseModalOpen(false);
                                                    setEditingExpense(null);
                                                    setExpenseForm({
                                                        category: '',
                                                        amount: '',
                                                        date: new Date().toISOString().split('T')[0],
                                                        description: ''
                                                    });
                                                }}
                                                className="btn-cancel"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn-save">
                                                {editingExpense ? 'Update Expense' : 'Add Expense'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Add/Edit Budget Modal */}
                        {budgetModalOpen && (
                            <div className="main-data-modal-backdrop">
                                <div className="main-data-modal">
                                    <div className="main-data-modal-header">
                                        <h2 className="main-data-modal-title">
                                            {editingBudget ? 'Edit Budget' : 'Add New Budget'}
                                        </h2>
                                        <button
                                            type="button"
                                            className="main-data-modal-close"
                                            onClick={() => {
                                                setBudgetModalOpen(false);
                                                setEditingBudget(null);
                                                setBudgetForm({
                                                    category: '',
                                                    allocated: '',
                                                    month: new Date().toISOString().slice(0, 7)
                                                });
                                            }}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddBudget} className="main-data-modal-form">
                                        {budgetError && <div className="main-data-modal-error">{budgetError}</div>}

                                        <div className="main-data-modal-row">
                                            <label className="main-data-modal-label">
                                                Category *
                                                <input
                                                    type="text"
                                                    name="category"
                                                    value={budgetForm.category}
                                                    onChange={handleBudgetChange}
                                                    className="main-data-modal-input"
                                                    placeholder="e.g., Office Supplies, Marketing"
                                                    required
                                                />
                                            </label>
                                            <label className="main-data-modal-label">
                                                Allocated Amount *
                                                <input
                                                    type="number"
                                                    name="allocated"
                                                    value={budgetForm.allocated}
                                                    onChange={handleBudgetChange}
                                                    className="main-data-modal-input"
                                                    placeholder="Enter budget amount"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </label>
                                        </div>

                                        <label className="main-data-modal-label">
                                            Month *
                                            <input
                                                type="month"
                                                name="month"
                                                value={budgetForm.month}
                                                onChange={handleBudgetChange}
                                                className="main-data-modal-input"
                                                required
                                            />
                                        </label>

                                        <div className="main-data-modal-actions">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBudgetModalOpen(false);
                                                    setEditingBudget(null);
                                                    setBudgetForm({
                                                        category: '',
                                                        allocated: '',
                                                        month: new Date().toISOString().slice(0, 7)
                                                    });
                                                }}
                                                className="btn-cancel"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn-save">
                                                {editingBudget ? 'Update Budget' : 'Add Budget'}
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
                            onClose={() => setShowConfirmModal(false)}
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
