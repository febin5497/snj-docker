import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import { Edit2, Trash2, Plus, Search, MoreVertical, Lock } from "lucide-react"
import "../../styles/Users.css"
export default function Users() {
    const { showSuccess, showError } = useToast()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [availableRoles, setAvailableRoles] = useState([])
    const [confirmDelete, setConfirmDelete] = useState(null)
    // Pagination & Search
    const [currentPage, setCurrentPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")
    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    })
    const [roleFormData, setRoleFormData] = useState({
        role_id: ""
    })
    useEffect(() => {
        loadUsers()
        loadAvailableRoles()
    }, [currentPage, searchQuery])
    const loadUsers = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: currentPage,
                per_page: perPage,
                ...(searchQuery && { search: searchQuery })
            })
            const res = await api.get(`/api/admin/users?${params}`)
            if (res.data.success) {
                const raw = res.data?.data; setUsers(Array.isArray(raw) ? raw : (raw?.items || []))
                setTotalPages(res.data.pagination.pages || 1)
            } else {
                showError(res.data.error || "Failed to load users")
            }
        } catch (err) {
            showError(err.response?.data?.error || "Error loading users")
        } finally {
            setLoading(false)
        }
    }
    const loadAvailableRoles = async () => {
        try {
            const res = await api.get("/api/admin/roles")
            if (res.data.success) {
                const raw2 = res.data?.data; setAvailableRoles(Array.isArray(raw2) ? raw2 : (raw2?.items || []))
            }
        } catch (err) {
        }
    }
    const handleAddClick = () => {
        setIsEditing(false)
        setSelectedUser(null)
        setFormData({
            name: "",
            email: "",
            password: ""
        })
        setShowModal(true)
    }
    const handleEditClick = (user) => {
        setIsEditing(true)
        setSelectedUser(user)
        setFormData({
            name: user.name,
            email: user.email,
            password: ""
        })
        setShowModal(true)
    }
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name || !formData.email) {
            showError("Name and email are required")
            return
        }
        if (!isEditing && !formData.password) {
            showError("Password is required for new users")
            return
        }
        try {
            if (isEditing) {
                const res = await api.put(`/api/admin/users/${selectedUser.id}`, {
                    name: formData.name,
                    email: formData.email,
                    ...(formData.password && { password: formData.password })
                })
                if (res.data.success) {
                    showSuccess("User updated successfully")
                    loadUsers()
                    setShowModal(false)
                }
            } else {
                const res = await api.post("/api/admin/users", formData)
                if (res.data.success) {
                    showSuccess("User created successfully")
                    loadUsers()
                    setShowModal(false)
                }
            }
        } catch (err) {
            showError(err.response?.data?.error || "Error saving user")
        }
    }
    const handleDeleteClick = async () => {
        if (!confirmDelete) return
        try {
            const res = await api.delete(`/api/admin/users/${confirmDelete}`)
            if (res.data.success) {
                showSuccess("User deleted successfully")
                loadUsers()
                setConfirmDelete(null)
            }
        } catch (err) {
            showError(err.response?.data?.error || "Error deleting user")
        }
    }
    const handleAssignRole = async () => {
        if (!roleFormData.role_id || !selectedUser) {
            showError("Please select a role")
            return
        }
        try {
            const res = await api.post(
                `/api/admin/users/${selectedUser.id}/roles`,
                { role_id: parseInt(roleFormData.role_id) }
            )
            if (res.data.success) {
                showSuccess("Role assigned successfully")
                loadUsers()
                setShowRoleModal(false)
                setRoleFormData({ role_id: "" })
            }
        } catch (err) {
            showError(err.response?.data?.error || "Error assigning role")
        }
    }
    const handleRemoveRole = async (userId, roleId) => {
        try {
            const res = await api.delete(`/api/admin/users/${userId}/roles/${roleId}`)
            if (res.data.success) {
                showSuccess("Role removed successfully")
                loadUsers()
            }
        } catch (err) {
            showError(err.response?.data?.error || "Error removing role")
        }
    }
    return (
        <div className="users-container theme-blue-white">
            {/* Header */}
            <div className="users-header">
                <div>
                    <h1 className="users-title" style={{color: '#0052CC'}}>User Management</h1>
                    <p className="users-subtitle">Manage all system users</p>
                </div>
                <button onClick={handleAddClick} className="btn-blue-white">
                    <Plus size={18} />
                    <span>Add User</span>
                </button>
            </div>
                <>
                    {/* Search Bar */}
                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="search-input"
                        />
                    </div>
            {/* Users Table */}
            <div className="users-card">
                {loading ? (
                    <div className="loading">Loading users...</div>
                ) : users.length > 0 ? (
                    <>
                        <div className="table-wrapper">
                            <table className="users-table">
                                <thead>
                                    <tr className="table-header-blue-white">
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Roles</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="table-row-blue-white">
                                            <td className="user-name">{user.name}</td>
                                            <td className="user-email">{user.email}</td>
                                            <td className="user-roles">
                                                <div className="roles-list">
                                                    {user.roles && user.roles.length > 0 ? (
                                                        user.roles.map((role) => (
                                                            <span key={role.id} className="role-badge">
                                                                {role.name}
                                                                <button
                                                                    className="role-remove"
                                                                    onClick={() => handleRemoveRole(user.id, role.id)}
                                                                    title="Remove role"
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="no-roles">No roles</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="user-status">
                                                <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="user-joined">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="user-actions">
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleEditClick(user)}
                                                    title="Edit user"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="action-btn role-btn"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setShowRoleModal(true)
                                                    }}
                                                    title="Assign role"
                                                >
                                                    <Lock size={16} />
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => setConfirmDelete(user.id)}
                                                    title="Delete user"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                    </>
                ) : (
                    <div className="empty-state">
                        <p>No users found</p>
                    </div>
                )}
            </div>
                </>
            )
            {/* Add/Edit User Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{isEditing ? 'Edit User' : 'Add New User'}</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Full name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="Email address"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password {!isEditing ? '*' : '(Leave blank to keep current)'}</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="Password"
                                    required={!isEditing}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-blue-white">
                                    {isEditing ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Assign Role Modal */}
            {showRoleModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Assign Role to {selectedUser.name}</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowRoleModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            handleAssignRole()
                        }} className="modal-form">
                            <div className="form-group">
                                <label>Select Role *</label>
                                <select
                                    value={roleFormData.role_id}
                                    onChange={(e) => setRoleFormData({role_id: e.target.value})}
                                    required
                                >
                                    <option value="">-- Choose a role --</option>
                                    {availableRoles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-blue-white">
                                    Assign Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Delete</h2>
                        </div>
                        <p className="modal-body">Are you sure you want to delete this user? This action cannot be undone.</p>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteClick}>
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
