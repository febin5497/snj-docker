import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import { Plus, Edit2, Trash2 } from "lucide-react"
import "../../styles/Roles.css"
export default function Roles() {
    const { showSuccess, showError } = useToast()
    const [roles, setRoles] = useState([])
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedRole, setSelectedRole] = useState(null)
    const [permissionCategories, setPermissionCategories] = useState({})
    useEffect(() => {
        loadRoles()
        loadPermissions()
    }, [])
    const loadRoles = async () => {
        setLoading(true)
        try {
            const res = await api.get("/api/admin/roles")
            if (res.data.success) {
                const raw = res.data?.data; setRoles(Array.isArray(raw) ? raw : (raw?.items || []))
                if (res.data.data && res.data.data.length > 0) {
                    setSelectedRole(res.data.data[0])
                }
            } else {
                showError(res.data.error || "Failed to load roles")
            }
        } catch (err) {
            showError(err.response?.data?.error || "Error loading roles")
        } finally {
            setLoading(false)
        }
    }
    const loadPermissions = async () => {
        try {
            const res = await api.get("/api/admin/permissions")
            if (res.data.success) {
                const perms = res.data.data || []
                setPermissions(perms)
                // Group permissions by category
                const categories = {}
                perms.forEach(perm => {
                    const category = perm.category || 'Other'
                    if (!categories[category]) {
                        categories[category] = []
                    }
                    categories[category].push(perm)
                })
                setPermissionCategories(categories)
            }
        } catch (err) {
        }
    }
    const handlePermissionChange = async (permissionId, checked) => {
        if (!selectedRole) {
            showError("Please select a role first")
            return
        }
        try {
            if (checked) {
                const res = await api.post(
                    `/api/admin/roles/${selectedRole.id}/permissions`,
                    { permission_id: permissionId }
                )
                if (res.data.success) {
                    // Update selected role with new permission
                    setSelectedRole({
                        ...selectedRole,
                        permissions: [...(selectedRole.permissions || []), { id: permissionId }]
                    })
                    showSuccess("Permission added")
                }
            } else {
                const res = await api.delete(
                    `/api/admin/roles/${selectedRole.id}/permissions/${permissionId}`
                )
                if (res.data.success) {
                    // Remove permission from selected role
                    setSelectedRole({
                        ...selectedRole,
                        permissions: selectedRole.permissions.filter(p => p.id !== permissionId)
                    })
                    showSuccess("Permission removed")
                }
            }
        } catch (err) {
            showError(err.response?.data?.error || "Error updating permissions")
        }
    }
    const isPermissionAssigned = (permissionId) => {
        if (!selectedRole || !selectedRole.permissions) return false
        return selectedRole.permissions.some(p => p.id === permissionId)
    }
    if (loading) {
        return (
            <div className="roles-container">
                <div className="loading">Loading roles...</div>
            </div>
        )
    }
    return (
        <div className="roles-container theme-blue-white">
            {/* Header */}
            <div className="roles-header">
                <div>
                    <h1 className="roles-title" style={{color: '#0052CC'}}>Role & Permission Management</h1>
                    <p className="roles-subtitle">Manage system roles and permissions</p>
                </div>
            </div>
            <div className="roles-content-grid">
                {/* Roles List */}
                <div className="roles-list-card card-blue-white">
                    <div className="card-header">
                        <h2 className="card-title header-blue-white">Roles</h2>
                    </div>
                    {roles.length > 0 ? (
                        <div className="roles-list">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className={`role-item ${selectedRole?.id === role.id ? 'active' : ''}`}
                                    onClick={() => setSelectedRole(role)}
                                >
                                    <div className="role-item-header">
                                        <h3 className="role-name">{role.name}</h3>
                                        <span className="permission-count">
                                            {role.permissions?.length || 0} permissions
                                        </span>
                                    </div>
                                    {role.description && (
                                        <p className="role-description">{role.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-state">No roles found</p>
                    )}
                </div>
                {/* Permissions Matrix */}
                <div className="permissions-card card-blue-white">
                    <div className="card-header">
                        <h2 className="card-title header-blue-white">
                            {selectedRole ? `${selectedRole.name} - Permissions` : 'Select a role'}
                        </h2>
                    </div>
                    {selectedRole ? (
                        <div className="permissions-grid">
                            {Object.entries(permissionCategories).length > 0 ? (
                                Object.entries(permissionCategories).map(([category, perms]) => (
                                    <div key={category} className="permission-category">
                                        <h3 className="category-title">{category}</h3>
                                        <div className="permissions-list">
                                            {perms.map((permission) => (
                                                <div key={permission.id} className="permission-item">
                                                    <label className="permission-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={isPermissionAssigned(permission.id)}
                                                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                                            disabled={selectedRole.name === 'Super Admin'}
                                                        />
                                                        <span className="checkbox-visual"></span>
                                                        <span className="permission-name">{permission.name}</span>
                                                    </label>
                                                    {permission.description && (
                                                        <p className="permission-description">{permission.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">No permissions defined</p>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>Select a role to view and manage permissions</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
