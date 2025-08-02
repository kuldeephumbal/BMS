import React, { useState } from 'react';
import { FaTachometerAlt, FaGem, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const navItems = [
    { label: 'Dashboard', icon: <FaTachometerAlt />, link: '/admin-dashboard' },
];

export default function AdminSidebar({ open }) {
    const [openMenus, setOpenMenus] = useState({});

    const handleToggle = (label) => {
        setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const sidebarWidth = open ? 280 : 80;

    return (
        <nav
            className="sidebar-nav"
            style={{
                width: sidebarWidth,
                minWidth: sidebarWidth,
            }}
        >
            <div className="sidebar-header">
                <FaGem size={32} color="#fff" style={{ marginRight: open ? 12 : 0, transition: 'margin 0.3s' }} />
                {open && <span className="sidebar-brand">Brand</span>}
            </div>
            <div
                className="sidebar-content"
            >
                {navItems.map((item) => (
                    <div key={item.label}>
                        {item.children ? (
                            <>
                                <div
                                    className="sidebar-dropdown-toggle"
                                    onClick={() => handleToggle(item.label)}
                                    style={{ justifyContent: open ? 'space-between' : 'center' }}
                                    title={!open ? item.label : undefined}
                                >
                                    <span className="d-flex align-items-center">
                                        <span className="sidebar-item-icon">{item.icon}</span>
                                        {open && <span className="sidebar-item-label">{item.label}</span>}
                                    </span>
                                    <span className="sidebar-dropdown-chevron">
                                        {openMenus[item.label] ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                                    </span>
                                </div>
                                {openMenus[item.label] && (
                                    <div className="sidebar-dropdown-children">
                                        {item.children.map((sub) => (
                                            <Link
                                                key={sub.label}
                                                to={sub.link}
                                                className="sidebar-dropdown-child"
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
                                className="sidebar-item"
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
