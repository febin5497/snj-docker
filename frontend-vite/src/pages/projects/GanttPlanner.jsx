import { Gantt, ViewMode } from "gantt-task-react"
import "gantt-task-react/dist/index.css"
import { useState, useEffect } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import "../../styles/GanttPlanner.css"
export default function GanttPlanner() {
    const { showSuccess, showError, showInfo } = useToast()
    const [tasks, setTasks] = useState([])
    const [projects, setProjects] = useState([])
    const [selectedProjectId, setSelectedProjectId] = useState("")
    const [viewMode, setViewMode] = useState(ViewMode.Month)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tasksLoading, setTasksLoading] = useState(false)
    const [error, setError] = useState(null)
    // Load projects on component mount
    useEffect(() => {
        loadProjects()
    }, [])
    // Load tasks when project is selected
    useEffect(() => {
        if (selectedProjectId) {
            loadTasks()
        }
    }, [selectedProjectId])
    const loadProjects = async () => {
        try {
            setLoading(true)
            const response = await api.get("/api/projects")
            // API returns { data: [...], success: true, message: "..." }
            // Extract the actual projects array
            const projectsData = Array.isArray(response.data?.data)
                ? response.data.data
                : Array.isArray(response.data)
                ? response.data
                : []
            setProjects(projectsData)
            if (projectsData.length > 0) {
                setSelectedProjectId(projectsData[0].id.toString())
            }
            setError(null)
        } catch (err) {
            setError("Failed to load projects")
            showError("Failed to load projects")
            setProjects([]) // Ensure projects is always an array
        } finally {
            setLoading(false)
        }
    }
    const loadTasks = async () => {
        if (!selectedProjectId) return
        try {
            setTasksLoading(true)
            setError(null)
            const response = await api.get(`/api/projects/${selectedProjectId}/tasks`)
            const tasksData = Array.isArray(response.data?.data)
                ? response.data.data
                : Array.isArray(response.data)
                ? response.data
                : []
            // Transform API response to Gantt chart format
            const formattedTasks = tasksData.map((task, index) => {
                // Get assigned staff with details
                const activeAssignments = (task.staff_assignments || []).filter(a => !a.removed_on)
                const assignedStaffNames = activeAssignments
                    .map(a => a.staff_name)
                    .join(", ")
                // Format staff with assignment dates for tooltip
                const staffWithDates = activeAssignments
                    .map(a => {
                        const assignDate = a.assigned_on
                            ? new Date(a.assigned_on).toLocaleDateString()
                            : "Unknown"
                        return `${a.staff_name} (assigned: ${assignDate})`
                    })
                    .join("\n")
                // Create display name with staff info
                const displayName = assignedStaffNames
                    ? `${task.task_name} (${assignedStaffNames})`
                    : task.task_name
                return {
                    id: task.id,
                    name: displayName,
                    start: new Date(task.start_date),
                    end: new Date(task.end_date),
                    progress: task.progress || 0,
                    type: "task",
                    status: task.status || "todo",
                    project_id: parseInt(selectedProjectId),
                    description: task.description || "",
                    priority: task.priority || "medium",
                    task_type: task.task_type || "Activity",
                    assigned_staff: assignedStaffNames,
                    staff_with_dates: staffWithDates,
                    staff_count: activeAssignments.length,
                    staff_assignments: activeAssignments,
                    isDisabled: false,
                    // Keep original task data for editing
                    originalData: task
                }
            })
            setTasks(formattedTasks)
        } catch (err) {
            setError("Failed to load tasks")
        } finally {
            setTasksLoading(false)
        }
    }
    // Form state
    const [formData, setFormData] = useState({
        task_name: "",
        start_date: "",
        end_date: "",
        status: "todo",
        progress: 0,
        description: ""
    })
    // Reset form
    const resetForm = () => {
        setFormData({
            task_name: "",
            start_date: "",
            end_date: "",
            status: "todo",
            progress: 0,
            description: ""
        })
    }
    // Handle add task click
    const handleAddClick = () => {
        resetForm()
        setEditingTask(null)
        setShowAddModal(true)
    }
    // Handle edit task click
    const handleEditClick = (task) => {
        // Extract original task name without staff info if available
        let taskName = task.name
        if (task.originalData && task.originalData.task_name) {
            taskName = task.originalData.task_name
        } else if (task.name && task.name.includes('(')) {
            // Extract name before the staff list
            taskName = task.name.substring(0, task.name.lastIndexOf('(')).trim()
        }
        setFormData({
            task_name: taskName,
            start_date: task.start.toISOString().split('T')[0],
            end_date: task.end.toISOString().split('T')[0],
            status: task.status || "todo",
            progress: task.progress || 0,
            description: task.description || ""
        })
        setEditingTask(task)
        setShowAddModal(true)
    }
    // Handle delete click
    const handleDeleteClick = (task) => {
        setDeleteConfirm(task)
    }
    // Handle confirm delete
    const handleConfirmDelete = async () => {
        if (deleteConfirm) {
            try {
                setLoading(true)
                // Delete task via API
                await api.delete(
                    `/api/projects/${selectedProjectId}/tasks/${deleteConfirm.id}`
                )
                setDeleteConfirm(null)
                setError(null)
                showSuccess("Task deleted successfully!")
                // Reload tasks from API
                loadTasks()
            } catch (err) {
                setError(err.response?.data?.message || "Failed to delete task")
                showError(err.response?.data?.message || "Failed to delete task")
            } finally {
                setLoading(false)
            }
        }
    }
    // Handle form input change
    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === "progress" ? parseInt(value) || 0 : value
        }))
    }
    // Handle Gantt chart task change (dates/progress)
    const handleTaskChange = async (updatedTask) => {
        try {
            setLoading(true)
            // Update task via API with new dates and progress
            await api.put(
                `/api/projects/${selectedProjectId}/tasks/${updatedTask.id}`,
                {
                    start_date: updatedTask.start.toISOString().split('T')[0],
                    end_date: updatedTask.end.toISOString().split('T')[0],
                    progress: updatedTask.progress || 0,
                    task_name: updatedTask.originalData?.task_name || updatedTask.name,
                    status: updatedTask.status || "todo"
                }
            )
            showSuccess("Task updated successfully!")
            // Reload tasks to ensure consistency
            loadTasks()
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update task")
            showError(err.response?.data?.message || "Failed to update task")
            // Reload tasks to revert changes
            loadTasks()
        } finally {
            setLoading(false)
        }
    }
    // Handle form submit
    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        // Validation
        if (!formData.task_name.trim()) {
            setError("Task name is required")
            showError("Task name is required")
            return
        }
        if (!formData.start_date || !formData.end_date) {
            setError("Start and end dates are required")
            showError("Start and end dates are required")
            return
        }
        const startDate = new Date(formData.start_date)
        const endDate = new Date(formData.end_date)
        if (startDate > endDate) {
            setError("Start date must be before end date")
            showError("Start date must be before end date")
            return
        }
        try {
            setLoading(true)
            if (editingTask) {
                // Update existing task via API
                await api.put(
                    `/api/projects/${selectedProjectId}/tasks/${editingTask.id}`,
                    {
                        task_name: formData.task_name,
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        status: formData.status,
                        progress: formData.progress,
                        description: formData.description
                    }
                )
                showSuccess("Task updated successfully!")
            } else {
                // Create new task via API
                // Get company_id from the current project
                const currentProject = projects.find(p => p.id === parseInt(selectedProjectId))
                const companyId = currentProject?.company_id || 1
                await api.post(
                    `/api/projects/${selectedProjectId}/tasks`,
                    {
                        task_name: formData.task_name,
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        status: formData.status,
                        progress: formData.progress,
                        description: formData.description,
                        task_type: "Activity",
                        company_id: companyId
                    }
                )
                showSuccess("Task created successfully!")
            }
            // Reload tasks from API
            loadTasks()
            setShowAddModal(false)
            resetForm()
            setEditingTask(null)
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to save task")
            showError(err.response?.data?.message || err.message || "Failed to save task")
        } finally {
            setLoading(false)
        }
    }
    // Filter tasks by selected project
    const filteredTasks = tasks.filter(t => t.project_id === parseInt(selectedProjectId))
    if (loading && projects.length === 0) {
        return (
            <div className="gantt-page">
                <div className="gantt-loading">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }
    return (
        <div className="gantt-page theme-blue-white">
            <div className="gantt-container">
                {/* Header Section */}
                <div className="gantt-header">
                    <h1 className="gantt-title">Project Planner</h1>
                    <div className="gantt-controls">
                        {projects.length === 0 ? (
                            <div style={{ color: '#718096', fontSize: '14px', padding: '8px 12px' }}>
                                📌 No projects available. Create a project first to use the planner.
                            </div>
                        ) : (
                            <>
                                <select
                                    className="project-selector"
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="view-mode-selector"
                                    value={viewMode}
                                    onChange={(e) => setViewMode(e.target.value)}
                                >
                                    <option value={ViewMode.Day}>Day View</option>
                                    <option value={ViewMode.Week}>Week View</option>
                                    <option value={ViewMode.Month}>Month View</option>
                                </select>
                                <button
                                    className="add-task-btn"
                                    onClick={handleAddClick}
                                    disabled={!selectedProjectId}
                                >
                                    + Add Task
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {/* Error Message */}
                {error && (
                    <div className="gantt-error" style={{ marginBottom: '16px' }}>
                        {error}
                    </div>
                )}
                {/* Gantt Chart */}
                {selectedProjectId && filteredTasks.length > 0 ? (
                    <div className="gantt-chart-wrapper">
                        <Gantt
                            tasks={filteredTasks}
                            viewMode={viewMode}
                            onTaskChange={handleTaskChange}
                            onDelete={handleDeleteClick}
                            columnWidth={60}
                        />
                    </div>
                ) : selectedProjectId ? (
                    <div className="gantt-empty-state">
                        <div className="gantt-empty-icon">📋</div>
                        <div className="gantt-empty-text">No tasks yet</div>
                        <div className="gantt-empty-description">
                            Click "Add Task" to create your first task for this project
                        </div>
                    </div>
                ) : (
                    <div className="gantt-empty-state">
                        <div className="gantt-empty-icon">🎯</div>
                        <div className="gantt-empty-text">Select a project</div>
                        <div className="gantt-empty-description">
                            Choose a project from the dropdown to view and manage tasks
                        </div>
                    </div>
                )}
                {/* Task Table */}
                {selectedProjectId && filteredTasks.length > 0 && (
                    <div className="task-table-container" style={{ marginTop: '24px' }}>
                        <table className="task-table">
                            <thead>
                                <tr>
                                    <th>Task Name</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Assigned Staff</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr key={task.id}>
                                        <td>{task.originalData ? task.originalData.task_name : task.name}</td>
                                        <td>{task.start.toLocaleDateString()}</td>
                                        <td>{task.end.toLocaleDateString()}</td>
                                        <td>
                                            {task.assigned_staff ? (
                                                <div
                                                    className="staff-cell"
                                                    title={task.staff_with_dates}
                                                >
                                                    <span className="staff-names">{task.assigned_staff}</span>
                                                    <small className="staff-count">({task.staff_count} staff)</small>
                                                </div>
                                            ) : (
                                                <span className="no-staff">No staff assigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`task-status-badge ${(task.status || 'todo').toLowerCase()}`}>
                                                {(task.status || 'todo').replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="task-progress-bar">
                                                <div
                                                    className="task-progress-fill"
                                                    style={{ width: `${task.progress}%` }}
                                                ></div>
                                            </div>
                                            <small>{task.progress}%</small>
                                        </td>
                                        <td>
                                            <div className="task-actions">
                                                <button
                                                    className="task-action-btn"
                                                    onClick={() => handleEditClick(task)}
                                                    title="Edit task"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    className="task-action-btn delete"
                                                    onClick={() => handleDeleteClick(task)}
                                                    title="Delete task"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Add/Edit Task Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="task-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingTask ? "Edit Task" : "Add New Task"}
                            </h2>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="modal-body">
                                {error && (
                                    <div className="gantt-error" style={{ marginBottom: '16px' }}>
                                        {error}
                                    </div>
                                )}
                                <div className="task-form-group">
                                    <label htmlFor="task_name">Task Name *</label>
                                    <input
                                        type="text"
                                        id="task_name"
                                        name="task_name"
                                        value={formData.task_name}
                                        onChange={handleFormChange}
                                        placeholder="Enter task name"
                                        required
                                    />
                                </div>
                                <div className="task-form-row">
                                    <div className="task-form-group">
                                        <label htmlFor="start_date">Start Date *</label>
                                        <input
                                            type="date"
                                            id="start_date"
                                            name="start_date"
                                            value={formData.start_date}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="task-form-group">
                                        <label htmlFor="end_date">End Date *</label>
                                        <input
                                            type="date"
                                            id="end_date"
                                            name="end_date"
                                            value={formData.end_date}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="task-form-row">
                                    <div className="task-form-group">
                                        <label htmlFor="status">Status</label>
                                        <select
                                            id="status"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleFormChange}
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                    <div className="task-form-group">
                                        <label htmlFor="progress">Progress (%)</label>
                                        <input
                                            type="number"
                                            id="progress"
                                            name="progress"
                                            min="0"
                                            max="100"
                                            value={formData.progress}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>
                                <div className="task-form-group task-form-row full">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleFormChange}
                                        placeholder="Enter task description (optional)"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="modal-btn modal-btn-secondary"
                                    onClick={() => {
                                        setShowAddModal(false)
                                        resetForm()
                                        setEditingTask(null)
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-btn modal-btn-primary"
                                >
                                    {editingTask ? "Update Task" : "Add Task"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="task-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Delete Task</h2>
                        </div>
                        <div className="confirmation-dialog">
                            <p>
                                Are you sure you want to delete the task <strong>"{deleteConfirm.name}"</strong>?
                            </p>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                                This action cannot be undone.
                            </p>
                            <div className="confirmation-actions">
                                <button
                                    className="confirmation-btn confirmation-btn-cancel"
                                    onClick={() => setDeleteConfirm(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="confirmation-btn confirmation-btn-delete"
                                    onClick={handleConfirmDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
