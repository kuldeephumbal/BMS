import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { FaUsers, FaShoppingCart, FaMoneyBillWave, FaBoxes } from 'react-icons/fa';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [partiesCount, setPartiesCount] = useState(0);
    const [salesRevenue, setSalesRevenue] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [productStockValue, setProductStockValue] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState(Array(12).fill(0));
    const [monthlyExpenses, setMonthlyExpenses] = useState(Array(12).fill(0));
    const [paymentMethodStats, setPaymentMethodStats] = useState({ cash: 0, online: 0, unpaid: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // User and business data
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const activeBusinessId = localStorage.getItem('activeBusinessId');

    // Fetch customer and supplier counts
    const fetchPartiesStats = useCallback(async () => {
        if (!activeBusinessId || !token) return;

        try {
            setLoading(true);

            // Fetch customer stats
            const customerResponse = await axios.get('http://localhost:5000/api/parties/stats', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    business_id: activeBusinessId,
                    type: 'customer'
                }
            });

            // Fetch supplier stats
            const supplierResponse = await axios.get('http://localhost:5000/api/parties/stats', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    business_id: activeBusinessId,
                    type: 'supplier'
                }
            });

            const customerCount = customerResponse.data.stats?.total || 0;
            const supplierCount = supplierResponse.data.stats?.total || 0;
            const totalParties = customerCount + supplierCount;

            setPartiesCount(totalParties);
        } catch (error) {
            console.error('Error fetching parties stats:', error);
            setPartiesCount(0);
        } finally {
            setLoading(false);
        }
    }, [activeBusinessId, token]);

    // Fetch sales revenue
    const fetchSalesStats = useCallback(async () => {
        if (!activeBusinessId || !token || !user._id) {
            return;
        }

        try {
            // Fetch sales billings with the same parameters as Billing page
            const salesResponse = await axios.get('http://localhost:5000/api/billing', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    userId: user._id,
                    businessId: activeBusinessId,
                    type: 'sale',
                    page: 1,
                    limit: 1000 // Large limit to get all sales
                }
            });

            const salesData = salesResponse.data.billings || [];
            const currentYear = new Date().getFullYear();

            // Calculate total revenue from all sales
            const totalRevenue = salesData.reduce((sum, sale) => {
                const amount = sale.totalAmount || sale.balanceDue || 0;
                return sum + amount;
            }, 0);

            // Calculate monthly revenue for current year
            const revenueByMonth = Array(12).fill(0);
            const paymentMethods = { cash: 0, online: 0, unpaid: 0 };

            salesData.forEach(sale => {
                const saleDate = new Date(sale.date || sale.createdAt);
                if (saleDate.getFullYear() === currentYear) {
                    const month = saleDate.getMonth(); // 0-11
                    const amount = sale.totalAmount || sale.balanceDue || 0;
                    revenueByMonth[month] += amount;
                }

                // Count payment methods
                const method = sale.method || 'unpaid';
                if (paymentMethods.hasOwnProperty(method)) {
                    paymentMethods[method] += sale.totalAmount || sale.balanceDue || 0;
                }
            });

            setSalesRevenue(totalRevenue);
            setMonthlyRevenue(revenueByMonth);
            setPaymentMethodStats(paymentMethods);
        } catch (error) {
            console.error('Error fetching sales stats:', error);
            setSalesRevenue(0);
            setMonthlyRevenue(Array(12).fill(0));
            setPaymentMethodStats({ cash: 0, online: 0, unpaid: 0 });
        }
    }, [activeBusinessId, token, user._id]);

    // Fetch total expenses
    const fetchExpensesStats = useCallback(async () => {
        if (!token || !user._id) {
            return;
        }

        try {
            // Fetch expenses using the same endpoint as ExpenseBudget page
            const expensesResponse = await axios.get('http://localhost:5000/api/expense', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    userId: user._id,
                    limit: 1000 // Large limit to get all expenses
                }
            });

            const expensesData = expensesResponse.data.expenses || [];
            const currentYear = new Date().getFullYear();

            // Calculate total expenses amount
            const totalExpensesAmount = expensesData.reduce((sum, expense) => {
                const amount = expense.amount || 0;
                return sum + amount;
            }, 0);

            // Calculate monthly expenses for current year
            const expensesByMonth = Array(12).fill(0);
            expensesData.forEach(expense => {
                const expenseDate = new Date(expense.date || expense.createdAt);
                if (expenseDate.getFullYear() === currentYear) {
                    const month = expenseDate.getMonth(); // 0-11
                    const amount = expense.amount || 0;
                    expensesByMonth[month] += amount;
                }
            });

            setTotalExpenses(totalExpensesAmount);
            setMonthlyExpenses(expensesByMonth);
        } catch (error) {
            console.error('Error fetching expenses stats:', error);
            setTotalExpenses(0);
            setMonthlyExpenses(Array(12).fill(0));
        }
    }, [token, user._id]);

    // Fetch product stock value
    const fetchProductsStats = useCallback(async () => {
        if (!activeBusinessId || !token || !user._id) return;

        try {
            const productsResponse = await axios.get('http://localhost:5000/api/product', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    userId: user._id,
                    businessId: activeBusinessId,
                    page: 1,
                    limit: 1000 // Get all products
                }
            });

            const productsData = productsResponse.data.products || [];

            // Calculate total stock value (currentStock × purchasePrice)
            const totalStockValue = productsData.reduce((sum, product) => {
                const currentStock = product.currentStock || product.openingStock || 0; // Fallback to openingStock for existing products
                const purchasePrice = product.purchasePrice || 0;
                const stockValue = currentStock * purchasePrice;
                return sum + stockValue;
            }, 0);

            setProductStockValue(totalStockValue);
        } catch (error) {
            console.error('Error fetching products stats:', error);
            setProductStockValue(0);
        }
    }, [token, user._id, activeBusinessId]);

    // Dynamic stats array with fetched data
    const stats = [
        { label: 'Parties', value: loading ? 'Loading...' : partiesCount, icon: <FaUsers size={28} />, bgcolor: '#DCE8FF', color: '#4f8cff' },
        { label: 'Sales Revenue', value: loading ? 'Loading...' : `₹${salesRevenue.toLocaleString('en-IN')}`, icon: <FaShoppingCart size={28} />, bgcolor: '#D0F4E1', color: '#34c77b' },
        { label: 'Total Expenses', value: loading ? 'Loading...' : `₹${totalExpenses.toLocaleString('en-IN')}`, icon: <FaMoneyBillWave size={28} />, bgcolor: '#FDF1D5', color: '#f7b731' },
        { label: 'Stock Value', value: loading ? 'Loading...' : `₹${productStockValue.toLocaleString('en-IN')}`, icon: <FaBoxes size={28} />, bgcolor: '#FAD9D9', color: '#e94f4f' },
    ];

    const barData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Revenue',
                data: monthlyRevenue,
                backgroundColor: '#34c77b',
                borderRadius: 5,
                maxBarThickness: 20,
            },
            {
                label: 'Expenses',
                data: monthlyExpenses,
                backgroundColor: '#f7b731',
                borderRadius: 5,
                maxBarThickness: 20,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 20,
                    usePointStyle: true
                }
            },
            title: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const value = context.parsed.y;
                        return `${context.dataset.label}: ₹${value.toLocaleString('en-IN')}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                categoryPercentage: 0.8,
                barPercentage: 0.9
            },
            y: {
                grid: { color: '#f0f2f5' },
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return '₹' + value.toLocaleString('en-IN');
                    }
                }
            },
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    const doughnutData = {
        labels: ['Cash Payments', 'Online Payments', 'Unpaid Bills'],
        datasets: [
            {
                label: 'Payment Methods',
                data: [paymentMethodStats.cash, paymentMethodStats.online, paymentMethodStats.unpaid],
                backgroundColor: [
                    'rgba(52, 199, 123, 0.8)', // Green for cash
                    'rgba(79, 140, 255, 0.8)', // Blue for online
                    'rgba(247, 183, 49, 0.8)', // Yellow for unpaid
                ],
                borderWidth: 2,
                borderColor: '#fff',
            },
        ],
    };

    const doughnutOptions = {
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: { boxWidth: 16, padding: 20 }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${context.label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                    }
                }
            }
        },
    };

    const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }

        // Fetch parties, sales, expenses and products stats when component mounts or activeBusinessId changes
        fetchPartiesStats();
        fetchSalesStats();
        fetchExpensesStats();
        fetchProductsStats();

        // Listen for sidebar toggle events from other components
        const handleSidebarToggle = (event) => {
            setSidebarOpen(event.detail.isOpen);
        };

        window.addEventListener('sidebarToggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
    }, [navigate, activeBusinessId, token, fetchPartiesStats, fetchSalesStats, fetchExpensesStats, fetchProductsStats]);

    return (
        <div className="main-layout-root">
            <div className="main-layout-row">
                {/* Sidebar with curve and shadow */}
                <Sidebar open={sidebarOpen} />
                {/* Main area: header + dashboard */}
                <div className="main-content-container">
                    {/* Header with curve and shadow */}
                    <Header onToggleSidebar={handleToggleSidebar} />
                    {/* Main content with curve and shadow */}
                    <main className="main-content">
                        {/* Statistic Cards */}
                        <div className="row g-4 main-stats-row">
                            {stats.map((stat) => (
                                <div className="col-12 col-sm-6 col-lg-3" key={stat.label}>
                                    <div className="main-stat-card">
                                        <div className="main-stat-icon" style={{ background: stat.bgcolor, color: stat.color }}>
                                            {stat.icon}
                                        </div>
                                        <div>
                                            <div className="main-stat-value">{stat.value}</div>
                                            <div className="main-stat-label">{stat.label}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Charts Row */}
                        <div className="row g-4 main-charts-row">
                            <div className="col-12 col-lg-8">
                                <div className="main-bar-chart-container">
                                    <div className="main-chart-title">Revenue vs Expenses (Monthly)</div>
                                    <Bar data={barData} options={barOptions} className="main-bar-chart" />
                                </div>
                            </div>
                            <div className="col-12 col-lg-4">
                                <div className="main-doughnut-chart-container">
                                    <div className="main-chart-title">Sales by Payment Method</div>
                                    <Doughnut data={doughnutData} options={doughnutOptions} className="main-doughnut-chart" />
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}