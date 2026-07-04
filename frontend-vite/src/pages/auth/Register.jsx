import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { useToast } from "../../components/Toast";
import "../../styles/Register.css";
const Register = () => {
    const [form, setForm] = useState({
        company_name: "",
        admin_email: "",
        admin_name: "",
        password: "",
        confirm_password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(0);
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    // Password strength validator
    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[!@#$%^&*]/.test(password)) strength++;
        return strength;
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value
        });
        // Update password strength
        if (name === "password") {
            setPasswordStrength(calculatePasswordStrength(value));
        }
        setError("");
    };
    const validateForm = () => {
        // Company name validation
        if (!form.company_name.trim()) {
            setError("Company name is required");
            return false;
        }
        if (form.company_name.trim().length < 3) {
            setError("Company name must be at least 3 characters");
            return false;
        }
        // Admin name validation
        if (!form.admin_name.trim()) {
            setError("Admin name is required");
            return false;
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
        if (!emailRegex.test(form.admin_email)) {
            setError("Please enter a valid email address");
            return false;
        }
        // Password validation
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters");
            return false;
        }
        if (!/[A-Z]/.test(form.password)) {
            setError("Password must contain at least one uppercase letter");
            return false;
        }
        if (!/[0-9]/.test(form.password)) {
            setError("Password must contain at least one number");
            return false;
        }
        // Password match validation
        if (form.password !== form.confirm_password) {
            setError("Passwords do not match");
            return false;
        }
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        // Validate before sending
        if (!validateForm()) {
            return;
        }
        setLoading(true);
        try {
            const response = await api.post("/register-company", {
                company_name: form.company_name.trim(),
                admin_name: form.admin_name.trim(),
                admin_email: form.admin_email.trim(),
                password: form.password,
                confirm_password: form.confirm_password
            });
            if (response.data.success) {
                showSuccess("Company registered successfully! Redirecting to login...");
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setError(response.data.error || "Registration failed");
                showError(response.data.error || "Registration failed");
            }
        } catch (err) {
            let errorMessage = "Registration failed";
            if (err.response && err.response.data) {
                errorMessage = err.response.data.error || err.response.data.message || errorMessage;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    const getPasswordStrengthColor = () => {
        if (passwordStrength === 0) return "var(--color-danger)";
        if (passwordStrength <= 2) return "var(--color-warning)";
        return "var(--color-success)";
    };
    const getPasswordStrengthText = () => {
        if (passwordStrength === 0) return "Weak";
        if (passwordStrength <= 2) return "Medium";
        return "Strong";
    };
    return (
        <div className="register-wrapper theme-blue-white">
            <div className="register-box">
                <div className="register-header">
                    <h1 style={{ color: '#0052CC' }}>Construction ERP</h1>
                    <p className="register-subtitle">Create Your Company Account</p>
                </div>
                {error && (
                    <div className="register-error">{error}</div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Company Name</label>
                        <input
                            type="text"
                            name="company_name"
                            placeholder="Enter your company name"
                            value={form.company_name}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Admin Name</label>
                        <input
                            type="text"
                            name="admin_name"
                            placeholder="Your full name"
                            value={form.admin_name}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="admin_email"
                            placeholder="your@email.com"
                            value={form.admin_email}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Create a strong password"
                            value={form.password}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        {form.password && (
                            <div className="password-strength">
                                <div className="strength-bar">
                                    <div
                                        className="strength-fill"
                                        style={{
                                            width: `${(passwordStrength / 5) * 100}%`,
                                            backgroundColor: getPasswordStrengthColor()
                                        }}
                                    ></div>
                                </div>
                                <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                                    Password strength: {getPasswordStrengthText()}
                                </span>
                            </div>
                        )}
                        <p className="password-hint">
                            Must be at least 8 characters with uppercase, number, and special character
                        </p>
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirm_password"
                            placeholder="Confirm your password"
                            value={form.confirm_password}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="register-btn btn-blue-white"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Company Account"}
                    </button>
                </form>
                <div className="register-footer">
                    <p>
                        Already have an account? <Link to="/login" className="login-link link-blue-white">Sign in here</Link>
                    </p>
                </div>
                <p className="register-footer-text">
                    Construction Manager • v1.0
                </p>
            </div>
        </div>
    );
};
export default Register;
