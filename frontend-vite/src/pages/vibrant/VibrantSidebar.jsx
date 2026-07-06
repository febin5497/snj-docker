import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/vibrant-theme.css";
import "../../styles/vibrant-sidebar.css";
import "../../styles/vibrant-layout.css";

const getBaseURL = () => "";

const menuItems = [
  { section: "MAIN" },
  { path: "/dashboard", icon: "📊", label: "Dashboard" },
  { path: "/projects", icon: "🏗️", label: "Projects" },
  { path: "/staff", icon: "👥", label: "Staff" },
  { path: "/attendance/unified", icon: "📋", label: "Attendance" },
  { path: "/attendance/approvals", icon: "✅", label: "Approvals" },
  { section: "FINANCE" },
  { path: "/finance", icon: "💰", label: "Finance" },
  { path: "/budgets", icon: "📈", label: "Budgets" },
  { path: "/payroll", icon: "💳", label: "Payroll" },
  { path: "/invoices", icon: "🧾", label: "Invoices" },
  { section: "OPERATIONS" },
  { path: "/vehicles", icon: "🚛", label: "Vehicles" },
  { path: "/materials", icon: "📦", label: "Materials" },
  { path: "/store", icon: "🏬", label: "Store" },
  { path: "/suppliers", icon: "🤝", label: "Suppliers" },
  { path: "/purchases", icon: "🛒", label: "Purchases" },
  { path: "/sales", icon: "💹", label: "Sales" },
  { section: "REPORTS" },
  { path: "/reports", icon: "📑", label: "Reports" },
  { path: "/documents", icon: "📄", label: "Documents" },
  { path: "/plan-viewer", icon: "🎲", label: "3D Viewer" },
];

const VibrantSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="v-sidebar">
      <img
        src={`${getBaseURL()}/static/logo.jpg`}
        alt="Logo"
        className="v-sidebar-logo"
      />

      <nav className="v-sidebar-nav">
        {menuItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className="v-sidebar-section">
                {item.section}
              </div>
            );
          }
          return (
            <button
              key={item.path}
              className={`v-sidebar-item ${location.pathname === item.path || location.pathname.startsWith(item.path + "/") ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="v-sidebar-user">
        <div className="v-sidebar-avatar">
          {(user.username || "A").charAt(0).toUpperCase()}
        </div>
        <div className="v-sidebar-user-info">
          <div className="v-sidebar-user-name">{user.username || "Admin"}</div>
          <div className="v-sidebar-user-role">{user.role || "User"}</div>
        </div>
        <button className="v-sidebar-logout" onClick={handleLogout} title="Logout">
          🚪
        </button>
      </div>
    </div>
  );
};

export default VibrantSidebar;
