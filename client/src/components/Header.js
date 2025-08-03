import React, { useState, useRef, useEffect } from 'react';
import { FaBars, FaBell, FaSignOutAlt, FaUserEdit, FaBuilding } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Header({ onToggleSidebar }) {
    // Dropdown state for profile and notifications
    const [openDropdown, setOpenDropdown] = useState(null); // 'profile', 'notif', or null
    const [user, setUser] = useState(null);
    const profileRef = useRef();
    const notifRef = useRef();
    const navigate = useNavigate();

    // Get user data from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // Function to get user initials
    const getUserInitials = () => {
        if (!user) return 'U';
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
    };
    // Close dropdowns on outside click
    React.useEffect(() => {
        function handleClick(e) {
            if (profileRef.current && !profileRef.current.contains(e.target) && openDropdown === 'profile') setOpenDropdown(null);
            if (notifRef.current && !notifRef.current.contains(e.target) && openDropdown === 'notif') setOpenDropdown(null);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [openDropdown]);

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
                    <button className="dropdown-toggle btn d-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false"
                    >
                        <div className="user-initials-avatar">
                            {getUserInitials()}
                        </div>
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
