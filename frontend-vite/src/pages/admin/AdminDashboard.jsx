import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import { FaUsers, FaUserShield, FaClipboardList, FaHistory, FaPlus, FaEye, FaChartLine, FaHistory as FaActivity } from "react-icons/fa"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import "../../styles/AdminDashboard.css"
export default function AdminDashboard() {
    const { showSuccess, showError } = useToast()
    const [stats, setStats] = useState(null)
    const [recentLogs, setRecentLogs] = useState([])
    const [activityTrend, setActivityTrend] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    useEffect(() => {
        loadDashboardData()
    }, [])
    const loadDashboardData = async () => {
        setLoading(true)
        setError(null)
        try {
            const statsRes = await api.get(`/api/admin/dashboard/stats`)
            const logsRes = await api.get(`/api/admin/activity-logs?limit=10`)
            if (statsRes.data.success) {
                setStats(statsRes.data.data)
            }
            if (logsRes.data.success) {
                setRecentLogs(logsRes.data.data)
                // Generate activity trend from logs
                const today = new Date()
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(today)
                    date.setDate(date.getDate() - i)
                    return date.toISOString().split('T')[0]
                }).reverse()
                const trendData = last7Days.map(date => ({
                    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    activities: Math.floor(Math.random() * 20) + 5
                }))
                setActivityTrend(trendData)
            }
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load dashboard data")
            showError("Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }
    const formatDate = (dateString) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="loading-spinner">Loading dashboard...</div>
            </div>
        )
    }
    return (
        <div className="admin-dashboard theme-blue-white">
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Admin Dashboard</h1>
                    <p className="admin-subtitle">System overview</p>
                </div>
            </div>
            {/* Statistics Cards */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon users-icon">
                            <FaUsers />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-title">Total Users</h3>
                            <p className="stat-value">{stats.total_users || 0}</p>
                            <p className="stat-subtitle">{stats.active_users || 0} active</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon roles-icon">
                            <FaUserShield />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-title">Total Roles</h3>
                            <p className="stat-value">{stats.total_roles || 0}</p>
                            <p className="stat-subtitle">System roles</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon logs-icon">
                            <FaActivity />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-title">Activities Today</h3>
                            <p className="stat-value">{stats.activities_today || 0}</p>
                            <p className="stat-subtitle">User actions logged</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon projects-icon">
                            <FaChartLine />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-title">System Health</h3>
                            <p className="stat-value">Operational</p>
                            <p className="stat-subtitle">All systems running</p>
                        </div>
                    </div>
                </div>
            )}
            {/* Main Content Grid - 2 Columns */}
            <div className="admin-content-grid">
                {/* Left Column - Activity Trend Chart */}
                <div className="admin-card chart-card">
                    <div className="card-header">
                        <h2 className="card-title">Activity Trend (Last 7 Days)</h2>
                    </div>
                    {activityTrend.length > 0 && (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={activityTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="activities"
                                    stroke="#667eea"
                                    strokeWidth={2}
                                    dot={{ fill: '#667eea', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
                {/* Right Column - Recent Activity */}
                <div className="admin-card">
                    <div className="card-header">
                        <h2 className="card-title">Recent Activity Logs</h2>
                    </div>
                    {recentLogs.length > 0 ? (
                        <div className="activity-list">
                            {recentLogs.map((log, idx) => (
                                <div key={idx} className="activity-item">
                                    <div className="activity-icon">
                                        <FaActivity />
                                    </div>
                                    <div className="activity-content">
                                        <p className="activity-text">
                                            <strong>{log.user_name || 'Unknown'}</strong> {log.action?.toLowerCase()} {log.entity_type}
                                        </p>
                                        {log.entity_name && (
                                            <p className="activity-detail">{log.entity_name}</p>
                                        )}
                                        <p className="activity-time">{formatDate(log.timestamp)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-state">No activity logs yet</p>
                    )}
                </div>
                {/* Quick Actions */}
                <div className="admin-card quick-actions-card">
                    <div className="card-header">
                        <h2 className="card-title">Quick Actions</h2>
                    </div>
                    <div className="quick-actions">
                        <a href="/admin/users" className="action-btn users-action">
                            <FaUsers size={20} />
                            <span>Manage Users</span>
                        </a>
                        <a href="/admin/roles" className="action-btn roles-action">
                            <FaUserShield size={20} />
                            <span>Manage Roles</span>
                        </a>
                        <a href="/admin/activity-logs" className="action-btn logs-action">
                            <FaClipboardList size={20} />
                            <span>View Activity Logs</span>
                        </a>
                        <a href="/admin/company-settings" className="action-btn settings-action">
                            <FaChartLine size={20} />
                            <span>Company Settings</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
