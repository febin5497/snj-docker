/**
 * Project Tasks Management
 * Handles creation, management, and staff assignment for individual project tasks
 * Integrates with Gantt chart for visual task planning
 */
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import TaskForm from "../../components/TaskForm";
import TaskStaffAssignment from "../../components/TaskStaffAssignment";
import "../../styles/ProjectTasks.css";
const ProjectTasks = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showStaffAssignment, setShowStaffAssignment] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("order_index");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  // Fetch project and tasks on mount
  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId, filterStatus, sortBy]);
  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);
      setError("");
      // Fetch project details
      const projectResponse = await api.get(`/api/projects/${projectId}`);
      setProject(projectResponse.data.data);
      // Fetch tasks
      const tasksResponse = await api.get(
        `/api/projects/${projectId}/tasks?sort_by=${sortBy}${
          filterStatus !== "all" ? `&status=${filterStatus}` : ""
        }`,
      );
      setTasks(tasksResponse.data.data || []);
    } catch (err) {
      setError("Failed to load project and tasks");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateTask = async (taskData) => {
    try {
      await api.post(
        `/api/projects/${projectId}/tasks`,
        {
          ...taskData,
          company_id: project.company_id,
        },
      );
      setSuccessMessage("Task created successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      setShowTaskForm(false);
      // Refresh tasks
      fetchProjectAndTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };
  const handleUpdateTask = async (taskId, taskData) => {
    try {
      await api.put(
        `/api/projects/${projectId}/tasks/${taskId}`,
        taskData,
      );
      setSuccessMessage("Task updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      // Refresh tasks
      fetchProjectAndTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    }
  };
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(
        `/api/projects/${projectId}/tasks/${taskId}`,
      );
      setSuccessMessage("Task deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      setSelectedTask(null);
      // Refresh tasks
      fetchProjectAndTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  };
  const handleTaskStatusChange = async (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await handleUpdateTask(taskId, {
      ...task,
      status: newStatus,
    });
  };
  const handleProgressChange = async (taskId, newProgress) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await handleUpdateTask(taskId, {
      ...task,
      progress: newProgress,
    });
  };
  if (loading && tasks.length === 0) {
    return <div className="project-tasks-container">Loading...</div>;
  }
  return (
    <div className="project-tasks-container">
      <div className="header">
        <div>
          <h1>{project?.project_name}</h1>
          <p className="subtitle">Task Management</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowTaskForm(true)}
        >
          + Add Task
        </button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {/* Controls */}
      <div className="controls">
        <div className="filter-controls">
          <label>Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Tasks</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="order_index">Default Order</option>
            <option value="start_date">Start Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>
      {/* Tasks Table */}
      <div className="tasks-table-wrapper">
        {tasks.length === 0 ? (
          <div className="no-data">
            <p>No tasks found. Create your first task to get started.</p>
          </div>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Priority</th>
                <th>Assigned Staff</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className={`task-row status-${task.status}`}
                  onClick={() => setSelectedTask(task)}
                >
                  <td className="task-name">{task.task_name}</td>
                  <td>{task.task_type || "Activity"}</td>
                  <td>{task.start_date}</td>
                  <td>{task.end_date}</td>
                  <td>
                    <select
                      className={`status-badge status-${task.status}`}
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleTaskStatusChange(task.id, e.target.value);
                      }}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </td>
                  <td>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                      <span className="progress-text">{task.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`priority priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="assigned-count">
                    {task.staff_assignments?.filter((a) => !a.removed_on).length || 0}
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                        setShowStaffAssignment(true);
                      }}
                      title="Assign staff"
                    >
                      Assign
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      title="Delete task"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="modal-overlay" onClick={() => setShowTaskForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Task</h2>
              <button
                className="close-btn"
                onClick={() => setShowTaskForm(false)}
              >
                ×
              </button>
            </div>
            <TaskForm
              projectId={projectId}
              onSubmit={handleCreateTask}
              onCancel={() => setShowTaskForm(false)}
            />
          </div>
        </div>
      )}
      {/* Staff Assignment Modal */}
      {showStaffAssignment && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowStaffAssignment(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Staff to Task: {selectedTask.task_name}</h2>
              <button
                className="close-btn"
                onClick={() => setShowStaffAssignment(false)}
              >
                ×
              </button>
            </div>
            <TaskStaffAssignment
              projectId={projectId}
              taskId={selectedTask.id}
              onSuccess={() => {
                fetchProjectAndTasks();
                setShowStaffAssignment(false);
              }}
              onCancel={() => setShowStaffAssignment(false)}
            />
          </div>
        </div>
      )}
      {/* Task Detail Sidebar */}
      {selectedTask && !showStaffAssignment && (
        <div className="task-detail-sidebar">
          <div className="sidebar-header">
            <h3>{selectedTask.task_name}</h3>
            <button
              className="close-btn"
              onClick={() => setSelectedTask(null)}
            >
              ×
            </button>
          </div>
          <div className="detail-section">
            <label>Description</label>
            <p>{selectedTask.description || "No description"}</p>
          </div>
          <div className="detail-section">
            <label>Dates</label>
            <p>
              {selectedTask.start_date} to {selectedTask.end_date}
            </p>
          </div>
          <div className="detail-section">
            <label>Progress</label>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedTask.progress}
              onChange={(e) =>
                handleProgressChange(selectedTask.id, parseInt(e.target.value))
              }
              className="progress-slider"
            />
            <span>{selectedTask.progress}%</span>
          </div>
          <div className="detail-section">
            <label>Assigned Staff</label>
            <div className="assigned-staff-list">
              {(selectedTask.staff_assignments || [])
                .filter((a) => !a.removed_on)
                .map((assignment) => (
                  <div key={assignment.id} className="staff-badge">
                    {assignment.staff_name}
                    {assignment.role_on_task && (
                      <span className="role-badge">
                        {assignment.role_on_task}
                      </span>
                    )}
                  </div>
                ))}
              {(!selectedTask.staff_assignments ||
                selectedTask.staff_assignments.filter((a) => !a.removed_on)
                  .length === 0) && (
                <p className="no-staff">No staff assigned</p>
              )}
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowStaffAssignment(true)}
            style={{ width: "100%", marginTop: "20px" }}
          >
            Assign/Manage Staff
          </button>
        </div>
      )}
    </div>
  );
};
export default ProjectTasks;
