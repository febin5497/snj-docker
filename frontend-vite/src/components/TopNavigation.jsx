import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaProjectDiagram, FaUsers, FaTruck, FaCubes, FaMoneyBillWave, FaFileAlt, FaFileInvoiceDollar, FaMap, FaCamera, FaClock, FaChartBar, FaChevronDown, FaBook, FaCheckCircle, FaQrcode, FaBoxOpen, FaExchangeAlt, FaCog, FaShieldAlt, FaClipboardList, FaHistory, FaFileExcel, FaPlus, FaDownload, FaUserShield, FaBox, FaReceipt, FaBell, FaSignOutAlt, FaUser, FaTools } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import NotificationPanel from "./NotificationPanel";
import { getActiveFestival } from "../utils/festival";
import api from "../api/api";
import "../styles/TopNavigation.css";

export default function TopNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState({ username: "User", initial: "U" });
  const { readingMode, setReadingMode } = useTheme();
  const hoverTimeoutRef = useRef(null);
  const isFinancePage = location.pathname.startsWith('/finance');
  const isAdminDashboard = location.pathname === '/admin/dashboard';
  const isDashboard = location.pathname === '/dashboard';

  useEffect(() => {
    const username = localStorage.getItem("username") || localStorage.getItem("userId") || "User";
    const initial = typeof username === 'string' ? username.charAt(0).toUpperCase() : "U";
    setCurrentUser({ username: username || "User", initial: initial });
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("company");
    navigate("/login");
  };

  const menuSections = [
    {
      title: "Projects",
      icon: <FaProjectDiagram />,
      items: [
        { name: "Projects", path: "/projects", icon: <FaProjectDiagram /> },
        { name: "Assignment Manager", path: "/projects/assignment-manager", icon: <FaUsers /> },
        { name: "Project Planner", path: "/planner", icon: <FaClock /> },
        { name: "Project Progress", path: "/progress", icon: <FaChartBar /> },
        { name: "Project Cost", path: "/project-cost", icon: <FaMoneyBillWave /> },
      ]
    },
    {
      title: "Human Resources",
      icon: <FaUsers />,
      items: [
        { name: "Staff", path: "/staff", icon: <FaUsers /> },
        { name: "Payroll", path: "/payroll", icon: <FaFileInvoiceDollar /> },
        { name: "Staff Expenses", path: "/staff/expenses", icon: <FaMoneyBillWave /> },
        { name: "Attendance (Staff)", path: "/attendance/unified", icon: <FaQrcode /> },
        { name: "Attendance Report", path: "/attendance/report", icon: <FaFileExcel /> },
        { name: "Approvals", path: "/attendance/approvals", icon: <FaCheckCircle /> },
      ]
    },
    {
      title: "Operations",
      icon: <FaTruck />,
      items: [
        { name: "Vehicles", path: "/vehicles", icon: <FaTruck /> },
        { name: "Vehicle Allocation", path: "/vehicles/allocation", icon: <FaTruck /> },
        { name: "Equipment", path: "/equipment", icon: <FaTools /> },
        { name: "Materials", path: "/materials", icon: <FaCubes /> },
        { name: "Material Usage", path: "/material-usage", icon: <FaChartBar /> },
      ]
    },
    {
      title: "Procurement",
      icon: <FaClipboardList />,
      items: [
        { name: "Suppliers", path: "/suppliers", icon: <FaTruck /> },
        { name: "Vendors", path: "/vendors", icon: <FaTruck /> },
        { name: "Purchase Indents", path: "/indents", icon: <FaClipboardList /> },
        { name: "Purchases", path: "/purchases", icon: <FaBoxOpen /> },
        { name: "Purchase Returns", path: "/purchase-returns", icon: <FaExchangeAlt /> },
        { name: "GRN", path: "/grns", icon: <FaBox /> },
        { name: "Procurement Pipeline", path: "/procurement-pipeline", icon: <FaChartBar /> },
      ]
    },
    {
      title: "Store & Inventory",
      icon: <FaBoxOpen />,
      items: [
        { name: "Store", path: "/store", icon: <FaBox /> },
      ]
    },
    {
      title: "Sales & Quotations",
      icon: <FaReceipt />,
      items: [
        { name: "Sales", path: "/sales", icon: <FaMoneyBillWave /> },
        { name: "Sales Returns", path: "/sales-returns", icon: <FaExchangeAlt /> },
        { name: "Estimates", path: "/estimates", icon: <FaReceipt /> },
        { name: "Quote Templates", path: "/quote-templates", icon: <FaFileAlt /> },
      ]
    },
    {
      title: "Finance & Documents",
      icon: <FaMoneyBillWave />,
      items: [
        { name: "Finance", path: "/finance", icon: <FaMoneyBillWave /> },
        { name: "Invoices", path: "/invoices", icon: <FaFileInvoiceDollar /> },
        { name: "Budgets", path: "/budgets", icon: <FaChartBar /> },
        { name: "Chart of Accounts", path: "/chart-of-accounts", icon: <FaBook /> },
        { name: "Pending Approvals", path: "/finance/pending-approvals", icon: <FaCheckCircle /> },
        { name: "Expense Approvals", path: "/finance/approvals", icon: <FaCheckCircle /> },
        { name: "Reports", path: "/reports", icon: <FaChartBar /> },
        { name: "Retention Tracking", path: "/retention-tracking", icon: <FaClipboardList /> },
        { name: "Documents", path: "/documents", icon: <FaFileAlt /> },
      ]
    },
    {
      title: "Location & Media",
      icon: <FaMap />,
      items: [
        { name: "Project Map", path: "/map", icon: <FaMap /> },
        { name: "Site Photos", path: "/site-photos", icon: <FaCamera /> },
        { name: "3D Plan Viewer", path: "/plan-viewer", icon: <FaProjectDiagram /> },
      ]
    },
    {
      title: "Administration",
      icon: <FaCog />,
      items: [
        { name: "Users", path: "/admin/users", icon: <FaUsers /> },
        { name: "Roles & Permissions", path: "/admin/roles", icon: <FaShieldAlt /> },
        { name: "Activity Logs", path: "/admin/activity-logs", icon: <FaHistory /> },
        { name: "Company Settings", path: "/admin/company-settings", icon: <FaCog /> },
        { name: "Dashboard", path: "/admin/dashboard", icon: <FaChartBar /> },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  const handleMouseEnter = (idx) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpenDropdown(idx);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 250);
  };

  const handleClickToggle = (idx) => {
    setOpenDropdown(openDropdown === idx ? null : idx);
  };

  return (
    <nav className="top-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <div className="nav-logo">
            <FaProjectDiagram size={24} />
          </div>
        </div>

        <div className="nav-menu">
          <Link
            to="/dashboard"
            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
            title="Dashboard"
          >
            <FaHome size={16} />
            <span className="nav-text">Dashboard</span>
          </Link>

          {menuSections.map((section, idx) => (
            <div
              key={idx}
              className="nav-dropdown"
              onMouseEnter={() => handleMouseEnter(idx)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`nav-dropdown-btn ${openDropdown === idx ? "active" : ""}`}
                onClick={() => handleClickToggle(idx)}
                title={section.title}
              >
                {section.icon}
                <span className="nav-text">{section.title}</span>
                <FaChevronDown size={12} className="chevron-icon" />
              </button>

              <div className={`dropdown-menu ${openDropdown === idx ? "open" : ""}`}>
                {section.items.map((item, i) => (
                  <Link
                    key={i}
                    to={item.path}
                    className={`dropdown-item ${isActive(item.path) ? "active" : ""}`}
                    onClick={() => setOpenDropdown(null)}
                  >
                    <span className="dropdown-icon">{item.icon}</span>
                    <span className="dropdown-text">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="nav-right">
          {isFinancePage && (
            <div className="quick-actions-group">
              <button className="nav-quick-action-btn" onClick={() => navigate('/finance/add')} title="Add Transaction">
                <FaPlus size={14} /><span className="action-text">Add</span>
              </button>
              <button className="nav-quick-action-btn" onClick={() => navigate('/finance/transactions')} title="View Transactions">
                <FaFileAlt size={14} /><span className="action-text">View</span>
              </button>
              <button className="nav-quick-action-btn" onClick={() => window.open(`${api.defaults.baseURL || ''}/api/finance/report/download`, '_blank')} title="Download Report">
                <FaDownload size={14} /><span className="action-text">Report</span>
              </button>
            </div>
          )}

          {isDashboard && (
            <div className="quick-actions-group">
              <button className="nav-quick-action-btn" onClick={() => navigate('/invoices')} title="Create Invoice">
                <FaFileInvoiceDollar size={14} /><span className="action-text">Invoice</span>
              </button>
              <button className="nav-quick-action-btn" onClick={() => navigate('/materials')} title="Add Material">
                <FaBox size={14} /><span className="action-text">Material</span>
              </button>
              <button className="nav-quick-action-btn" onClick={() => navigate('/planner')} title="Assign Task">
                <FaClipboardList size={14} /><span className="action-text">Task</span>
              </button>
              <button className="nav-quick-action-btn" onClick={() => navigate('/vehicles')} title="Log Vehicle">
                <FaTruck size={14} /><span className="action-text">Vehicle</span>
              </button>
            </div>
          )}

          {isAdminDashboard && (
            <div className="quick-actions-group">
              <button className="nav-quick-action-btn" onClick={() => navigate('/admin/users')} title="Manage Users">
                <FaUsers size={14} /><span className="action-text">Users</span>
              </button>
              <button className="nav-quick-action-btn" onClick={() => navigate('/admin/roles')} title="Manage Roles">
                <FaUserShield size={14} /><span className="action-text">Roles</span>
              </button>
              <button className="nav-quick-action-btn" onClick={() => navigate('/admin/activity-logs')} title="View Activity Logs">
                <FaHistory size={14} /><span className="action-text">Logs</span>
              </button>
              <button className="nav-quick-action-btn" onClick={() => navigate('/admin/company-settings')} title="Company Settings">
                <FaCog size={14} /><span className="action-text">Settings</span>
              </button>
            </div>
          )}

          {(() => { const f = getActiveFestival(); return f ? (
            <span className="festival-badge" style={{
              color: f.colors[0], background: `${f.colors[0]}20`
            }}>
              {f.emoji} {f.name}
            </span>
          ) : null; })()}

          <NotificationPanel />

          <div className="user-menu">
            <button
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">{currentUser.initial}</div>
              <span className="user-name">{currentUser.username}</span>
              <span className="user-chevron">&#9662;</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <a href="/profile" className="user-dropdown-item">
                  <FaUser /> Profile
                </a>
                <a href="/settings" className="user-dropdown-item">
                  <FaCog /> Settings
                </a>
                <button onClick={handleLogout} className="user-dropdown-item logout">
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>

          <button
            className="theme-toggle-btn"
            onClick={() => setReadingMode(!readingMode)}
            aria-label="Toggle reading mode"
            title={readingMode ? "Switch to light mode" : "Switch to reading mode"}
          >
            <FaBook size={18} style={{ color: readingMode ? '#d97706' : 'inherit' }} />
          </button>
        </div>
      </div>
    </nav>
  );
}
