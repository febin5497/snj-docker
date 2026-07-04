import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import "../../styles/ChangePasswordFirstLogin.css";
const ChangePasswordFirstLogin = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        old_password: "Erp@123",
        new_password: "",
        confirm_password: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        digit: false
    });
    useEffect(() => {
        // Check if user is required to change password
        const passwordChangeRequired = localStorage.getItem("passwordChangeRequired");
        const token = localStorage.getItem("token");
        if (!passwordChangeRequired || !token) {
            navigate("/login");
        }
    }, [navigate]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value
        });
        // Update password strength indicators
        if (name === "new_password") {
            setPasswordStrength({
                length: value.length >= 8,
                uppercase: /[A-Z]/.test(value),
                digit: /[0-9]/.test(value)
            });
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        // Validate form
        if (!form.new_password) {
            setError("New password is required");
            return;
        }
        if (form.new_password !== form.confirm_password) {
            setError("Passwords do not match");
            return;
        }
        if (form.new_password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }
        if (!/[A-Z]/.test(form.new_password)) {
            setError("Password must contain at least one uppercase letter");
            return;
        }
        if (!/[0-9]/.test(form.new_password)) {
            setError("Password must contain at least one digit");
            return;
        }
        setLoading(true);
        try {
            await api.post("/api/auth/change-password", {
                old_password: form.old_password,
                new_password: form.new_password
            });
            setSuccess("Password changed successfully! Redirecting...");
            // Clear the password change requirement flag
            localStorage.removeItem("passwordChangeRequired");
            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
                const role = localStorage.getItem("role");
                if (role === "worker") {
                    navigate("/worker-dashboard");
                } else {
                    navigate("/dashboard");
                }
            }, 1500);
        } catch (err) {
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError("Failed to change password. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="password-change-wrapper theme-blue-white">
            <div className="password-change-box">
                <h2 style={{ color: '#0052CC' }}>Change Your Password</h2>
                <p className="subtitle">
                    This is your first login. Please change your temporary password to continue.
                </p>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Current Password (Default)</label>
                        <input
                            type="password"
                            name="old_password"
                            value={form.old_password}
                            onChange={handleChange}
                            disabled
                            title="Default password - cannot be changed"
                        />
                        <small>This is your temporary password</small>
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            name="new_password"
                            placeholder="Enter new password"
                            value={form.new_password}
                            onChange={handleChange}
                            required
                        />
                        <div className="password-requirements">
                            <div className={`requirement ${passwordStrength.length ? "met" : ""}`}>
                                <span>✓</span> At least 8 characters
                            </div>
                            <div className={`requirement ${passwordStrength.uppercase ? "met" : ""}`}>
                                <span>✓</span> At least one uppercase letter
                            </div>
                            <div className={`requirement ${passwordStrength.digit ? "met" : ""}`}>
                                <span>✓</span> At least one digit (0-9)
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirm_password"
                            placeholder="Confirm your password"
                            value={form.confirm_password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn-blue-white">
                        {loading ? "Changing password..." : "Change Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default ChangePasswordFirstLogin;
