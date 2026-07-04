/**
 * Task Form Component
 * Handles creation and editing of project tasks
 */

import React, { useState, useEffect } from "react";
import "../styles/TaskForm.css";

const TaskForm = ({
  projectId,
  taskData = null,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    task_name: "",
    description: "",
    task_type: "Activity",
    start_date: "",
    end_date: "",
    status: "todo",
    progress: 0,
    priority: "medium",
    order_index: 0,
  });

  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (taskData) {
      setFormData({
        task_name: taskData.task_name || "",
        description: taskData.description || "",
        task_type: taskData.task_type || "Activity",
        start_date: taskData.start_date || "",
        end_date: taskData.end_date || "",
        status: taskData.status || "todo",
        progress: taskData.progress || 0,
        priority: taskData.priority || "medium",
        order_index: taskData.order_index || 0,
      });
    }
  }, [taskData]);

  const validateForm = () => {
    const newErrors = [];

    if (!formData.task_name.trim()) {
      newErrors.push("Task name is required");
    } else if (formData.task_name.length > 200) {
      newErrors.push("Task name must be less than 200 characters");
    }

    if (!formData.start_date) {
      newErrors.push("Start date is required");
    }

    if (!formData.end_date) {
      newErrors.push("End date is required");
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) {
        newErrors.push("End date must be after start date");
      }
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.push("Progress must be between 0 and 100");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "progress" || name === "order_index" ? parseFloat(value) : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <div className="form-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-item">
              {error}
            </div>
          ))}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="task_name">Task Name *</label>
        <input
          type="text"
          id="task_name"
          name="task_name"
          value={formData.task_name}
          onChange={handleChange}
          placeholder="Enter task name"
          maxLength="200"
        />
        <span className="char-count">
          {formData.task_name.length}/200
        </span>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter task description"
          rows="3"
        ></textarea>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="task_type">Task Type</label>
          <select
            id="task_type"
            name="task_type"
            value={formData.task_type}
            onChange={handleChange}
          >
            <option value="Activity">Activity</option>
            <option value="Milestone">Milestone</option>
            <option value="Phase">Phase</option>
            <option value="Deliverable">Deliverable</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start_date">Start Date *</label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="end_date">End Date *</label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="progress">
            Progress: {formData.progress}%
          </label>
          <input
            type="range"
            id="progress"
            name="progress"
            min="0"
            max="100"
            step="5"
            value={formData.progress}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="order_index">Order Index</label>
        <input
          type="number"
          id="order_index"
          name="order_index"
          value={formData.order_index}
          onChange={handleChange}
          min="0"
        />
        <small>Used for sorting tasks in the default order</small>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {taskData ? "Update Task" : "Create Task"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
