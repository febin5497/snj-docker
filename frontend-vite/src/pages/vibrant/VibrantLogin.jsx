import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { getActiveFestival } from "../../utils/festival";
import "../../styles/vibrant-theme.css";
import "../../styles/vibrant-login.css";

const getBaseURL = () => "";

const VibrantLogin = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/api/auth/login", form);
      const payload = res.data.data || res.data;
      const token = payload.access_token;
      const user = payload.user;
      if (!token || !user) {
        setError("Login succeeded but token missing");
        return;
      }
      const role = user.role;
      const passwordChangeRequired = user.password_change_required;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", role);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("username", user.username || form.username);
      if (passwordChangeRequired) {
        localStorage.setItem("passwordChangeRequired", "true");
        navigate("/change-password-first-login");
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error || err.response.data.message || "Login failed");
      } else {
        setError("Server not reachable");
      }
    }
  };

  return (
    <div className="v-login">
      <div className="v-login-card">
        <div className="v-login-logo">
          <img src={`${getBaseURL()}/static/logo.jpg`} alt="Logo" />
          <h1 className="v-login-title">Construction ERP</h1>
          <p className="v-login-subtitle">Microservices Platform</p>
        </div>

        {(() => {
          const f = getActiveFestival();
          return f ? (
            <div className="v-login-festival">
              {f.emoji} {f.message} {f.emoji}
            </div>
          ) : null;
        })()}

        {error && <div className="v-login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="v-login-form">
          <div className="v-login-field">
            <label>Staff ID</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your staff ID"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="v-login-field">
            <label>Password</label>
            <div className="v-login-pw-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="v-login-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? "👁" : "👁‍🗨"}
              </button>
            </div>
          </div>

          <button type="submit" className="v-login-btn">
            Sign In
          </button>
        </form>

        <div className="v-login-footer">
          Powered by Docker Microservices
        </div>
      </div>
    </div>
  );
};

export default VibrantLogin;
