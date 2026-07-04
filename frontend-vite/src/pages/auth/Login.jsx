import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { getActiveFestival } from "../../utils/festival";
import "../../styles/Login.css";
// Get dynamic base URL for backend
const getBaseURL = () => {
    return "";
};
const Login = () => {
    const [form, setForm] = useState({
        username: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    // Disable scrolling for login page
    useEffect(() => {
        document.documentElement.classList.add("login-page-active");
        document.body.classList.add("login-page-active");
        document.getElementById("root")?.classList.add("login-page-active");
        return () => {
            document.documentElement.classList.remove("login-page-active");
            document.body.classList.remove("login-page-active");
            document.getElementById("root")?.classList.remove("login-page-active");
        };
    }, []);
    const navigate = useNavigate();
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await api.post(
                "/api/auth/login",
                form
            );
            const token = res.data.access_token;
            const role = res.data.user.role;
            const passwordChangeRequired = res.data.user.password_change_required;
            if (!token) {
                setError("Login succeeded but token missing");
                return;
            }
            // Save auth info
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            localStorage.setItem("role", role);
            localStorage.setItem("userId", res.data.user.id);
            localStorage.setItem("username", res.data.user.username || form.username);
            // If password change required, redirect to password change page
            if (passwordChangeRequired) {
                localStorage.setItem("passwordChangeRequired", "true");
                navigate("/change-password-first-login");
                return;
            }
            // Redirect to dashboard for all roles
            navigate("/dashboard");
        }
        catch (err) {
            if (err.response) {
                setError(err.response.data.error || "Login failed");
            } else {
                setError("Server not reachable");
            }
        }
    };
    return (
        <div className="login-page theme-blue-white">
            {/* Left Side - Logo & Branding */}
            <div className="login-left">
                <div className="login-brand">
                    <div className="login-logo">
                        <img
                            src={`${getBaseURL()}/static/logo.jpg`}
                            alt="Company Logo"
                        />
                    </div>
                    <h1 className="login-title" style={{ color: '#0052CC' }}>Construction Management</h1>
                    <p className="login-subtitle">Project Management System</p>
                </div>
            </div>
            {/* Right Side - Form */}
            <div className="login-right">
                <div className="login-form-wrapper">
                    {/* Festival Banner */}
                    {(() => { const f = getActiveFestival(); return f ? (
                        <div style={{
                            textAlign: 'center', padding: '8px 16px', marginBottom: '16px',
                            background: `linear-gradient(135deg, ${f.colors[0]}15, ${f.colors[1]}15)`,
                            borderRadius: '12px', border: `1px solid ${f.colors[0]}30`,
                            fontSize: '14px', fontWeight: 600, color: f.colors[0]
                        }}>
                            {f.emoji} {f.message} {f.emoji}
                        </div>
                    ) : null; })()}
                    {/* Error Message */}
                    {error && (
                        <div className="login-error">{error}</div>
                    )}
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                        {/* Username Field */}
                        <div className="form-group">
                            <label htmlFor="username" className="lp-label">
                                Username
                            </label>
                            <div className="input-wrapper">
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    className="lp-input"
                                    value={form.username}
                                    onChange={handleChange}
                                    placeholder="Enter your username"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                        {/* Password Field */}
                        <div className="form-group">
                            <label htmlFor="password" className="lp-label">
                                Password
                            </label>
                            <div className="input-password-wrap">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="lp-input"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                >
                                    {showPassword ? "👁" : "🚫"}
                                </button>
                            </div>
                        </div>
                        {/* Login Button */}
                        <button type="submit" className="btn-login btn-blue-white">
                            Sign In
                        </button>
                    </form>
                    {/* Footer */}
                    <div className="login-footer">
                        <p className="login-footer-text">Secure construction management system</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Login;