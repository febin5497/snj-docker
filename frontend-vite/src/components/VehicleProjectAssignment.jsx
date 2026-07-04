import { useState, useEffect } from 'react'
import { FaLink, FaPlus, FaUnlink, FaHistory } from 'react-icons/fa'
import api from '../api/api'
import { useToast } from './Toast'
import '../styles/VehicleProjectAssignment.css'

export default function VehicleProjectAssignment({ vehicleId, vehicleName }) {
    const { showSuccess, showError } = useToast()
    const [assignedProjects, setAssignedProjects] = useState([])
    const [availableProjects, setAvailableProjects] = useState([])
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [history, setHistory] = useState([])

    useEffect(() => {
        if (vehicleId) {
            fetchAssignedProjects()
            fetchAvailableProjects()
        }
    }, [vehicleId])

    const fetchAssignedProjects = async () => {
        try {
            const res = await api.get(`/api/vehicles/${vehicleId}/projects/active`)
            setAssignedProjects(res.data?.data || [])
        } catch (err) {
            showError('Failed to load assigned projects')
        }
    }

    const fetchAvailableProjects = async () => {
        try {
            const res = await api.get('/api/projects?page=1&per_page=100')
            // API returns { data: [...], success: true, message: "..." }
            const allProjects = Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res.data)
                ? res.data
                : []
            // Filter out already assigned projects
            const assignedIds = assignedProjects.map((p) => p.project_id)
            const available = allProjects.filter((p) => !assignedIds.includes(p.id))
            setAvailableProjects(available)
        } catch (err) {
            console.error('Failed to load available projects')
            setAvailableProjects([])
        }
    }

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/api/vehicles/${vehicleId}/assignment-history`)
            setHistory(res.data?.data || [])
            setShowHistory(true)
        } catch (err) {
            showError('Failed to load assignment history')
        }
    }

    const handleAssignProject = async () => {
        if (!selectedProjectId) {
            showError('Please select a project')
            return
        }

        setIsLoading(true)
        try {
            await api.post(`/api/vehicles/${vehicleId}/assign-project`, {
                project_id: parseInt(selectedProjectId)
            })
            showSuccess('Project assigned successfully')
            setSelectedProjectId('')
            fetchAssignedProjects()
            fetchAvailableProjects()
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to assign project'
            showError(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUnassignProject = async (projectId) => {
        if (!window.confirm('Unassign this project from the vehicle?')) return

        setIsLoading(true)
        try {
            await api.post(`/api/vehicles/${vehicleId}/unassign-project`, {
                project_id: projectId
            })
            showSuccess('Project unassigned successfully')
            fetchAssignedProjects()
            fetchAvailableProjects()
        } catch (err) {
            showError('Failed to unassign project')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="vehicle-project-container">
            <div className="assignment-header">
                <div className="header-title">
                    <FaLink className="assignment-icon" />
                    <h3>Project Assignments</h3>
                    <span className="count-badge">{assignedProjects.length}</span>
                </div>
                <button
                    className="btn-secondary btn-sm"
                    onClick={fetchHistory}
                    disabled={isLoading}
                    title="View assignment history"
                >
                    <FaHistory /> History
                </button>
            </div>

            {/* Assignment Form */}
            <div className="assignment-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>Select Project</label>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            disabled={isLoading || availableProjects.length === 0}
                        >
                            <option value="">-- Choose a project --</option>
                            {availableProjects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name} {project.location ? `(${project.location})` : ''}
                                </option>
                            ))}
                        </select>
                        {availableProjects.length === 0 && (
                            <span className="hint-text">No available projects to assign</span>
                        )}
                    </div>
                    <button
                        className="btn-primary assign-btn"
                        onClick={handleAssignProject}
                        disabled={isLoading || !selectedProjectId}
                    >
                        <FaPlus /> Assign
                    </button>
                </div>
            </div>

            {/* Assigned Projects List */}
            <div className="assigned-projects">
                {assignedProjects.length === 0 ? (
                    <div className="empty-state">No projects assigned to this vehicle</div>
                ) : (
                    <div className="projects-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Assigned Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignedProjects.map((project) => (
                                    <tr key={project.id}>
                                        <td className="project-name">{project.name}</td>
                                        <td>{project.location || '-'}</td>
                                        <td>
                                            <span className={`status-badge status-${project.status?.toLowerCase() || 'unknown'}`}>
                                                {project.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td>{new Date(project.assigned_on).toLocaleDateString()}</td>
                                        <td className="actions">
                                            <button
                                                className="btn-icon unassign"
                                                onClick={() => handleUnassignProject(project.id)}
                                                title="Unassign"
                                                disabled={isLoading}
                                            >
                                                <FaUnlink />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Assignment History Modal */}
            {showHistory && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>Assignment History</h4>
                            <button
                                className="btn-close"
                                onClick={() => setShowHistory(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            {history.length === 0 ? (
                                <div className="empty-state">No assignment history</div>
                            ) : (
                                <div className="history-list">
                                    {history.map((entry, index) => (
                                        <div key={index} className="history-entry">
                                            <div className="history-info">
                                                <span className="history-project">{entry.project_name}</span>
                                                <span className="history-dates">
                                                    {new Date(entry.assigned_date).toLocaleDateString()}
                                                    {entry.unassigned_date && ` - ${new Date(entry.unassigned_date).toLocaleDateString()}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
