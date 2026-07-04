import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import { Search, Filter, Download, Eye, ChevronDown } from "lucide-react"
import "../../styles/ActivityLogs.css"
export default function ActivityLogs() {
    const { showSuccess, showError } = useToast()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedLog, setSelectedLog] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [expandedLog, setExpandedLog] = useState(null)
    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [perPage, setPerPage] = useState(20)
    const [totalPages, setTotalPages] = useState(1)
    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [actionFilter, setActionFilter] = useState("")
    const [entityFilter, setEntityFilter] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    useEffect(() => {
        setCurrentPage(1)
        loadActivityLogs()
    }, [])
    useEffect(() => {
        loadActivityLogs()
    }, [currentPage, searchQuery, actionFilter, entityFilter, dateFrom, dateTo])
    const loadActivityLogs = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: currentPage,
                per_page: perPage,
                ...(searchQuery && { search: searchQuery }),
                ...(actionFilter && { action: actionFilter }),
                ...(entityFilter && { entity_type: entityFilter }),
                ...(dateFrom && { date_from: dateFrom }),
                ...(dateTo && { date_to: dateTo })
            })
            const res = await api.get(`/api/admin/activity-logs?${params}`)
            if (res.data.success) {
                const raw = res.data?.data; setLogs(Array.isArray(raw) ? raw : (raw?.items || []))
                setTotalPages(res.data.pagination?.pages || 1)
            } else {
                showError(res.data.error || "Failed to load activity logs")
            }
        } catch (err) {
            showError(err.response?.data?.error || "Error loading activity logs")
        } finally {
            setLoading(false)
        }
    }
    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(searchQuery && { search: searchQuery }),
                ...(actionFilter && { action: actionFilter }),
                ...(entityFilter && { entity_type: entityFilter }),
                ...(dateFrom && { date_from: dateFrom }),
                ...(dateTo && { date_to: dateTo })
            })
            const res = await api.get(`/api/admin/activity-logs/export?${params}`, {
                responseType: 'blob'
            })
            // Create download link
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            link.parentElement.removeChild(link)
            showSuccess("Activity logs exported successfully")
        } catch (err) {
            showError("Error exporting activity logs")
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
    const getActionColor = (action) => {
        if (action?.includes('CREATE')) return 'action-create'
        if (action?.includes('UPDATE')) return 'action-update'
        if (action?.includes('DELETE')) return 'action-delete'
        if (action?.includes('APPROVE')) return 'action-approve'
        return 'action-default'
    }
    const handleResetFilters = () => {
        setSearchQuery("")
        setActionFilter("")
        setEntityFilter("")
        setDateFrom("")
        setDateTo("")
        setCurrentPage(1)
    }
    if (loading && logs.length === 0) {
        return (
            <div className="activity-logs-container">
                <div className="loading">Loading activity logs...</div>
            </div>
        )
    }
    return (
        <div className="theme-blue-white" style={{ minHeight: '100vh', padding: '20px' }}>
        <div className="activity-logs-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div className="logs-header">
                <div>
                    <h1 className="logs-title header-blue-white">Activity Logs</h1>
                    <p className="logs-subtitle">View and audit all activities</p>
                </div>
                <button onClick={handleExport} className="btn btn-primary export-btn">
                    <Download size={18} />
                    <span>Export CSV</span>
                </button>
            </div>
            {/* Filters */}
            <div className="filters-card">
                <div className="filter-section">
                    <div className="filter-group">
                        <label>Search</label>
                        <div className="search-box">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by user, entity, or details..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                        </div>
                    </div>
                    <div className="filter-group">
                        <label>Action</label>
                        <select value={actionFilter} onChange={(e) => {
                            setActionFilter(e.target.value)
                            setCurrentPage(1)
                        }}>
                            <option value="">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="APPROVE">Approve</option>
                            <option value="REJECT">Reject</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Entity Type</label>
                        <select value={entityFilter} onChange={(e) => {
                            setEntityFilter(e.target.value)
                            setCurrentPage(1)
                        }}>
                            <option value="">All Types</option>
                            <option value="Project">Project</option>
                            <option value="Staff">Staff</option>
                            <option value="Invoice">Invoice</option>
                            <option value="Attendance">Attendance</option>
                            <option value="Role">Role</option>
                            <option value="User">User</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>From Date</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value)
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                    <div className="filter-group">
                        <label>To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value)
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                    <div className="filter-actions">
                        <button className="btn btn-secondary reset-btn" onClick={handleResetFilters}>
                            <Filter size={16} />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>
            </div>
            {/* Logs List */}
            <div className="logs-card">
                {logs.length > 0 ? (
                    <div className="logs-list">
                        {logs.map((log) => (
                            <div key={log.id} className="log-item">
                                <div className="log-main" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                                    <div className="log-icon">
                                        <span className={`action-badge ${getActionColor(log.action)}`}>
                                            {log.action?.[0] || '?'}
                                        </span>
                                    </div>
                                    <div className="log-content">
                                        <p className="log-description">
                                            <strong>{log.user_name || 'Unknown User'}</strong> {log.action?.toLowerCase()} {log.entity_type}
                                            {log.entity_name && ` "${log.entity_name}"`}
                                        </p>
                                        <div className="log-meta">
                                            <span className="log-time">{formatDate(log.timestamp)}</span>
                                            <span className="log-separator">•</span>
                                            <span className="log-ip">{log.ip_address || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="expand-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedLog(log)
                                            setShowDetailModal(true)
                                        }}
                                        title="View details"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </div>
                                {/* Expandable Details */}
                                {expandedLog === log.id && (
                                    <div className="log-details">
                                        <div className="details-grid">
                                            <div className="detail-item">
                                                <label>User:</label>
                                                <span>{log.user_name || 'Unknown'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Entity Type:</label>
                                                <span>{log.entity_type}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Action:</label>
                                                <span className={`action-label ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Timestamp:</label>
                                                <span>{formatDate(log.timestamp)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>IP Address:</label>
                                                <span>{log.ip_address || 'N/A'}</span>
                                            </div>
                                        </div>
                                        {log.old_value && (
                                            <div className="detail-changes">
                                                <p className="changes-label">Previous Values:</p>
                                                <pre className="changes-content">{log.old_value}</pre>
                                            </div>
                                        )}
                                        {log.new_value && (
                                            <div className="detail-changes">
                                                <p className="changes-label">New Values:</p>
                                                <pre className="changes-content">{log.new_value}</pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>No activity logs found matching your filters</p>
                    </div>
                )}
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                        >
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
            {/* Detail Modal */}
            {showDetailModal && selectedLog && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Activity Log Details</h2>
                            <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <h3>General Information</h3>
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <label>User:</label>
                                        <span>{selectedLog.user_name || 'Unknown'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Entity Type:</label>
                                        <span>{selectedLog.entity_type}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Entity Name:</label>
                                        <span>{selectedLog.entity_name || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Action:</label>
                                        <span className={`action-label ${getActionColor(selectedLog.action)}`}>
                                            {selectedLog.action}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Timestamp:</label>
                                        <span>{formatDate(selectedLog.timestamp)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>IP Address:</label>
                                        <span>{selectedLog.ip_address || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            {selectedLog.old_value && (
                                <div className="detail-section">
                                    <h3>Previous Values</h3>
                                    <pre className="changes-content">{selectedLog.old_value}</pre>
                                </div>
                            )}
                            {selectedLog.new_value && (
                                <div className="detail-section">
                                    <h3>New Values</h3>
                                    <pre className="changes-content">{selectedLog.new_value}</pre>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    )
}
