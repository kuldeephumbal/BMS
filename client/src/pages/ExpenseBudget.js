import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { BASE_URL } from '../components/BaseURL';
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

    // Categories state
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Expenses state
    const [expenses, setExpenses] = useState([]);
    const [expenseForm, setExpenseForm] = useState({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [expenseError, setExpenseError] = useState('');
    const [expensesLoading, setExpensesLoading] = useState(false);

    // Budget state
    const [budgets, setBudgets] = useState([]);
    const [budgetForm, setBudgetForm] = useState({
        category: '',
        amount: '',
        month: new Date().toISOString().slice(0, 7),
        note: ''
    });
    const [budgetModalOpen, setBudgetModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [budgetError, setBudgetError] = useState('');
    const [budgetsLoading, setBudgetsLoading] = useState(false);

    // Search states
    const [expenseSearch, setExpenseSearch] = useState('');
    const [budgetSearch, setBudgetSearch] = useState('');

    // Confirm modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({});

    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    // Fetch categories from API
    const fetchCategories = useCallback(async () => {
        try {
            setCategoriesLoading(true);
            const response = await axios.get(`${BASE_URL}/category`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.categories) {
                setCategories(response.data.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Error fetching categories');
            }
        } finally {
            setCategoriesLoading(false);
        }
    }, [token]);

    // Fetch expenses from API
    const fetchExpenses = useCallback(async () => {
        try {
            setExpensesLoading(true);
            const response = await axios.get(`${BASE_URL}/expense`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    userId: user._id
                }
            });

            if (response.data && response.data.expenses) {
                setExpenses(response.data.expenses);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            toast.error('Error fetching expenses');
        } finally {
            setExpensesLoading(false);
        }
    }, [token, user._id]);

    // Create expense API call
    const createExpense = async (expenseData) => {
        try {
            const response = await axios.post(`${BASE_URL}/expense`, expenseData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.expense) {
                return response.data.expense;
            }
            throw new Error('Invalid response format');
        } catch (error) {
            console.error('Error creating expense:', error);
            throw error;
        }
    };

    // Update expense API call
    const updateExpense = async (expenseId, expenseData) => {
        try {
            const response = await axios.put(`${BASE_URL}/expense/${expenseId}`, expenseData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.expense) {
                return response.data.expense;
            }
            throw new Error('Invalid response format');
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    };

    // Delete expense API call
    const deleteExpense = async (expenseId) => {
        try {
            await axios.delete(`${BASE_URL}/expense/${expenseId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    };

    // Fetch budgets from API
    const fetchBudgets = useCallback(async () => {
        try {
            setBudgetsLoading(true);
            const response = await axios.get(`${BASE_URL}/budget`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    userId: user._id
                }
            });

            if (response.data && response.data.budgets) {
                setBudgets(response.data.budgets);
            }
        } catch (error) {
            console.error('Error fetching budgets:', error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Error fetching budgets');
            }
        } finally {
            setBudgetsLoading(false);
        }
    }, [token, user._id]);

    // Create budget API call
    const createBudget = async (budgetData) => {
        try {
            const response = await axios.post(`${BASE_URL}/budget`, budgetData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.budget) {
                return response.data.budget;
            }
            throw new Error('Invalid response format');
        } catch (error) {
            console.error('Error creating budget:', error);
            throw error;
        }
    };

    // Update budget API call
    const updateBudget = async (budgetId, budgetData) => {
        try {
            const response = await axios.put(`${BASE_URL}/budget/${budgetId}`, budgetData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.budget) {
                return response.data.budget;
            }
            throw new Error('Invalid response format');
        } catch (error) {
            console.error('Error updating budget:', error);
            throw error;
        }
    };

    // Delete budget API call
    const deleteBudget = async (budgetId) => {
        try {
            await axios.delete(`${BASE_URL}/budget/${budgetId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error deleting budget:', error);
            throw error;
        }
    };

    // Helper function to get category name by ID
    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat._id === categoryId);
        return category ? category.name : 'Unknown Category';
    };

    // Helper function to calculate spent amount for a budget
    const getSpentAmount = (budget) => {
        const categoryId = budget.category._id || budget.category;
        return expenses
            .filter(expense => {
                const expenseCategory = expense.category._id || expense.category;
                const expenseMonth = expense.date.substring(0, 7); // Get YYYY-MM format
                return expenseCategory === categoryId && expenseMonth === budget.month;
            })
            .reduce((sum, expense) => sum + expense.amount, 0);
    };

    useEffect(() => {
        if (!token || !user._id) {
            navigate('/login');
            return;
        }
        fetchCategories();
        fetchExpenses();
        fetchBudgets();
    }, [token, user._id, navigate, fetchCategories, fetchExpenses, fetchBudgets]);

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

        if (!expenseForm.note || expenseForm.note.trim() === '') {
            setExpenseError('Note is required.');
            return;
        }

        try {
            const expenseData = {
                userId: user._id,
                category: expenseForm.category,
                amount: parseFloat(expenseForm.amount),
                note: expenseForm.note.trim(),
                date: expenseForm.date
            };

            if (editingExpense) {
                const updatedExpense = await updateExpense(editingExpense._id, {
                    category: expenseForm.category,
                    amount: parseFloat(expenseForm.amount),
                    note: expenseForm.note.trim(),
                    date: expenseForm.date
                });

                setExpenses(prev => prev.map(exp =>
                    exp._id === editingExpense._id ? updatedExpense : exp
                ));
                toast.success('Expense updated successfully!');
            } else {
                const newExpense = await createExpense(expenseData);
                setExpenses(prev => [newExpense, ...prev]);
                toast.success('Expense added successfully!');
            }

            setExpenseModalOpen(false);
            setExpenseForm({
                category: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                note: ''
            });
            setEditingExpense(null);
        } catch (error) {
            console.error('Error saving expense:', error);
            if (error.response && error.response.data && error.response.data.message) {
                setExpenseError(error.response.data.message);
                toast.error(error.response.data.message);
            } else {
                setExpenseError('Error saving expense');
                toast.error('Error saving expense');
            }
        }
    };

    const handleEditExpense = (expense) => {
        setExpenseForm({
            category: expense.category._id || expense.category,
            amount: expense.amount.toString(),
            date: expense.date.split('T')[0], // Format date for input
            note: expense.note || ''
        });
        setEditingExpense(expense);
        setExpenseError('');
        setExpenseModalOpen(true);
    };

    const handleDeleteExpense = (expenseId) => {
        const expense = expenses.find(exp => exp._id === expenseId);
        const categoryName = expense?.category?.name || getCategoryName(expense?.category) || 'Unknown Category';
        setConfirmModalData({
            title: 'Delete Expense',
            message: `Are you sure you want to delete the expense "${categoryName}" of ₹${expense?.amount}?`,
            onConfirm: async () => {
                try {
                    await deleteExpense(expenseId);
                    setExpenses(prev => prev.filter(exp => exp._id !== expenseId));
                    toast.success('Expense deleted successfully!');
                    setShowConfirmModal(false);
                } catch (error) {
                    console.error('Error deleting expense:', error);
                    toast.error('Error deleting expense');
                }
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

        if (!budgetForm.category || !budgetForm.amount || !budgetForm.month) {
            setBudgetError('Please fill in all required fields.');
            return;
        }

        if (parseFloat(budgetForm.amount) <= 0) {
            setBudgetError('Amount must be greater than 0.');
            return;
        }

        if (!budgetForm.note || budgetForm.note.trim() === '') {
            setBudgetError('Note is required.');
            return;
        }

        try {
            const budgetData = {
                userId: user._id,
                category: budgetForm.category,
                amount: parseFloat(budgetForm.amount),
                note: budgetForm.note.trim(),
                month: budgetForm.month
            };

            if (editingBudget) {
                const updatedBudget = await updateBudget(editingBudget._id, {
                    category: budgetForm.category,
                    amount: parseFloat(budgetForm.amount),
                    note: budgetForm.note.trim(),
                    month: budgetForm.month
                });

                setBudgets(prev => prev.map(budget =>
                    budget._id === editingBudget._id ? updatedBudget : budget
                ));
                toast.success('Budget updated successfully!');
            } else {
                const newBudget = await createBudget(budgetData);
                setBudgets(prev => [newBudget, ...prev]);
                toast.success('Budget added successfully!');
            }

            setBudgetModalOpen(false);
            setBudgetForm({
                category: '',
                amount: '',
                month: new Date().toISOString().slice(0, 7),
                note: ''
            });
            setEditingBudget(null);
        } catch (error) {
            console.error('Error saving budget:', error);
            if (error.response && error.response.data && error.response.data.message) {
                setBudgetError(error.response.data.message);
                toast.error(error.response.data.message);
            } else {
                setBudgetError('Error saving budget');
                toast.error('Error saving budget');
            }
        }
    };

    const handleEditBudget = (budget) => {
        setBudgetForm({
            category: budget.category._id || budget.category,
            amount: budget.amount.toString(),
            month: budget.month,
            note: budget.note || ''
        });
        setEditingBudget(budget);
        setBudgetError('');
        setBudgetModalOpen(true);
    };

    const handleDeleteBudget = (budgetId) => {
        const budget = budgets.find(b => b._id === budgetId);
        const categoryName = budget?.category?.name || getCategoryName(budget?.category) || 'Unknown Category';
        setConfirmModalData({
            title: 'Delete Budget',
            message: `Are you sure you want to delete the budget for "${categoryName}"?`,
            onConfirm: async () => {
                try {
                    await deleteBudget(budgetId);
                    setBudgets(prev => prev.filter(b => b._id !== budgetId));
                    toast.success('Budget deleted successfully!');
                    setShowConfirmModal(false);
                } catch (error) {
                    console.error('Error deleting budget:', error);
                    toast.error('Error deleting budget');
                }
            }
        });
        setShowConfirmModal(true);
    };

    // Filter functions
    const getFilteredExpenses = () => {
        return expenses.filter(expense => {
            const categoryName = expense.category?.name || getCategoryName(expense.category);
            const matchesSearch = categoryName.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                (expense.note && expense.note.toLowerCase().includes(expenseSearch.toLowerCase()));
            return matchesSearch;
        });
    };

    const getFilteredBudgets = () => {
        return budgets.filter(budget => {
            const categoryName = budget.category?.name || getCategoryName(budget.category);
            const matchesSearch = categoryName.toLowerCase().includes(budgetSearch.toLowerCase()) ||
                (budget.note && budget.note.toLowerCase().includes(budgetSearch.toLowerCase()));
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
        const spent = getSpentAmount(budget);
        const percentage = (spent / budget.amount) * 100;
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
                                <div className="main-data-header-row">
                                    <div className="d-flex align-items-center justify-content-between w-100">
                                        <div className="d-flex align-items-center gap-3">
                                            <h2 className="main-data-page-title d-flex align-items-center gap-2">
                                                Expenses
                                            </h2>
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
                                        <div className="d-flex align-items-center gap-3">
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
                                    </div>
                                </div>

                                <div className="main-data-table-wrapper">
                                    <table className="main-data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left' }}>CATEGORY</th>
                                                <th style={{ textAlign: 'right' }}>AMOUNT</th>
                                                <th style={{ textAlign: 'left' }}>DATE</th>
                                                <th style={{ textAlign: 'left' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expensesLoading ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4">
                                                        Loading expenses...
                                                    </td>
                                                </tr>
                                            ) : getFilteredExpenses().length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4">
                                                        {expenseSearch
                                                            ? 'No expenses found matching your criteria.'
                                                            : 'No expenses found. Add your first expense!'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                getFilteredExpenses().map((expense) => (
                                                    <tr key={expense._id} className="main-data-table-row">
                                                        <td>
                                                            <div>
                                                                <div className="fw-medium">
                                                                    {expense.category?.name || getCategoryName(expense.category)}
                                                                </div>
                                                                {expense.note && (
                                                                    <small className="text-muted">{expense.note}</small>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="fw-bold text-danger" style={{ textAlign: 'right' }}>
                                                            {formatCurrency(expense.amount)}
                                                        </td>
                                                        <td style={{ textAlign: 'left' }}>{formatDate(expense.date)}</td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button
                                                                    className="btn-edit"
                                                                    onClick={() => handleEditExpense(expense)}
                                                                    title="Edit Expense"
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                                <button
                                                                    className="btn-delete-icon"
                                                                    onClick={() => handleDeleteExpense(expense._id)}
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

                            {/* Budgets Section */}
                            <div className={`col-12 ${activeTab === 'budgets' ? 'd-block' : 'd-none'}`}>
                                <div className="main-data-header-row">
                                    <div className="d-flex align-items-center justify-content-between w-100">
                                        <div className="d-flex align-items-center gap-3">
                                            <h2 className="main-data-page-title d-flex align-items-center gap-2">
                                                Budgets
                                            </h2>
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
                                        <div className="d-flex align-items-center gap-3">
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
                                    </div>
                                </div>

                                <div className="main-data-table-wrapper">
                                    <table className="main-data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left' }}>CATEGORY</th>
                                                <th style={{ textAlign: 'right' }}>BUDGET</th>
                                                <th style={{ textAlign: 'right' }}>SPENT</th>
                                                <th style={{ textAlign: 'left' }}>STATUS</th>
                                                <th style={{ textAlign: 'left' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {budgetsLoading ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-4">
                                                        Loading budgets...
                                                    </td>
                                                </tr>
                                            ) : getFilteredBudgets().length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-4">
                                                        {budgetSearch
                                                            ? 'No budgets found matching your criteria.'
                                                            : 'No budgets found. Add your first budget!'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                getFilteredBudgets().map((budget) => {
                                                    const spent = getSpentAmount(budget);
                                                    const status = getBudgetStatus(budget);
                                                    const percentage = Math.min((spent / budget.amount) * 100, 100);

                                                    return (
                                                        <tr key={budget._id} className="main-data-table-row">
                                                            <td>
                                                                <div>
                                                                    <div className="fw-medium">
                                                                        {budget.category?.name || getCategoryName(budget.category)}
                                                                    </div>
                                                                    <small className="text-muted">{budget.month}</small>
                                                                    {budget.note && (
                                                                        <small className="text-muted d-block">{budget.note}</small>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="fw-bold" style={{ textAlign: 'right' }}>
                                                                {formatCurrency(budget.amount)}
                                                            </td>
                                                            <td className="fw-bold text-danger" style={{ textAlign: 'right' }}>
                                                                {formatCurrency(spent)}
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
                                                                <div className="action-buttons">
                                                                    <button
                                                                        className="btn-edit"
                                                                        onClick={() => handleEditBudget(budget)}
                                                                        title="Edit Budget"
                                                                    >
                                                                        <FaEdit />
                                                                    </button>
                                                                    <button
                                                                        className="btn-delete-icon"
                                                                        onClick={() => handleDeleteBudget(budget._id)}
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
                                                    note: ''
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
                                                <select
                                                    name="category"
                                                    value={expenseForm.category}
                                                    onChange={handleExpenseChange}
                                                    className="main-data-modal-input"
                                                    required
                                                    disabled={categoriesLoading}
                                                    style={{ maxHeight: '150px', overflowY: 'auto' }}
                                                >
                                                    <option value="">
                                                        {categoriesLoading ? 'Loading categories...' : 'Select a category'}
                                                    </option>
                                                    {categories
                                                        .sort((a, b) => a.name.localeCompare(b.name))
                                                        .map((category) => (
                                                            <option key={category._id} value={category._id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    {categories.length === 0 && !categoriesLoading && (
                                                        <option value="" disabled>
                                                            No categories available. Please create a category first.
                                                        </option>
                                                    )}
                                                </select>
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
                                            Note *
                                            <textarea
                                                name="note"
                                                value={expenseForm.note}
                                                onChange={handleExpenseChange}
                                                className="main-data-modal-input"
                                                placeholder="Enter expense note"
                                                rows="3"
                                                required
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
                                                        note: ''
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
                                                    amount: '',
                                                    month: new Date().toISOString().slice(0, 7),
                                                    note: ''
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
                                                <select
                                                    name="category"
                                                    value={budgetForm.category}
                                                    onChange={handleBudgetChange}
                                                    className="main-data-modal-input"
                                                    required
                                                    disabled={categoriesLoading}
                                                    style={{ maxHeight: '150px', overflowY: 'auto' }}
                                                >
                                                    <option value="">
                                                        {categoriesLoading ? 'Loading categories...' : 'Select a category'}
                                                    </option>
                                                    {categories
                                                        .sort((a, b) => a.name.localeCompare(b.name))
                                                        .map((category) => (
                                                            <option key={category._id} value={category._id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    {categories.length === 0 && !categoriesLoading && (
                                                        <option value="" disabled>
                                                            No categories available. Please create a category first.
                                                        </option>
                                                    )}
                                                </select>
                                            </label>
                                            <label className="main-data-modal-label">
                                                Budget Amount *
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={budgetForm.amount}
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

                                        <label className="main-data-modal-label">
                                            Note *
                                            <textarea
                                                name="note"
                                                value={budgetForm.note}
                                                onChange={handleBudgetChange}
                                                className="main-data-modal-input"
                                                placeholder="Enter budget note"
                                                rows="3"
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
                                                        amount: '',
                                                        month: new Date().toISOString().slice(0, 7),
                                                        note: ''
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
