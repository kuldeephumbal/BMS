import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaUserShield } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../components/BaseURL';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            const response = await axios.post(`${BASE_URL}/admin/login`, { email, password });
            if (response.status === 200) {
                localStorage.setItem('token', response.data.token);
                navigate('/admin-dashboard');
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }
    };

    return (
        <div className="login-root">
            <ToastContainer />
            <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
                <div className="login-logo">
                    <FaUserShield size={44} />
                </div>
                <h2 className="login-title">Admin Login</h2>
                <div className="login-field-group form-group">
                    <input
                        id="email"
                        type="email"
                        className="login-input"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <label htmlFor="email" className="login-label">Email</label>
                </div>
                <div className="login-field-group form-group">
                    <div className="login-password-wrapper form-group">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            className="login-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <label htmlFor="password" className="login-label">Password</label>
                        <button
                            type="button"
                            className="login-eye-btn"
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                </div>
                <button
                    className="login-submit-btn"
                    type="submit">
                    Login
                </button>
            </form>
        </div>
    );
}
