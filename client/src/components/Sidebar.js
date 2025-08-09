import React, { useState, useEffect } from 'react';
import { FaTachometerAlt, FaCog, FaUsers, FaUserTie, FaBox, FaChartBar, FaMoneyBill, FaFileInvoice, FaChevronDown, FaChevronRight, FaUserFriends, FaUser, FaShoppingCart, FaTags, FaCogs, FaWallet, FaClipboardList, FaBuilding, FaBoxOpen } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const navItems = [
    { label: 'Dashboard', icon: <FaTachometerAlt />, link: '/dashboard' },
    {
        label: 'Parties', icon: <FaUserFriends />, children: [
            { label: 'Customers', icon: <FaUser />, link: '/parties/customer' },
            { label: 'Suppliers', icon: <FaUserTie />, link: '/parties/supplier' },
        ]
    },
    { label: 'Staff Managements', icon: <FaUsers />, link: '/staff-management' },
    { label: 'Expenses & Budgets', icon: <FaWallet />, link: '/expence-budget' },
    {
        label: 'Items', icon: <FaBox />, children: [
            { label: 'Products', icon: <FaBoxOpen />, link: '/products' },
            { label: 'Services', icon: <FaCogs /> },
        ]
    },
    { label: 'Transaction Details', icon: <FaClipboardList /> },
    {
        label: 'Billings', icon: <FaFileInvoice />, children: [
            { label: 'Sales', icon: <FaTags /> },
            { label: 'Purchase', icon: <FaShoppingCart /> },
            { label: 'Expenses', icon: <FaMoneyBill /> },
        ]
    },
    { label: 'Reports', icon: <FaChartBar /> },
    { label: 'Settings', icon: <FaCog /> },
];

