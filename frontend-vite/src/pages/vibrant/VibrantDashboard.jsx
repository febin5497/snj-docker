import React, { useState, useEffect } from "react";
import api from "../../api/api";
import "../../styles/vibrant-theme.css";
import "../../styles/vibrant-layout.css";

const VibrantDashboard = () => {
  const [stats, setStats] = useState({
    projects: 0,
    staff: 0,
    expenses: 0,
    revenue: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [projRes, staffRes] = await Promise.allSettled([
          api.get("/api/projects"),
          api.get("/api/staff"),
        ]);
        if (projRes.status === "fulfilled") {
          const projects = projRes.value.data?.data || projRes.value.data || [];
          setStats((s) => ({ ...s, projects: Array.isArray(projects) ? projects.length : 0 }));
          setRecentProjects(Array.isArray(projects) ? projects.slice(0, 5) : []);
        }
        if (staffRes.status === "fulfilled") {
          const staff = staffRes.value.data?.data || staffRes.value.data || [];
          setStats((s) => ({ ...s, staff: Array.isArray(staff) ? staff.length : 0 }));
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statCards = [
    { icon: "🏗️", label: "Active Projects", value: stats.projects, color: "#6C5CE7", bg: "rgba(108,92,231,0.15)" },
    { icon: "👥", label: "Total Staff", value: stats.staff, color: "#00CEC9", bg: "rgba(0,206,201,0.15)" },
    { icon: "💰", label: "Monthly Expenses", value: `₹${(stats.expenses / 1000).toFixed(0)}K`, color: "#FD79A8", bg: "rgba(253,121,168,0.15)" },
    { icon: "📈", label: "Revenue", value: `₹${(stats.revenue / 1000).toFixed(0)}K`, color: "#FDCB6E", bg: "rgba(253,203,110,0.15)" },
  ];

  const quickActions = [
    { icon: "➕", label: "New Project", path: "/projects/new", color: "#6C5CE7" },
    { icon: "👥", label: "Add Staff", path: "/staff", color: "#00CEC9" },
    { icon: "💰", label: "Add Transaction", path: "/finance/add", color: "#FD79A8" },
    { icon: "📋", label: "Attendance", path: "/attendance/unified", color: "#FDCB6E" },
    { icon: "🛒", label: "New Purchase", path: "/purchases", color: "#00B894" },
    { icon: "📄", label: "Reports", path: "/reports", color: "#FF6B6B" },
  ];

  return (
    <div className="v-layout">
      <div className="v-main">
        <div className="v-main-header">
          <div>
            <h1 className="v-main-title">Welcome back, {user.username || "User"}</h1>
            <p style={{ color: "var(--v-text-muted)", fontSize: "14px", marginTop: "4px" }}>
              Here's what's happening with your projects today
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--v-text-muted)" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            Loading dashboard...
          </div>
        ) : (
          <>
            <div className="v-stats-grid">
              {statCards.map((card, i) => (
                <div className="v-stat-card" key={i}>
                  <div className="v-stat-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="v-stat-value">{card.value}</div>
                  <div className="v-stat-label">{card.label}</div>
                  <div className="v-stat-change up">+12% this month</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--v-text)", marginBottom: "16px" }}>
                Quick Actions
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    className="v-card"
                    onClick={() => (window.location.href = action.path)}
                    style={{ cursor: "pointer", textAlign: "center", padding: "20px 16px" }}
                  >
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>{action.icon}</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--v-text-secondary)" }}>
                      {action.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="v-content-grid">
              <div className="v-card">
                <div className="v-card-header">
                  <h3 className="v-card-title">Recent Projects</h3>
                </div>
                <table className="v-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProjects.length > 0 ? (
                      recentProjects.map((p, i) => (
                        <tr key={i}>
                          <td style={{ color: "var(--v-text)", fontWeight: "500" }}>{p.name}</td>
                          <td>
                            <span className={`v-badge ${p.status === "active" || p.status === "in_progress" ? "v-badge-active" : p.status === "completed" ? "v-badge-primary" : "v-badge-pending"}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" style={{ textAlign: "center", padding: "24px", color: "var(--v-text-muted)" }}>
                          No projects yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="v-card">
                <div className="v-card-header">
                  <h3 className="v-card-title">System Status</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { name: "Auth Service", status: "Healthy", color: "#00B894" },
                    { name: "Project Service", status: "Healthy", color: "#00B894" },
                    { name: "Finance Service", status: "Healthy", color: "#00B894" },
                    { name: "Staff Service", status: "Healthy", color: "#00B894" },
                    { name: "Database", status: "Connected", color: "#00B894" },
                    { name: "Redis Cache", status: "Connected", color: "#00B894" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--v-bg-card-hover)", borderRadius: "10px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--v-text-secondary)" }}>{s.name}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: s.color }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, display: "inline-block" }}></span>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VibrantDashboard;
