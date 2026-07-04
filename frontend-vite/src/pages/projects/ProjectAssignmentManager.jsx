import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useLocation } from "react-router-dom";
import "../../styles/ProjectAssignmentManager.css";
import StaffAssignmentHistory from "../../components/StaffAssignmentHistory";
const ProjectAssignmentManager = () => {
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignedSearchTerm, setAssignedSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState(new Set());
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverPanel, setDragOverPanel] = useState(null);
  const getInitials = (firstName, lastName) => {
    return `${(firstName || 'U')[0]}${(lastName || 'S')[0]}`.toUpperCase();
  };
  const groupByRole = (staffList) => {
    const groups = {};
    staffList.forEach(s => {
      const role = s.role || 'Unassigned';
      if (!groups[role]) groups[role] = [];
      groups[role].push(s);
    });
    return groups;
  };
  useEffect(() => {
    setSearchTerm("");
    setAssignedSearchTerm("");
    setFilterDepartment("all");
    setSelectedProject(null);
    setSelectedStaffIds(new Set());
  }, [location.pathname]);
  useEffect(() => {
    return () => {
      setSearchTerm("");
      setAssignedSearchTerm("");
      setFilterDepartment("all");
      setSelectedProject(null);
      setSelectedStaffIds(new Set());
    };
  }, []);
  useEffect(() => {
    fetchProjects();
  }, []);
  useEffect(() => {
    if (selectedProject) {
      fetchStaffAndAssignments();
      setSelectedStaffIds(new Set());
      setAssignedSearchTerm("");
    }
  }, [selectedProject, filterDepartment, searchTerm]);
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/projects");
      setProjects(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedProject(response.data.data[0]);
      }
    } catch (err) {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };
  const fetchStaffAndAssignments = async () => {
    try {
      setLoading(true);
      setError("");
      const staffResponse = await api.get("/api/staff");
      const allStaff = staffResponse.data.data || [];
      const depts = ["all", ...new Set(allStaff.map(s => s.department).filter(Boolean))];
      setDepartments(depts);
      let assignedStaffIds = [];
      try {
        const assignmentsResponse = await api.get(
          `/api/projects/${selectedProject.id}/staff`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        const staffArray = assignmentsResponse.data.data || [];
        assignedStaffIds = Array.isArray(staffArray)
          ? staffArray.map(s => s.staff_id || s.id).filter(Boolean)
          : [];
      } catch (err) {
        assignedStaffIds = [];
      }
      let filtered = allStaff;
      if (searchTerm) {
        filtered = filtered.filter(
          (s) =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (filterDepartment !== "all") {
        filtered = filtered.filter((s) => s.department === filterDepartment);
      }
      const assigned = allStaff.filter((s) => assignedStaffIds.includes(s.id));
      const available = filtered.filter((s) => !assignedStaffIds.includes(s.id));
      setAssignedStaff(assigned);
      setAvailableStaff(available);
    } catch (err) {
      setError("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };
  const assignStaff = async (staffId) => {
    try {
      await api.post(`/api/projects/${selectedProject.id}/assign-staff`, { staff_id: staffId });
      setSuccessMessage("Staff assigned successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchStaffAndAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign staff");
    }
  };
  const unassignStaff = async (staffId) => {
    try {
      await api.post(`/api/projects/${selectedProject.id}/unassign-staff`, { staff_id: staffId });
      setSuccessMessage("Staff unassigned successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchStaffAndAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unassign staff");
    }
  };
  const reassignStaff = async (staffId, toProjectId) => {
    try {
      await api.post(`/api/projects/${selectedProject.id}/unassign-staff`, { staff_id: staffId });
      await api.post(`/api/projects/${toProjectId}/assign-staff`, { staff_id: staffId });
      setSuccessMessage("Staff reassigned successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchStaffAndAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reassign staff");
    }
  };
  const handleDragStart = (e, staffId) => {
    if (e.target.type === 'checkbox') return;
    e.dataTransfer.setData('text/plain', staffId.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(staffId);
  };
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverPanel(null);
  };
  const handleDragOver = (e, panel) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPanel(panel);
  };
  const handleDragLeave = () => {
    setDragOverPanel(null);
  };
  const handleDropOnAssigned = (e) => {
    e.preventDefault();
    const staffId = parseInt(e.dataTransfer.getData('text/plain'));
    if (staffId && !assignedStaff.find(s => s.id === staffId)) {
      assignStaff(staffId);
    }
    setDraggedItem(null);
    setDragOverPanel(null);
  };
  const handleDropOnAvailable = (e) => {
    e.preventDefault();
    const staffId = parseInt(e.dataTransfer.getData('text/plain'));
    if (staffId) {
      unassignStaff(staffId);
    }
    setDraggedItem(null);
    setDragOverPanel(null);
  };
  const toggleSelectStaff = (staffId) => {
    setSelectedStaffIds(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };
  const assignSelected = async () => {
    const ids = [...selectedStaffIds];
    setBulkAssigning(true);
    let count = 0;
    for (const staffId of ids) {
      try {
        await api.post(`/api/projects/${selectedProject.id}/assign-staff`, { staff_id: staffId });
        count++;
      } catch (err) {
        // continue
      }
    }
    setSuccessMessage(`Assigned ${count} staff member(s)`);
    setTimeout(() => setSuccessMessage(""), 3000);
    setSelectedStaffIds(new Set());
    setBulkAssigning(false);
    fetchStaffAndAssignments();
  };
  const renderGroupedStaff = (staffList, panel, renderActions) => {
    const groups = groupByRole(staffList);
    const roleOrder = Object.keys(groups).sort();
    if (roleOrder.length === 0) return null;
    return roleOrder.map(role => (
      <div key={role} className="staff-group">
        <div className="staff-group-header">
          <span className="staff-group-role">{role}</span>
          <span className="staff-group-count">{groups[role].length}</span>
        </div>
        {groups[role].map(staff => (
          <div
            key={staff.id}
            className={`staff-item ${panel} ${draggedItem === staff.id ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, staff.id)}
            onDragEnd={handleDragEnd}
          >
            {panel === 'available' && (
              <input
                type="checkbox"
                className="staff-checkbox"
                checked={selectedStaffIds.has(staff.id)}
                onChange={() => toggleSelectStaff(staff.id)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="staff-avatar">
              {getInitials(staff.first_name, staff.last_name)}
            </div>
            <div className="staff-info">
              <div className="staff-name">
                {staff.first_name} {staff.last_name}
              </div>
              <div className="staff-details">
                <span className="role">{staff.role}</span>
                <span className="department">{staff.department}</span>
              </div>
            </div>
            <div className="staff-actions" onClick={(e) => e.stopPropagation()}>
              {renderActions(staff)}
            </div>
          </div>
        ))}
      </div>
    ));
  };
  if (loading && projects.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  const filteredAssigned = assignedStaff.filter(s => {
    if (!assignedSearchTerm) return true;
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return name.includes(assignedSearchTerm.toLowerCase());
  });
  return (
    <div className="project-assignment-container theme-blue-white">
      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      <div className="assignment-layout">
        {/* Left sidebar: projects + details + filters */}
        <div className="project-panel">
          <h2>Projects</h2>
          <div className="project-list">
            {projects.length === 0 ? (
              <p className="no-data">No projects found</p>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className={`project-item ${selectedProject?.id === project.id ? "active" : ""}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="project-name">{project.name || project.project_name}</div>
                  <div className="project-status">{project.status}</div>
                </div>
              ))
            )}
          </div>
          {selectedProject && (
            <>
              <div className="sidebar-divider" />
              <div className="project-quick-info">
                <div className="quick-info-row">
                  <span className="quick-info-label">Status</span>
                  <span className="quick-info-value">{selectedProject.status}</span>
                </div>
                <div className="quick-info-row">
                  <span className="quick-info-label">Start</span>
                  <span className="quick-info-value">{selectedProject.start_date}</span>
                </div>
                <div className="quick-info-row">
                  <span className="quick-info-label">End</span>
                  <span className="quick-info-value">{selectedProject.end_date}</span>
                </div>
                <div className="quick-info-row">
                  <span className="quick-info-label">Assigned</span>
                  <span className="badge">{assignedStaff.length}</span>
                </div>
              </div>
              <div className="sidebar-divider" />
              <div className="sidebar-filters">
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="sidebar-search"
                />
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="sidebar-select"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === "all" ? "All Departments" : dept}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        {/* Available Staff */}
        {selectedProject && (
          <div
            className={`staff-panel ${dragOverPanel === 'available' ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'available')}
            onDragLeave={handleDragLeave}
            onDrop={handleDropOnAvailable}
          >
            <div className="staff-panel-header">
              <h3>Available</h3>
              <span className="staff-count">{availableStaff.length}</span>
            </div>
            {selectedStaffIds.size > 0 && (
              <button
                className="btn btn-bulk-assign"
                onClick={assignSelected}
                disabled={bulkAssigning}
              >
                {bulkAssigning ? 'Assigning...' : `Assign ${selectedStaffIds.size} Selected`}
              </button>
            )}
            <div className="staff-list">
              {availableStaff.length === 0 ? (
                <p className="no-data">No available staff</p>
              ) : (
                renderGroupedStaff(availableStaff, 'available', (staff) => (
                  <button
                    className="btn btn-assign"
                    onClick={() => assignStaff(staff.id)}
                    title="Assign to project"
                  >+</button>
                ))
              )}
            </div>
          </div>
        )}
        {/* Assigned Staff */}
        {selectedProject && (
          <div
            className={`staff-panel assigned ${dragOverPanel === 'assigned' ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'assigned')}
            onDragLeave={handleDragLeave}
            onDrop={handleDropOnAssigned}
          >
            <div className="staff-panel-header">
              <h3>Assigned</h3>
              <span className="staff-count">{assignedStaff.length}</span>
            </div>
            <input
              type="text"
              placeholder="Search assigned staff..."
              value={assignedSearchTerm}
              onChange={(e) => setAssignedSearchTerm(e.target.value)}
              className="sidebar-search assigned-search"
            />
            <div className="staff-list">
              {filteredAssigned.length === 0 ? (
                <p className="no-data">No staff assigned</p>
              ) : (
                renderGroupedStaff(filteredAssigned, 'assigned', (staff) => (
                  <>
                    <button
                      className="btn btn-unassign"
                      onClick={() => unassignStaff(staff.id)}
                      title="Remove from project"
                    >-</button>
                    {projects.length > 1 && (
                      <select
                        className="reassign-select"
                        onChange={(e) => {
                          if (e.target.value) {
                            reassignStaff(staff.id, parseInt(e.target.value));
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Move to...</option>
                        {projects
                          .filter((p) => p.id !== selectedProject.id)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name || p.project_name}
                            </option>
                          ))}
                      </select>
                    )}
                  </>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {selectedProject && (
        <StaffAssignmentHistory
          projectId={selectedProject.id}
          projectName={selectedProject.name || selectedProject.project_name}
        />
      )}
    </div>
  );
};
export default ProjectAssignmentManager;
