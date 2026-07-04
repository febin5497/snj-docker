import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import FormModal from "../../components/FormModal"
import { FaTruck, FaPlus, FaSearch, FaTrash, FaTimes, FaHistory, FaChevronDown, FaUser, FaMapPin } from "react-icons/fa"
export default function VehicleAllocationPage() {
    const { showSuccess, showError } = useToast()
    const [vehicles, setVehicles] = useState([])
    const [projects, setProjects] = useState([])
    const [staff, setStaff] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedVehicle, setSelectedVehicle] = useState(null)
    const [activeTab, setActiveTab] = useState("project") // "project" or "driver"
    const [isLoading, setIsLoading] = useState(false)
    const [assignments, setAssignments] = useState([])
    const [showAssignForm, setShowAssignForm] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [assignmentHistory, setAssignmentHistory] = useState([])
    const [expandedVehicle, setExpandedVehicle] = useState(null)
    // Form state
    const [formData, setFormData] = useState({
        project_id: "",
        driver_id: "",
        notes: ""
    })
    useEffect(() => {
        fetchData()
    }, [])
    const fetchData = async () => {
        try {
            setIsLoading(true)
            const [vehiclesRes, projectsRes, staffRes] = await Promise.all([
                api.get("/api/vehicles"),
                api.get("/api/projects"),
                api.get("/api/staff")
            ])
            setVehicles(Array.isArray(vehiclesRes.data?.data) ? vehiclesRes.data.data : [])
            setProjects(Array.isArray(projectsRes.data?.data) ? projectsRes.data.data : [])
            setStaff(Array.isArray(staffRes.data?.data) ? staffRes.data.data : [])
        } catch (err) {
            showError("Failed to load data")
        } finally {
            setIsLoading(false)
        }
    }
    const fetchAssignments = async (vehicleId, tab) => {
        try {
            if (tab === "project") {
                const res = await api.get(`/api/vehicles/${vehicleId}/projects/active`)
                setAssignments(Array.isArray(res.data?.data) ? res.data.data : [])
            } else {
                const res = await api.get(`/api/vehicles/${vehicleId}/driver`)
                if (res.data?.data) {
                    setAssignments(res.data.data ? [res.data.data.assignment] : [])
                }
            }
        } catch (err) {
            showError("Failed to load assignments")
        }
    }
    const fetchHistory = async (vehicleId, tab) => {
        try {
            if (tab === "project") {
                const res = await api.get(`/api/vehicles/${vehicleId}/assignment-history`)
                setAssignmentHistory(Array.isArray(res.data?.data) ? res.data.data : [])
            } else {
                const res = await api.get(`/api/vehicles/${vehicleId}/driver-history`)
                setAssignmentHistory(Array.isArray(res.data?.data) ? res.data.data : [])
            }
        } catch (err) {
            showError("Failed to load history")
        }
    }
    const handleSelectVehicle = (vehicle) => {
        setSelectedVehicle(vehicle)
        setExpandedVehicle(vehicle.id)
        setFormData({ project_id: "", driver_id: "", notes: "" })
        setShowAssignForm(false)
        fetchAssignments(vehicle.id, activeTab)
    }
    const handleAssign = async () => {
        if (!selectedVehicle) {
            showError("Please select a vehicle")
            return
        }
        if (activeTab === "project" && !formData.project_id) {
            showError("Please select a project")
            return
        }
        if (activeTab === "driver" && !formData.driver_id) {
            showError("Please select a driver")
            return
        }
        try {
            const endpoint = activeTab === "project"
                ? `/api/vehicles/${selectedVehicle.id}/assign-project`
                : `/api/vehicles/${selectedVehicle.id}/assign-driver`
            const payload = activeTab === "project"
                ? { project_id: parseInt(formData.project_id), notes: formData.notes }
                : { driver_id: parseInt(formData.driver_id), notes: formData.notes }
            await api.post(endpoint, payload)
            showSuccess(`Vehicle assigned to ${activeTab} successfully`)
            setShowAssignForm(false)
            setFormData({ project_id: "", driver_id: "", notes: "" })
            fetchAssignments(selectedVehicle.id, activeTab)
        } catch (err) {
            showError(err.response?.data?.message || `Failed to assign ${activeTab}`)
        }
    }
    const handleUnassign = async (assignmentId, vehicleId) => {
        if (!window.confirm(`Remove this ${activeTab} assignment?`)) return
        try {
            const endpoint = activeTab === "project"
                ? `/api/vehicles/${vehicleId}/unassign-project`
                : `/api/vehicles/${vehicleId}/unassign-driver`
            const payload = activeTab === "project"
                ? { project_id: formData.project_id || assignments[0]?.project_id }
                : {}
            await api.post(endpoint, payload)
            showSuccess(`Vehicle unassigned successfully`)
            fetchAssignments(vehicleId, activeTab)
        } catch (err) {
            showError(err.response?.data?.message || "Failed to unassign")
        }
    }
    const filteredVehicles = vehicles.filter(v =>
        (v.make?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.model?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    const getProjectName = (projectId) => {
        const project = projects.find(p => p.id === projectId)
        return project?.name || `Project ${projectId}`
    }
    const getDriverName = (driverId) => {
        const driver = staff.find(s => s.id === driverId)
        return driver?.name || `Driver ${driverId}`
    }
    const getProjectObject = (projectId) => {
        return projects.find(p => p.id === projectId)
    }
    const getDriverObject = (driverId) => {
        return staff.find(s => s.id === driverId)
    }
    return (
        <div className="vehicle-allocation-container">
            <div className="page-header">
                <h1 className="page-title">
                    <FaTruck className="header-icon" />
                    Vehicle Allocation Management
                </h1>
                <p className="page-subtitle">Manage project and driver assignments for vehicles</p>
            </div>
            {/* Tab Navigation */}
            <div className="tabs-navigation">
                <button
                    className={`tab-btn ${activeTab === "project" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("project")
                        if (selectedVehicle) fetchAssignments(selectedVehicle.id, "project")
                    }}
                >
                    <FaMapPin /> Project Assignment
                </button>
                <button
                    className={`tab-btn ${activeTab === "driver" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("driver")
                        if (selectedVehicle) fetchAssignments(selectedVehicle.id, "driver")
                    }}
                >
                    <FaUser /> Driver Assignment
                </button>
            </div>
            <div className="allocation-content">
                {/* Vehicle List */}
                <div className="vehicle-list-section">
                    <div className="section-header">
                        <h2>Available Vehicles</h2>
                        <div className="search-box">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by make, model, or registration..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>
                    <div className="vehicle-list">
                        {isLoading ? (
                            <div className="loading-state">Loading vehicles...</div>
                        ) : filteredVehicles.length === 0 ? (
                            <div className="empty-state">No vehicles found</div>
                        ) : (
                            filteredVehicles.map(vehicle => (
                                <div
                                    key={vehicle.id}
                                    className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? "selected" : ""}`}
                                    onClick={() => handleSelectVehicle(vehicle)}
                                >
                                    <div className="vehicle-card-header">
                                        <div className="vehicle-info">
                                            <h3 className="vehicle-name">{vehicle.make} {vehicle.model}</h3>
                                            <p className="vehicle-reg">{vehicle.registration_number}</p>
                                        </div>
                                        <span className={`vehicle-status ${vehicle.status?.toLowerCase() || "unknown"}`}>
                                            {vehicle.status || "Unknown"}
                                        </span>
                                    </div>
                                    <div className="vehicle-details">
                                        <small>Year: {vehicle.year} | Type: {vehicle.type}</small>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                {/* Assignment Management */}
                {selectedVehicle && (
                    <div className="assignment-section">
                        <div className="assignment-header">
                            <h2>
                                {activeTab === "project" ? "Project" : "Driver"} Assignments
                            </h2>
                            <div className="assignment-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowAssignForm(!showAssignForm)}
                                >
                                    <FaPlus /> Add Assignment
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowHistory(!showHistory)
                                        if (!showHistory) fetchHistory(selectedVehicle.id, activeTab)
                                    }}
                                >
                                    <FaHistory /> View History
                                </button>
                            </div>
                        </div>
                        {/* Assignment Form */}
                        {showAssignForm && (
                            <div className="assignment-form-container">
                                <div className="form-group">
                                    {activeTab === "project" ? (
                                        <>
                                            <label>Select Project *</label>
                                            <select
                                                value={formData.project_id}
                                                onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                                                className="form-input"
                                            >
                                                <option value="">-- Choose a project --</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} ({p.location})
                                                    </option>
                                                ))}
                                            </select>
                                        </>
                                    ) : (
                                        <>
                                            <label>Select Driver *</label>
                                            <select
                                                value={formData.driver_id}
                                                onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                                                className="form-input"
                                            >
                                                <option value="">-- Choose a driver --</option>
                                                {staff.filter(s => s.role?.toLowerCase().includes("driver")).map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name} ({s.phone})
                                                    </option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Notes (Optional)</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        placeholder="Add any notes about this assignment..."
                                        className="form-textarea"
                                        rows="3"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button className="btn btn-success" onClick={handleAssign}>
                                        Assign
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setShowAssignForm(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Current Assignments */}
                        <div className="assignments-list">
                            <h3>Current Assignments</h3>
                            {assignments.length === 0 ? (
                                <div className="empty-state-small">
                                    No {activeTab} assignments for this vehicle
                                </div>
                            ) : (
                                assignments.map((assignment, idx) => {
                                    const targetId = activeTab === "project" ? assignment.project_id : assignment.driver_id
                                    const targetName = activeTab === "project"
                                        ? getProjectName(targetId)
                                        : getDriverName(targetId)
                                    return (
                                        <div key={idx} className="assignment-item">
                                            <div className="assignment-info">
                                                <p className="assignment-title">
                                                    {activeTab === "project" ? "📍" : "👤"} {targetName}
                                                </p>
                                                <p className="assignment-date">
                                                    Assigned: {new Date(assignment.assigned_on || assignment.assigned_date).toLocaleDateString()}
                                                </p>
                                                {assignment.notes && (
                                                    <p className="assignment-notes">{assignment.notes}</p>
                                                )}
                                            </div>
                                            <button
                                                className="btn btn-small btn-danger"
                                                onClick={() => handleUnassign(assignment.id, selectedVehicle.id)}
                                            >
                                                <FaTrash /> Remove
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        {/* History */}
                        {showHistory && (
                            <div className="history-section">
                                <h3>Assignment History</h3>
                                {assignmentHistory.length === 0 ? (
                                    <div className="empty-state-small">No history available</div>
                                ) : (
                                    <div className="history-list">
                                        {assignmentHistory.map((record, idx) => {
                                            const targetId = activeTab === "project" ? record.project_id : record.driver_id
                                            const targetName = activeTab === "project"
                                                ? getProjectName(targetId)
                                                : getDriverName(targetId)
                                            const isUnassigned = activeTab === "project"
                                                ? record.unassigned_date
                                                : record.assignment?.unassigned_date
                                            return (
                                                <div key={idx} className="history-item">
                                                    <div className="history-date">
                                                        <strong>
                                                            {new Date(record.assigned_date || record.assignment?.assigned_date).toLocaleDateString()}
                                                        </strong>
                                                    </div>
                                                    <div className="history-status">
                                                        {isUnassigned ? "Unassigned" : "Active"}
                                                    </div>
                                                    <div className="history-target">
                                                        {targetName}
                                                    </div>
                                                    {isUnassigned && (
                                                        <div className="history-unassign-date">
                                                            Until: {new Date(isUnassigned).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {!selectedVehicle && (
                    <div className="empty-state-large">
                        <FaTruck size={48} />
                        <p>Select a vehicle to manage assignments</p>
                    </div>
                )}
            </div>
            <style>{`
                .vehicle-allocation-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .page-header {
                    margin-bottom: 30px;
                }
                .page-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 28px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 5px;
                }
                .header-icon {
                    color: var(--color-primary);
                }
                .page-subtitle {
                    color: var(--text-secondary);
                    font-size: 14px;
                }
                .tabs-navigation {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 25px;
                    border-bottom: 2px solid var(--border-color);
                }
                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    border-bottom: 3px solid transparent;
                    margin-bottom: -2px;
                    transition: all 0.3s ease;
                }
                .tab-btn:hover {
                    color: var(--color-primary);
                }
                .tab-btn.active {
                    color: var(--color-primary);
                    border-bottom-color: var(--color-primary);
                }
                .allocation-content {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 25px;
                }
                @media (max-width: 1024px) {
                    .allocation-content {
                        grid-template-columns: 1fr;
                    }
                }
                .vehicle-list-section {
                    background: var(--bg-secondary);
                    border-radius: 10px;
                    padding: 20px;
                    height: fit-content;
                }
                .section-header {
                    margin-bottom: 20px;
                }
                .section-header h2 {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 12px;
                }
                .search-box {
                    position: relative;
                }
                .search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                }
                .search-input {
                    width: 100%;
                    padding: 10px 12px 10px 36px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 13px;
                    color: var(--text-primary);
                }
                .search-input::placeholder {
                    color: var(--text-tertiary);
                }
                .vehicle-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-height: 600px;
                    overflow-y: auto;
                }
                .vehicle-card {
                    padding: 12px;
                    border: 2px solid var(--border-color);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: var(--bg-primary);
                }
                .vehicle-card:hover {
                    border-color: var(--color-primary);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .vehicle-card.selected {
                    border-color: var(--color-primary);
                    background: var(--color-primary-light);
                }
                .vehicle-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 8px;
                }
                .vehicle-info h3 {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }
                .vehicle-reg {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin: 2px 0 0 0;
                }
                .vehicle-status {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .vehicle-status.active {
                    background: var(--success-light);
                    color: var(--color-success);
                }
                .vehicle-status.maintenance {
                    background: var(--warning-light);
                    color: var(--color-warning);
                }
                .vehicle-details {
                    font-size: 12px;
                    color: var(--text-tertiary);
                }
                .loading-state, .empty-state, .empty-state-small, .empty-state-large {
                    padding: 20px;
                    text-align: center;
                    color: var(--text-secondary);
                    font-size: 14px;
                }
                .empty-state-large {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    min-height: 300px;
                    color: var(--text-tertiary);
                }
                .assignment-section {
                    background: var(--bg-secondary);
                    border-radius: 10px;
                    padding: 20px;
                }
                .assignment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .assignment-header h2 {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }
                .assignment-actions {
                    display: flex;
                    gap: 10px;
                }
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                }
                .btn-primary {
                    background: var(--color-primary);
                    color: white;
                }
                .btn-primary:hover {
                    background: var(--color-primary-dark);
                }
                .btn-secondary {
                    background: var(--border-color);
                    color: var(--text-primary);
                }
                .btn-secondary:hover {
                    background: var(--text-secondary);
                    color: white;
                }
                .btn-success {
                    background: var(--color-success);
                    color: white;
                }
                .btn-success:hover {
                    opacity: 0.9;
                }
                .btn-danger {
                    background: var(--color-danger);
                    color: white;
                }
                .btn-danger:hover {
                    opacity: 0.9;
                }
                .btn-outline {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }
                .btn-outline:hover {
                    background: var(--border-color);
                }
                .btn-small {
                    padding: 6px 12px;
                    font-size: 12px;
                }
                .assignment-form-container {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 6px;
                }
                .form-input, .form-textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 13px;
                    color: var(--text-primary);
                    font-family: inherit;
                }
                .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 3px var(--color-primary-light);
                }
                .form-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }
                .assignments-list {
                    margin-bottom: 20px;
                }
                .assignments-list h3 {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 12px;
                }
                .assignment-item {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    padding: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .assignment-info {
                    flex: 1;
                }
                .assignment-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }
                .assignment-date {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin: 4px 0 0 0;
                }
                .assignment-notes {
                    font-size: 12px;
                    color: var(--text-tertiary);
                    margin: 4px 0 0 0;
                    font-style: italic;
                }
                .empty-state-small {
                    padding: 15px;
                    text-align: center;
                    color: var(--text-secondary);
                    font-size: 13px;
                    background: var(--bg-primary);
                    border-radius: 6px;
                }
                .history-section {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 20px;
                }
                .history-section h3 {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 12px 0;
                }
                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .history-item {
                    display: grid;
                    grid-template-columns: auto auto 1fr auto;
                    gap: 12px;
                    align-items: center;
                    padding: 10px;
                    background: var(--bg-secondary);
                    border-radius: 4px;
                    font-size: 12px;
                }
                .history-date {
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .history-status {
                    padding: 2px 6px;
                    background: var(--success-light);
                    color: var(--color-success);
                    border-radius: 3px;
                    font-weight: 500;
                    font-size: 11px;
                }
                .history-target {
                    color: var(--text-secondary);
                }
                .history-unassign-date {
                    color: var(--text-tertiary);
                }
                @media (max-width: 768px) {
                    .vehicle-allocation-container {
                        padding: 12px;
                    }
                    .allocation-content {
                        grid-template-columns: 1fr;
                    }
                    .assignment-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .assignment-actions {
                        width: 100%;
                    }
                    .assignment-actions .btn {
                        flex: 1;
                        justify-content: center;
                    }
                    .tabs-navigation {
                        overflow-x: auto;
                    }
                    .tab-btn {
                        white-space: nowrap;
                    }
                }
            `}</style>
        </div>
    )
}
