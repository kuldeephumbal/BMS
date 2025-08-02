import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger' // 'danger', 'warning', 'info'
}) {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    iconColor: '#dc2626',
                    iconBg: 'rgba(220, 38, 38, 0.1)',
                    confirmBg: '#dc2626',
                    confirmHover: '#b91c1c'
                };
            case 'warning':
                return {
                    iconColor: '#d97706',
                    iconBg: 'rgba(217, 119, 6, 0.1)',
                    confirmBg: '#d97706',
                    confirmHover: '#b45309'
                };
            case 'info':
                return {
                    iconColor: '#2563eb',
                    iconBg: 'rgba(37, 99, 235, 0.1)',
                    confirmBg: '#2563eb',
                    confirmHover: '#1d4ed8'
                };
            default:
                return {
                    iconColor: '#dc2626',
                    iconBg: 'rgba(220, 38, 38, 0.1)',
                    confirmBg: '#dc2626',
                    confirmHover: '#b91c1c'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="confirm-modal-backdrop" onClick={onClose}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-modal-header">
                   <div className='d-flex align-items-center justify-content-center gap-2'>
                   <div className="confirm-modal-icon" style={{ backgroundColor: styles.iconBg }}>
                        <FaExclamationTriangle color={styles.iconColor} size={20} />
                    </div>
                    <h3 className="confirm-modal-title m-0">{title}</h3>
                   </div>
                    <button className="confirm-modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="confirm-modal-body">
                    <p className="confirm-modal-message">{message}</p>
                </div>

                <div className="confirm-modal-actions">
                    <button
                        className="confirm-modal-cancel"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="confirm-modal-confirm"
                        onClick={onConfirm}
                        style={{
                            backgroundColor: styles.confirmBg,
                            '--hover-color': styles.confirmHover
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
} 