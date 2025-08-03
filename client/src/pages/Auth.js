import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../components/BaseURL';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Auth() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Sign up form states
    const [signupData, setSignupData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            const response = await axios.post(`${BASE_URL}/user/login`, { email, password });
            if (response.status === 200) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();

        if (signupData.password !== signupData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/user/register`, {
                first_name: signupData.firstName,
                last_name: signupData.lastName,
                email: signupData.email,
                password: signupData.password,
                phone: signupData.phone
            });

            if (response.status === 201) {
                toast.success('Account created successfully! Please sign in.');
                setIsFlipped(false);
                setSignupData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

    const handleSignupInputChange = (field, value) => {
        setSignupData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="login-root">
            <ToastContainer />
            <div className={`login-flip-container ${isFlipped ? 'flipped' : ''}`}>
                <div className="login-flip-inner">
                    {/* Sign In Form */}
                    <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '17px' }}>
                            <div className="login-header-section">
                                <div>
                                    <p className="login-title mb-1">Welcome Back !</p>
                                    <p className="login-subtitle">Sign in to continue to Buzyzone.</p>
                                </div>
                            </div>
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
                            <div>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div className="form-check">
                                        <input
                                            id="rememberMe"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        />
                                        <label htmlFor="rememberMe" className="form-check-label">Remember Me</label>
                                    </div>
                                    <Link to="/forgot-password" className="login-forgot-password">Forgot Password?</Link>
                                </div>
                            </div>
                            <button
                                className="login-submit-btn"
                                type="submit">
                                Sign In
                            </button>
                            <div className="login-footer">
                                <p className="login-footer-text m-0">
                                    Don't have an account? <span className="login-footer-link" onClick={() => setIsFlipped(true)}>Sign Up</span>
                                </p>
                            </div>
                        </div>
                    </form>

                    {/* Sign Up Form */}
                    <form className="signup-form" onSubmit={handleSignupSubmit} autoComplete="off">
                        <div className="login-header-section">
                            <div>
                                <p className="signup-title">Create Account</p>
                                <p className="signup-subtitle">Sign up to get started with Buzyzone.</p>
                            </div>
                        </div>

                        <div className="signup-form-row">
                            <div className="signup-field-group form-group">
                                <input
                                    id="firstName"
                                    type="text"
                                    className="signup-input"
                                    placeholder="Enter first name"
                                    value={signupData.firstName}
                                    onChange={e => handleSignupInputChange('firstName', e.target.value)}
                                    required
                                />
                                <label htmlFor="firstName" className="signup-label">First Name</label>
                            </div>
                            <div className="signup-field-group form-group">
                                <input
                                    id="lastName"
                                    type="text"
                                    className="signup-input"
                                    placeholder="Enter last name"
                                    value={signupData.lastName}
                                    onChange={e => handleSignupInputChange('lastName', e.target.value)}
                                    required
                                />
                                <label htmlFor="lastName" className="signup-label">Last Name</label>
                            </div>
                        </div>

                        <div className="signup-field-group form-group">
                            <input
                                id="signupEmail"
                                type="email"
                                className="signup-input"
                                placeholder="Enter your email"
                                value={signupData.email}
                                onChange={e => handleSignupInputChange('email', e.target.value)}
                                required
                            />
                            <label htmlFor="signupEmail" className="signup-label">Email</label>
                        </div>

                        <div className="signup-field-group form-group">
                            <input
                                id="signupPhone"
                                type="tel"
                                className="signup-input"
                                placeholder="Enter your phone number"
                                value={signupData.phone}
                                onChange={e => handleSignupInputChange('phone', e.target.value)}
                                required
                            />
                            <label htmlFor="signupPhone" className="signup-label">Phone Number</label>
                        </div>

                        <div className="signup-field-group form-group">
                            <div className="login-password-wrapper form-group">
                                <input
                                    id="signupPassword"
                                    type={showSignupPassword ? 'text' : 'password'}
                                    className="signup-input"
                                    placeholder="Enter password"
                                    value={signupData.password}
                                    onChange={e => handleSignupInputChange('password', e.target.value)}
                                    required
                                />
                                <label htmlFor="signupPassword" className="signup-label">Password</label>
                                <button
                                    type="button"
                                    className="login-eye-btn"
                                    onClick={() => setShowSignupPassword((v) => !v)}
                                    tabIndex={-1}
                                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showSignupPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="signup-field-group form-group">
                            <div className="login-password-wrapper form-group">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="signup-input"
                                    placeholder="Confirm password"
                                    value={signupData.confirmPassword}
                                    onChange={e => handleSignupInputChange('confirmPassword', e.target.value)}
                                    required
                                />
                                <label htmlFor="confirmPassword" className="signup-label">Confirm Password</label>
                                <button
                                    type="button"
                                    className="login-eye-btn"
                                    onClick={() => setShowConfirmPassword((v) => !v)}
                                    tabIndex={-1}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            className="signup-submit-btn"
                            type="submit">
                            Sign Up
                        </button>
                        <div className="login-footer">
                            <p className="login-footer-text m-0">
                                Already have an account? <span className="login-footer-link" onClick={() => setIsFlipped(false)}>Sign In</span>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
