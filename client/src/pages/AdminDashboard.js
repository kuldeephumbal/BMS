import React, { useState, useEffect } from 'react';
import { FaUsers, FaDollarSign, FaChartLine, FaEye } from 'react-icons/fa';
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
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useNavigate } from 'react-router-dom';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const stats = [
    { label: 'Users', value: 1240, icon: <FaUsers size={28} />, color: '#4f8cff' },
    { label: 'Revenue', value: '$32,400', icon: <FaDollarSign size={28} />, color: '#34c77b' },
    { label: 'Visits', value: 8920, icon: <FaEye size={28} />, color: '#f7b731' },
    { label: 'Growth', value: '12.4%', icon: <FaChartLine size={28} />, color: '#e94f4f' },
];

const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
        {
            label: 'Sales',
            data: [1200, 1900, 800, 1600, 2200, 2000],
            backgroundColor: 'rgba(79, 140, 255, 0.7)',
            borderRadius: 8,
            maxBarThickness: 32,
        },
    ],
};

const barOptions = {
    responsive: true,
    plugins: {
        legend: { display: false },
        title: { display: false },
    },
    scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#f0f2f5' }, beginAtZero: true },
    },
};

const doughnutData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [
        {
            label: 'Traffic',
            data: [62, 28, 10],
            backgroundColor: [
                'rgba(79, 140, 255, 0.7)',
                'rgba(52, 199, 123, 0.7)',
                'rgba(247, 183, 49, 0.7)',
            ],
            borderWidth: 2,
            borderColor: '#fff',
        },
    ],
};

const doughnutOptions = {
    cutout: '70%',
    plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 16, padding: 20 } },
    },
};

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const handleToggleSidebar = () => setSidebarOpen(!sidebarOpen);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/admin-login');
        }
    }, []);

    return (
        <div className="main-layout-root">
            <div className="main-layout-row">
                {/* Sidebar with curve and shadow */}
                <AdminSidebar open={sidebarOpen} />
                {/* Main area: header + dashboard */}
                <div className="main-content-container">
                    {/* Header with curve and shadow */}
                    <AdminHeader onToggleSidebar={handleToggleSidebar} />
                    {/* Main content with curve and shadow */}
                    <main className="main-content">
                        {/* Statistic Cards */}
                        <div className="row g-4 main-stats-row">
                            {stats.map((stat) => (
                                <div className="col-12 col-sm-6 col-lg-3" key={stat.label}>
                                    <div className="main-stat-card">
                                        <div className="main-stat-icon" style={{ background: stat.color }}>
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
                                    <div className="main-chart-title">Sales Overview</div>
                                    <Bar data={barData} options={barOptions} className="main-bar-chart" />
                                </div>
                            </div>
                            <div className="col-12 col-lg-4">
                                <div className="main-doughnut-chart-container">
                                    <div className="main-chart-title">Traffic Sources</div>
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
