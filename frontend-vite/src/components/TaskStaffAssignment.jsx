/**
 * Task Staff Assignment Component
 * Handles assigning and managing staff for individual project tasks
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/TaskStaffAssignment.css";

const TaskStaffAssignment = ({
  projectId,
  taskId,
  onSuccess,
  onCancel,
}) => {
  const [availableStaff, setAvailableStaff] = useState([]);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchStaffAndAssignments();
  }, [projectId, taskId]);

  const fetchStaffAndAssignments = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch task details with assignments
      const taskResponse = await axios.get(
        `/api/projects/${projectId}/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Fetch all staff
      const staffResponse = await axios.get("/api/staff", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const allStaff = staffResponse.data.data || [];
      const assignedStaffIds = (taskResponse.data.data.staff_assignments || [])
        .filter((a) => !a.removed_on)
        .map((a) => a.staff_id);

      const assigned = allStaff.filter((s) => assignedStaffIds.includes(s.id));
      const available = allStaff.filter((s) => !assignedStaffIds.includes(s.id));

      setAvailableStaff(available);
      setAssignedStaff(assigned);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  const assignStaffToTask = async (staffId) => {
    try {
      const staff = availableStaff.find((s) => s.id === staffId);

      await axios.post(
        `/api/projects/${projectId}/tasks/${taskId}/assign-staff`,
        { staff_id: staffId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSuccessMessage(`${staff.first_name} ${staff.last_name} assigned successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);

      fetchStaffAndAssignments();
    } catch (err) {
      console.error("Error assigning staff:", err);
      setError(err.response?.data?.message || "Failed to assign staff");
    }
  };

  const removeStaffFromTask = async (staffId) => {
    try {
      const staff = assignedStaff.find((s) => s.id === staffId);

      await axios.post(
        `/api/projects/${projectId}/tasks/${taskId}/unassign-staff`,
        { staff_id: staffId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSuccessMessage(`${staff.first_name} ${staff.last_name} removed successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);

      fetchStaffAndAssignments();
    } catch (err) {
      console.error("Error removing staff:", err);
      setError(err.response?.data?.message || "Failed to remove staff");
    }
  };

  const filteredAvailable = availableStaff.filter(
    (s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="task-staff-assignment">Loading...</div>;
  }

  return (
    <div className="task-staff-assignment">
      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="assignment-content">
        {/* Available Staff */}
        <div className="staff-section">
          <h3>Available Staff</h3>

          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="staff-list">
            {filteredAvailable.length === 0 ? (
              <p className="no-data">
                {availableStaff.length === 0
                  ? "All staff are already assigned"
                  : "No staff found"}
              </p>
            ) : (
              filteredAvailable.map((staff) => (
                <div key={staff.id} className="staff-row available">
                  <div className="staff-info">
                    <div className="staff-name">
                      {staff.first_name} {staff.last_name}
                    </div>
                    <div className="staff-role">{staff.role}</div>
                  </div>
                  <button
                    className="btn btn-assign"
                    onClick={() => assignStaffToTask(staff.id)}
                    title="Assign to task"
                  >
                    +
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Staff */}
        <div className="staff-section">
          <h3>Assigned Staff ({assignedStaff.length})</h3>

          <div className="staff-list">
            {assignedStaff.length === 0 ? (
              <p className="no-data">No staff assigned to this task</p>
            ) : (
              assignedStaff.map((staff) => (
                <div key={staff.id} className="staff-row assigned">
                  <div className="staff-info">
                    <div className="staff-name">
                      {staff.first_name} {staff.last_name}
                    </div>
                    <div className="staff-role">{staff.role}</div>
                  </div>
                  <button
                    className="btn btn-remove"
                    onClick={() => removeStaffFromTask(staff.id)}
                    title="Remove from task"
                  >
                    -
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={onSuccess}>
          Done
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TaskStaffAssignment;
