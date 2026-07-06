import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/vibrant-theme.css";
import "../../styles/vibrant-sidebar.css";
import "../../styles/vibrant-layout.css";

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
  const [pinned, setPinned] = useState(() => localStorage.getItem("sidebar_pinned") === "true");
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar_pinned", pinned);
  }, [pinned]);

  const isExpanded = pinned || hovered;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <div
        className={`v-sidebar ${isExpanded ? "v-sidebar-expanded" : ""}`}
        onMouseEnter={() => !pinned && setHovered(true)}
        onMouseLeave={() => !pinned && setHovered(false)}
      >
        {/* Logo */}
        <div className="v-sidebar-logo-wrap">
          <img
            src="/static/logo.jpg"
            alt="Logo"
            className="v-sidebar-logo"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div className="v-sidebar-logo-fallback" style={{ display: 'none' }}>S</div>
          {isExpanded && <span className="v-sidebar-logo-text">SNJ ERP</span>}
        </div>

        {/* Toggle pin button */}
        <button
          className="v-sidebar-toggle"
          onClick={() => setPinned(!pinned)}
          title={pinned ? "Collapse sidebar" : "Pin sidebar open"}
        >
          {pinned ? "◀" : "▶"}
        </button>

        {/* Nav items */}
        <nav className="v-sidebar-nav">
          {menuItems.map((item, i) => {
            if (item.section) {
              return (
                <div key={i} className={`v-sidebar-section ${isExpanded ? "v-section-visible" : ""}`}>
                  {item.section}
                </div>
              );
            }
            return (
              <button
                key={item.path}
                className={`v-sidebar-item ${location.pathname === item.path || location.pathname.startsWith(item.path + "/") ? "active" : ""}`}
                onClick={() => navigate(item.path)}
                title={!isExpanded ? item.label : undefined}
              >
                <span className="v-sidebar-icon">{item.icon}</span>
                {isExpanded && <span className="v-sidebar-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="v-sidebar-user">
          <div className="v-sidebar-avatar">
            {(user.username || "A").charAt(0).toUpperCase()}
          </div>
          {isExpanded && (
            <div className="v-sidebar-user-info">
              <div className="v-sidebar-user-name">{user.username || "Admin"}</div>
              <div className="v-sidebar-user-role">{user.role || "User"}</div>
            </div>
          )}
          {isExpanded && (
            <button className="v-sidebar-logout" onClick={handleLogout} title="Logout">
              🚪
            </button>
          )}
        </div>
      </div>

      {/* Backdrop for mobile when expanded */}
      {isExpanded && (
        <div className="v-sidebar-backdrop" onClick={() => { setHovered(false); setPinned(false); }} />
      )}
    </>
  );
};

export default VibrantSidebar;
