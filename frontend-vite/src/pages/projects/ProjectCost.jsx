import { useState, useEffect } from "react"
import api from "../../api/api"
import { FaChartPie, FaProjectDiagram, FaRupeeSign, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa"
import '../../styles/ProjectCost.css'
export default function ProjectCost() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState("")
  const [costData, setCostData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [projectsLoading, setProjectsLoading] = useState(true)
  // Load all projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsLoading(true)
        const res = await api.get("/api/projects")
        // API returns { data: [...], success: true, message: "..." }
        const projectsData = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : []
        setProjects(projectsData)
        setError("")
      } catch (err) {
        setError("Failed to load projects")
        setProjects([]) // Ensure projects is always an array
      } finally {
        setProjectsLoading(false)
      }
    }
    loadProjects()
  }, [])
  // Load cost when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadCost()
    }
  }, [selectedProject])
  const loadCost = async () => {
    if (!selectedProject) {
      setError("Please select a project")
      return
    }
    try {
      setLoading(true)
      setError("")
      const res = await api.get(`/api/project-cost/${selectedProject}`)
      setCostData(res.data)
    } catch (err) {
      setError("Failed to load project cost data")
      setCostData(null)
    } finally {
      setLoading(false)
    }
  }
  const getStatusBadge = (status) => {
    const statusMap = {
      "Planned": { color: "#a0aec0", icon: "📌", label: "Planned" },
      "In Progress": { color: "#f6ad55", icon: "⚙️", label: "In Progress" },
      "Completed": { color: "#68d391", icon: "✓", label: "Completed" }
    }
    return statusMap[status] || { color: "#cbd5e0", icon: "•", label: status }
  }
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value)
  }
  const safeToFixed = (value, decimals = 2) => {
    if (value === undefined || value === null || isNaN(value)) return '0'
    return parseFloat(value).toFixed(decimals)
  }
  const getStatusClass = (profit) => {
    if (profit > 0) return "status-positive"
    if (profit < 0) return "status-negative"
    return "status-neutral"
  }
  return (
    <div className="project-cost-container theme-blue-white">
      <div className="cost-header">
        <div className="header-content">
          <h1 style={{ color: '#0052CC' }}><FaChartPie /> Project Cost Control</h1>
          <p className="header-subtitle">Analyze and monitor project expenses, revenue, and profitability</p>
        </div>
      </div>
      {/* Project Selection Card */}
      <div className="selection-card">
        <div className="selection-wrapper">
          <label htmlFor="project-select" className="selection-label">
            <FaProjectDiagram /> Select a Project
          </label>
          <div className="select-group">
            {projects.length === 0 && !projectsLoading ? (
              <div className="alert alert-info" style={{ marginTop: '8px' }}>
                📌 No projects available. Create a project first to view costs.
              </div>
            ) : (
              <select
                id="project-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="project-select"
                disabled={projectsLoading}
              >
                <option value="">
                  {projectsLoading ? "Loading projects..." : "Choose a project..."}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    📁 {project.name} - {project.location}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading project costs...</p>
        </div>
      )}
      {/* Cost Data Display */}
      {costData && !loading && (
        <div className="cost-data-section">
          {/* Project Header */}
          <div className="project-header-card">
            <div className="project-info">
              <h2>{costData.project_name}</h2>
              <p className="project-location">📍 {costData.location}</p>
              <div className="status-badge" style={{ backgroundColor: getStatusBadge(costData.status).color }}>
                {getStatusBadge(costData.status).icon} {getStatusBadge(costData.status).label}
              </div>
            </div>
          </div>
          {/* Main Metrics Grid */}
          <div className="metrics-grid card-blue-white">
            {/* Total Cost Card */}
            <div className="metric-card cost-card">
              <div className="card-icon">₹</div>
              <div className="card-content">
                <p className="card-label">Total Cost</p>
                <h3 className="card-value">{formatCurrency(costData.total_cost)}</h3>
                <p className="card-hint">All project expenses</p>
              </div>
            </div>
            {/* Revenue Card */}
            <div className="metric-card revenue-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <p className="card-label">Revenue</p>
                <h3 className="card-value">{formatCurrency(costData.revenue)}</h3>
                <p className="card-hint">Expected income</p>
              </div>
            </div>
            {/* Profit Card */}
            <div className={`metric-card profit-card ${getStatusClass(costData.profit)}`}>
              <div className="card-icon">
                {costData.profit >= 0 ? <FaCheckCircle style={{ color: '#48bb78' }} /> : <FaExclamationTriangle style={{ color: '#f56565' }} />}
              </div>
              <div className="card-content">
                <p className="card-label">Profit/Loss</p>
                <h3 className="card-value" style={{
                  color: costData.profit >= 0 ? '#22543d' : '#742a2a'
                }}>
                  {formatCurrency(costData.profit)}
                </h3>
                <p className="card-hint">
                  {costData.profit_margin !== undefined && costData.profit_margin !== null
                    ? `${parseFloat(costData.profit_margin).toFixed(2)}% margin`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          {/* Cost Breakdown Section */}
          <div className="breakdown-section">
            <h3 className="cost-section-title" style={{ color: '#0052CC' }}>Cost Breakdown</h3>
            <div className="breakdown-grid">
              {/* Material Cost */}
              <div className="breakdown-card material">
                <div className="card-header">
                  <span className="cost-icon">📦</span>
                  <h4>Material Cost</h4>
                </div>
                <div className="cost-amount">{formatCurrency(costData.material_cost)}</div>
                <div className="cost-percentage">
                  <div className="percentage-bar">
                    <div
                      className="percentage-fill material-fill"
                      style={{ width: `${costData.material_percentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="percentage-text">{safeToFixed(costData.material_percentage, 1)}%</span>
                </div>
                {costData.total_cost > 0 && (
                  <p className="cost-detail">
                    {(costData.material_cost / costData.total_cost * 100).toFixed(1)}% of total
                  </p>
                )}
              </div>
              {/* Labor Cost */}
              <div className="breakdown-card labor">
                <div className="card-header">
                  <span className="cost-icon">👷</span>
                  <h4>Labor Cost</h4>
                </div>
                <div className="cost-amount">{formatCurrency(costData.labor_cost)}</div>
                <div className="cost-percentage">
                  <div className="percentage-bar">
                    <div
                      className="percentage-fill labor-fill"
                      style={{ width: `${costData.labor_percentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="percentage-text">{safeToFixed(costData.labor_percentage, 1)}%</span>
                </div>
                {costData.total_cost > 0 && (
                  <p className="cost-detail">
                    {(costData.labor_cost / costData.total_cost * 100).toFixed(1)}% of total
                  </p>
                )}
              </div>
              {/* Vehicle Cost */}
              <div className="breakdown-card vehicle">
                <div className="card-header">
                  <span className="cost-icon">🚗</span>
                  <h4>Vehicle Cost</h4>
                </div>
                <div className="cost-amount">{formatCurrency(costData.vehicle_cost)}</div>
                <div className="cost-percentage">
                  <div className="percentage-bar">
                    <div
                      className="percentage-fill vehicle-fill"
                      style={{ width: `${costData.vehicle_percentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="percentage-text">{safeToFixed(costData.vehicle_percentage, 1)}%</span>
                </div>
                {costData.total_cost > 0 && (
                  <p className="cost-detail">
                    {(costData.vehicle_cost / costData.total_cost * 100).toFixed(1)}% of total
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Summary Stats */}
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Transactions</span>
              <span className="stat-value">{costData.transaction_count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Analysis</span>
              <span className="stat-value">
                {costData.profit > 0 ? "Profitable ✓" : "Loss ✗"}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Cost to Revenue</span>
              <span className="stat-value">
                {costData.revenue > 0 && costData.total_cost ? safeToFixed((costData.total_cost / costData.revenue) * 100, 1) : "0"}%
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Empty State */}
      {!costData && !loading && (
        <div className="empty-state">
          <FaProjectDiagram className="empty-icon" />
          <h3>Select a Project to View Costs</h3>
          <p>Choose a project from the dropdown above to analyze its costs, revenue, and profitability</p>
        </div>
      )}
    </div>
  )
}