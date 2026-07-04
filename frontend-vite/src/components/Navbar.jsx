import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { FaSignOutAlt, FaUser, FaCog } from "react-icons/fa";
import { useState, useEffect } from "react";
import NotificationPanel from "./NotificationPanel";
import { getActiveFestival } from "../utils/festival";
import "../styles/Navbar.css";

function Navbar() {

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [currentUser, setCurrentUser] = useState({ username: "User", initial: "U" });

    // Load current user from localStorage on component mount
    useEffect(() => {
        const username = localStorage.getItem("username") || localStorage.getItem("userId") || "User";
        const initial = typeof username === 'string' ? username.charAt(0).toUpperCase() : "U";
        setCurrentUser({ username: username || "User", initial: initial });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("company");
        navigate("/login");
    };

    // Get page title from route
    const getPageTitle = () => {
      const path = location.pathname;
      const titles = {
        // Main
        '/dashboard': 'Dashboard',

        // Projects
        '/projects': 'Projects',
        '/projects/assignment-manager': 'Project Assignment Manager',
        '/planner': 'Project Planner',
        '/progress': 'Project Progress',
        '/project-cost': 'Project Cost Analysis',

        // Human Resources
        '/staff': 'Staff Management',
        '/staff/expenses': 'Staff Expenses',
        '/attendance/unified': 'Attendance - Punch In/Out',
        '/attendance/report': 'Attendance - Management Report',
        '/attendance/approvals': 'Attendance - Approvals',

        // Operations
        '/vehicles': 'Vehicles',
        '/vehicles/allocation': 'Vehicle Allocation',
        '/materials': 'Materials',
        '/material-usage': 'Material Usage',
        '/equipment': 'Equipment Management',

        // Store & Inventory
        '/store': 'Store & Materials',
        '/suppliers': 'Suppliers',
        '/purchases': 'Purchases',
        '/purchase-returns': 'Purchase Returns',

        // Sales & Quotations
        '/sales': 'Sales',
        '/sales-returns': 'Sales Returns',
        '/quotes': 'Quotations',
        '/quote-templates': 'Quote Templates',
        '/estimates': 'Estimates',

        // Finance & Documents
        '/finance': 'Finance',
        '/finance/pending-approvals': 'Pending Approvals',
        '/finance/approvals': 'Expense Approvals',
        '/budgets': 'Budget Management',
        '/indents': 'Purchase Indents',
        '/grns': 'Goods Receipt Notes',
        '/procurement-pipeline': 'Procurement Pipeline',
        '/chart-of-accounts': 'Chart of Accounts',
        '/documents': 'Documents',
        '/invoices': 'Invoices',

        // Reports
        '/reports': 'Financial Reports',
        '/reports/profitability': 'Project Profitability',
        '/reports/budget-variance': 'Budget vs Actual',
        '/reports/cash-flow': 'Cash Flow',
        '/reports/receivables-aging': 'Receivables Aging',
        '/stage-billing': 'Stage Billing',
        '/retention-tracking': 'Retention Tracking',
        '/payroll': 'Payroll Management',
        '/vendors': 'Vendor Management',

        // Location & Media
        '/map': 'Project Map',
        '/site-photos': 'Site Photos',
        '/plan-viewer': '3D Plan Viewer',

        // Administration
        '/admin/users': 'User Management',
        '/admin/roles': 'Role Management',
        '/admin/activity-logs': 'Activity Logs',
        '/admin/company-settings': 'Company Settings',
      };

      // Check if on attendance page and use tab parameter if available
      if (path === '/attendance') {
        const tab = searchParams.get('tab');
        if (tab === 'reports') {
          return 'Attendance Report';
        }
      }

      return titles[path] || 'Dashboard';
    };

    return (

        <div className="navbar">

            <div className="navbar-left">
                <h2 className="navbar-title">{getPageTitle()}</h2>
            </div>

            <div className="navbar-right">

                {/* Festival Indicator */}
                {(() => { const f = getActiveFestival(); return f ? (
                    <span style={{
                        marginRight: '12px', fontSize: '13px', fontWeight: 600,
                        color: f.colors[0], background: `${f.colors[0]}10`,
                        padding: '4px 10px', borderRadius: '8px'
                    }}>
                        {f.emoji} {f.name}
                    </span>
                ) : null; })()}

                {/* Notifications */}
                <NotificationPanel />

                {/* User Menu */}
                <div className="user-menu">
                    <button
                        className="user-button"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="user-avatar">{currentUser.initial}</div>
                        <span className="user-name">{currentUser.username}</span>
                        <span className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`}>▼</span>
                    </button>

                    {showUserMenu && (
                        <div className="user-dropdown">
                            <a href="/profile" className="dropdown-item">
                                <FaUser className="dropdown-icon" />
                                Profile
                            </a>
                            <a href="/settings" className="dropdown-item">
                                <FaCog className="dropdown-icon" />
                                Settings
                            </a>
                            <button
                                onClick={handleLogout}
                                className="dropdown-item logout-item"
                            >
                                <FaSignOutAlt className="dropdown-icon" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>

            </div>

        </div>

    );

}

export default Navbar;