export default function Sidebar({ open }) {
    const [openMenus, setOpenMenus] = useState({});
    const [activeBusiness, setActiveBusiness] = useState(null);
    const [lastPartiesType, setLastPartiesType] = useState(localStorage.getItem('lastPartiesType') || 'customer');
    const location = useLocation();

    const handleToggle = (label) => {
        setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const sidebarWidth = open ? 280 : 80;

    // Function to check if a nav item is active
    const isActiveLink = (link) => {
        if (!link) return false;

        // Handle exact matches
        if (location.pathname === link) return true;

        // Handle parties routes specifically
        if (link === '/parties/customer') {
            // Check for customer routes
            if (location.pathname === '/parties/customer' || location.pathname === '/customers') {
                return true;
            }
            // For details pages, check if we came from customers section
            if (location.pathname.includes('/details')) {
                return lastPartiesType === 'customer';
            }
            return false;
        }

        if (link === '/parties/supplier') {
            // Check for supplier routes  
            if (location.pathname === '/parties/supplier' || location.pathname === '/suppliers') {
                return true;
            }
            // For details pages, check if we came from suppliers section
            if (location.pathname.includes('/details')) {
                return lastPartiesType === 'supplier';
            }
            return false;
        }

        // Default behavior for other routes
        return location.pathname.startsWith(link + '/');
    };

    // Function to check if any child of a dropdown is active
    const hasActiveChild = (children) => {
        if (!children) return false;
        return children.some(child => isActiveLink(child.link));
    };

    // Auto-expand menus that have active children (only when sidebar is open)
    useEffect(() => {
        if (open) {
            const newOpenMenus = { ...openMenus };
            let hasChanges = false;

            navItems.forEach(item => {
                if (item.children && hasActiveChild(item.children)) {
                    if (!newOpenMenus[item.label]) {
                        newOpenMenus[item.label] = true;
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                setOpenMenus(newOpenMenus);
            }
        }
    }, [location.pathname, open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Listen for changes in lastPartiesType in localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            const newType = localStorage.getItem('lastPartiesType') || 'customer';
            setLastPartiesType(newType);
        };

        // Listen for storage events (from other tabs)
        window.addEventListener('storage', handleStorageChange);

        // Also listen for custom events within the same tab
        window.addEventListener('lastPartiesTypeChanged', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('lastPartiesTypeChanged', handleStorageChange);
        };
    }, []);

    // Close dropdowns when sidebar is toggled from open to closed
    useEffect(() => {
        if (!open) {
            setOpenMenus({});
        }
    }, [open]);

    // Close dropdowns when clicking outside (for collapsed sidebar)
    useEffect(() => {
        if (!open) {
            const handleClickOutside = (event) => {
                // Only close if clicking outside the sidebar
                if (!event.target.closest('.sidebar-nav')) {
                    setOpenMenus({});
                }
            };

            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [open]);

    useEffect(() => {
        const fetchActiveBusiness = async () => {
            try {
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || '{}');

                if (!user._id) {
                    return;
                }

                const response = await axios.get(`http://localhost:5000/api/business/active/${user._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const activeBusinessData = response.data.business;
                setActiveBusiness(activeBusinessData);

                // Store only active business ID in localStorage
                localStorage.setItem('activeBusinessId', activeBusinessData._id);
            } catch (error) {
                console.error('Error fetching active business:', error);
            }
        };

        // Try to get active business ID from localStorage first
        const storedActiveBusinessId = localStorage.getItem('activeBusinessId');
        if (storedActiveBusinessId) {
            // We'll fetch the full business data from API
            // The ID is just for quick reference
            fetchActiveBusiness();
        } else {
            fetchActiveBusiness();
        }

        // Listen for active business changes
        const handleActiveBusinessChange = () => {
            // Fetch fresh data when active business changes
            fetchActiveBusiness();
        };

        window.addEventListener('activeBusinessChanged', handleActiveBusinessChange);

        return () => {
            window.removeEventListener('activeBusinessChanged', handleActiveBusinessChange);
        };
    }, []);

    return (
        <nav
            className="sidebar-nav"
            style={{
                width: sidebarWidth,
                minWidth: sidebarWidth,
            }}
        >
            <div className="sidebar-header">
                <div className="sidebar-logo-container">
                    {activeBusiness && activeBusiness.logo_url ? (
                        <img
                            src={`http://localhost:5000${activeBusiness.logo_url}`}
                            alt={activeBusiness.business_name}
                            className="sidebar-business-logo"
                            style={{
                                width: open ? 80 : 70,
                                height: open ? 80 : 70,
                                borderRadius: '8px',
                                objectFit: 'cover',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    ) : (
                        <div
                            className="sidebar-logo-placeholder"
                            style={{
                                width: open ? 50 : 40,
                                height: open ? 50 : 40,
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <FaBuilding size={open ? 24 : 20} color="#fff" />
                        </div>
                    )}
                </div>
                {open && (
                    <div className="sidebar-brand-section">
                        <span className="sidebar-brand">
                            {activeBusiness ? activeBusiness.business_name : 'Brand'}
                        </span>
                        {activeBusiness && (
                            <span className="sidebar-business-subtitle">Active Business</span>
                        )}
                    </div>
                )}
            </div>
            <div className="sidebar-content">
                {navItems.map((item) => (
                    <div key={item.label}>
                        {item.children ? (
                            <>
                                <div
                                    className={`sidebar-dropdown-toggle ${hasActiveChild(item.children) ? 'active' : ''}`}
                                    onClick={() => handleToggle(item.label)}
                                    title={!open ? item.label : undefined}
                                >
                                    <div className="sidebar-dropdown-content">
                                        <span className="sidebar-item-icon">{item.icon}</span>
                                        {open && <span className="sidebar-item-label">{item.label}</span>}
                                    </div>
                                    {open && (
                                        <span className="sidebar-dropdown-chevron">
                                            {openMenus[item.label] ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                                        </span>
                                    )}
                                    {!open && openMenus[item.label] && (
                                        <span className="sidebar-dropdown-chevron" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                                            <FaChevronDown size={8} />
                                        </span>
                                    )}
                                </div>
                                {openMenus[item.label] && (
                                    <div className={`sidebar-dropdown-children ${!open ? 'collapsed' : ''}`} >
                                        {item.children.map((sub) => (
                                            <Link
                                                key={sub.label}
                                                to={sub.link}
                                                className={`sidebar-dropdown-child ${isActiveLink(sub.link) ? 'active' : ''}`}
                                                title={!open ? sub.label : undefined}
                                            >
                                                <span className="sidebar-dropdown-child-icon">{sub.icon}</span>
                                                {open && <span>{sub.label}</span>}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link
                                to={item.link}
                                className={`sidebar-item ${isActiveLink(item.link) ? 'active' : ''}`}
                                title={!open ? item.label : undefined}
                            >
                                <span className="sidebar-item-icon">{item.icon}</span>
                                {open && <span className="sidebar-item-label">{item.label}</span>}
                            </Link>
                        )}
                    </div>
                ))}
            </div>
            {/* Footer for creator name */}
            {/* <div className="sidebar-footer">
                {open ? 'Made by Kuldeep Humbal' : <FaGem />}
            </div> */}
        </nav>
    );
}
