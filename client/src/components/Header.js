import React, { useState, useRef } from 'react';
import { FaBars, FaBell, FaSignOutAlt, FaUserCircle, FaUserEdit, FaBuilding } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Header({ onToggleSidebar }) {
    // Dropdown state for profile and notifications
    const [openDropdown, setOpenDropdown] = useState(null); // 'profile', 'notif', or null
    const profileRef = useRef();
    const notifRef = useRef();
    const navigate = useNavigate();
    // Close dropdowns on outside click
    React.useEffect(() => {
        function handleClick(e) {
            if (profileRef.current && !profileRef.current.contains(e.target) && openDropdown === 'profile') setOpenDropdown(null);
            if (notifRef.current && !notifRef.current.contains(e.target) && openDropdown === 'notif') setOpenDropdown(null);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [openDropdown]);

    // Dropdown menu style (Material UI inspired)
    const dropdownMenuStyle = {
        minWidth: 200,
        borderRadius: 14,
        zIndex: 1200,
        position: 'absolute',
        background: '#fff',
        boxShadow: '0 4px 24px rgba(44,62,80,0.13)',
        padding: '8px 0',
        border: 'none',
        overflow: 'visible',
    };

    // Helper to get dropdown position
    const getDropdownPosition = (ref, width = 200) => {
        if (!ref.current) return { top: 70, left: 0 };
        const rect = ref.current.getBoundingClientRect();
        return {
            top: rect.bottom + window.scrollY + 4,
            left: rect.right - width + window.scrollX,
        };
    };

    return (
        <header className="header">
            <div className="d-flex align-items-center" style={{ gap: 16 }}>
                <button
                    className="header-btn btn btn-link text-dark d-flex align-items-center"
                    onClick={onToggleSidebar}
                >
                    <FaBars />
                </button>
            </div>
            <div className="header-title-section">
                <div className="header-title-content">
                    <span className="header-title">
                        <p className='m-0'>Business Management System</p>
                    </span>
                </div>
            </div>
            <div className="header-actions">
                {/* Notifications Dropdown */}
                <div>
                    <button className="dropdown-toggle btn text-dark d-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false"
                    >
                        <FaBell style={{ fontSize: 22 }} />
                    </button>
                    <ul className="dropdown-menu">
                        <li><span className="dropdown-item">No notifications</span></li>
                    </ul>
                </div>
                {/* Profile Dropdown */}
                <div>
                    <button className="dropdown-toggle btn btn-link text-dark d-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false"
                    >
                        <FaUserCircle style={{ fontSize: 22 }} />
                    </button>
                    <ul className="dropdown-menu">
                        <li><button className="dropdown-item" onClick={() => {
                            setOpenDropdown(null);
                            navigate('/profile');
                        }}><FaUserEdit /> Profile</button></li>
                        <li><button className="dropdown-item" onClick={() => {
                            setOpenDropdown(null);
                            navigate('/business');
                        }}><FaBuilding /> Business</button></li>
                        <li><button className="dropdown-item" onClick={() => {
                            localStorage.removeItem('token');
                            setOpenDropdown(null);
                            navigate('/', { replace: true });
                        }}><FaSignOutAlt /> Logout</button></li>
                    </ul>
                </div>
            </div>
        </header>
    );
}
