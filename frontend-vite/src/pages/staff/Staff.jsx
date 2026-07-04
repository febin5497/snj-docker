import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import { Trash2, Edit2, Plus, Eye, Search, Filter } from "lucide-react"
export default function Staff() {
    const { showSuccess, showError } = useToast()
    const [staff, setStaff] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [selectedStaff, setSelectedStaff] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalStaff, setTotalStaff] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [availableRoles, setAvailableRoles] = useState([])
    const [projects, setProjects] = useState([])
    const [formData, setFormData] = useState({
        name: "", role: "", phone: "", email: "", joining_date: "",
        salary: "", pf: "", esi: "", photo: "", needs_user_access: true,
        username: "", project_ids: []
    })
    const [formErrors, setFormErrors] = useState([])
    useEffect(() => { setCurrentPage(1); loadStaff(); loadProjects() }, [])
    useEffect(() => { loadStaff() }, [currentPage, perPage, searchQuery, roleFilter])
    const PREDEFINED_ROLES = [
        "Site Engineer", "Site Supervisor", "Foreman", "Laborer", "Electrician",
        "Plumber", "Mason", "Carpenter", "Driver", "Equipment Operator",
        "Project Manager", "Accountant", "Admin"
    ]
    useEffect(() => {
        const roles = [...new Set(staff.map(s => s.role))]
        setAvailableRoles(roles.sort())
    }, [staff])
    const loadStaff = async () => {
        setLoading(true); setError(null)
        try {
            const params = new URLSearchParams({
                page: currentPage, per_page: perPage,
                ...(searchQuery && { search: searchQuery }),
                ...(roleFilter && { role: roleFilter })
            })
            const res = await api.get(`/api/staff?${params}`)
            const raw = res.data?.data ?? res.data ?? []
            const staffData = Array.isArray(raw) ? raw : (raw.items || [])
            const pagination = res.data?.data?.pagination || res.data?.pagination || {}
            setStaff(staffData)
            setCurrentPage(pagination.page || currentPage)
            setTotalPages(pagination.pages || 1)
            setTotalStaff(pagination.total || staffData.length)
        } catch (err) {
            setError(err.response?.data?.error || "Error loading staff"); setStaff([])
        } finally { setLoading(false) }
    }
    const loadProjects = async () => {
        try {
            const res = await api.get("/api/projects")
            const raw = res.data?.data ?? res.data ?? []
            const projectsData = Array.isArray(raw) ? raw : (raw.items || [])
            setProjects(projectsData)
        } catch (err) { setProjects([]) }
    }
    const handleAddClick = () => {
        setIsEditing(false); setSelectedStaff(null)
        setFormData({ name: "", role: "", phone: "", email: "", joining_date: "", salary: "", pf: "", esi: "", photo: "", needs_user_access: true, username: "", project_ids: [] })
        setFormErrors([]); setShowModal(true)
    }
    const handleEditClick = (s) => {
        setIsEditing(true); setSelectedStaff(s)
        setFormData({
            name: s.name || `${s.first_name} ${s.last_name}`, role: s.role || "",
            phone: s.personal_phone || s.phone || "", email: s.personal_email || s.email || "",
            joining_date: s.joining_date || "", salary: s.monthly_salary || s.salary || "",
            pf: s.pf_percentage || s.pf || "", esi: s.esi_percentage || s.esi || "",
            photo: s.photo || "", needs_user_access: s.needs_user_access !== undefined ? s.needs_user_access : true,
            username: s.username || "", project_ids: s.project_assignments?.map(a => a.project_id) || []
        })
        setFormErrors([]); setShowModal(true)
    }
    const handleViewDetails = (s) => { setSelectedStaff(s); setShowDetailModal(true) }
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }
    const handleProjectToggle = (projectId) => {
        setFormData(prev => {
            const ids = prev.project_ids || []
            return { ...prev, project_ids: ids.includes(projectId) ? ids.filter(id => id !== projectId) : [...ids, projectId] }
        })
    }
    const handleSubmit = async (e) => {
        e.preventDefault(); setFormErrors([])
        try {
            const { project_ids, ...submitData } = formData
            if (isEditing) {
                const res = await api.put(`/api/staff/${selectedStaff.id}`, submitData)
                if (res.data.success) { setShowModal(false); setCurrentPage(1); loadStaff(); showSuccess("Staff member updated successfully") }
                else { setFormErrors(res.data.errors || [res.data.error]) }
            } else {
                const res = await api.post("/api/staff", submitData)
                if (res.data.success) {
                    setShowModal(false); setCurrentPage(1); loadStaff()
                    const userInfo = res.data.data?.user_info
                    if (userInfo) { showSuccess(`Staff created! Username: ${userInfo.username} | Password: Erp@123 (must change on first login)`) }
                    else { showSuccess("Staff member created successfully") }
                } else { setFormErrors(res.data.errors || [res.data.error]) }
            }
        } catch (err) {
            const errorData = err.response?.data
            if (errorData?.errors && Array.isArray(errorData.errors)) { setFormErrors(errorData.errors) }
            else { setFormErrors([errorData?.error || "Error saving staff member"]) }
        }
    }
    const handleDelete = async (staffId) => {
        try {
            const res = await api.delete(`/api/staff/${staffId}`)
            if (res.data.success) { setConfirmDelete(null); loadStaff(); showSuccess("Staff member deleted successfully") }
            else { showError(res.data.error || "Failed to delete staff member") }
        } catch (err) { showError(err.response?.data?.error || "Error deleting staff member") }
    }
    const handleReset = () => { setSearchQuery(""); setRoleFilter(""); setCurrentPage(1) }
    return (
        <div className="page-bg">
            <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 text-primary">Staff Management</h1>
                <p className="text-secondary">Manage your construction team members</p>
            </div>
            {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-danger">{error}</div>}
            <div className="card-bg mb-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-muted" size={20} />
                        <input type="text" placeholder="Search by name, phone, email..." value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-3 text-muted" size={20} />
                        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1) }}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg appearance-none">
                            <option value="">All Roles</option>
                            {availableRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <select value={perPage} onChange={(e) => { setPerPage(parseInt(e.target.value)); setCurrentPage(1) }}
                        className="px-4 py-2 border rounded-lg">
                        <option value="5">5 per page</option><option value="10">10 per page</option>
                        <option value="25">25 per page</option><option value="50">50 per page</option>
                    </select>
                    <button onClick={handleReset} className="btn-secondary px-4 py-2 rounded-lg transition">Reset Filters</button>
                </div>
                <button onClick={handleAddClick} className="btn-primary w-full md:w-auto text-white px-6 py-2 rounded-lg transition flex items-center justify-center gap-2">
                    <Plus size={20} /> Add Staff Member
                </button>
            </div>
            <div className="card-bg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-secondary">
                        <div className="inline-block"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
                        <p className="mt-4">Loading staff members...</p>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="p-8 text-center text-secondary"><p>No staff members found</p></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold">Name</th>
                                        <th className="text-left px-6 py-3 font-semibold">Role</th>
                                        <th className="text-left px-6 py-3 font-semibold">Phone</th>
                                        <th className="text-left px-6 py-3 font-semibold">Email</th>
                                        <th className="text-left px-6 py-3 font-semibold">Joining Date</th>
                                        <th className="text-left px-6 py-3 font-semibold">Salary</th>
                                        <th className="text-center px-6 py-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map((s) => (
                                        <tr key={s.id} className="border-b transition">
                                            <td className="px-6 py-4 font-medium">{s.first_name} {s.last_name}</td>
                                            <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{s.role}</span></td>
                                            <td className="px-6 py-4 text-secondary">{s.personal_phone}</td>
                                            <td className="px-6 py-4 text-secondary">{s.personal_email || "-"}</td>
                                            <td className="px-6 py-4 text-secondary">{s.joining_date}</td>
                                            <td className="px-6 py-4 text-secondary font-semibold">₹{parseFloat(s.monthly_salary || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleViewDetails(s)} className="p-2 text-primary rounded transition" title="View details"><Eye size={18} /></button>
                                                    <button onClick={() => handleEditClick(s)} className="p-2 text-success rounded transition" title="Edit"><Edit2 size={18} /></button>
                                                    <button onClick={() => setConfirmDelete(s.id)} className="p-2 text-danger rounded transition" title="Delete"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t px-6 py-4 flex items-center justify-between">
                            <div className="text-secondary text-sm">
                                Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, totalStaff)} of {totalStaff} staff members
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}
                                    className="btn-secondary px-4 py-2 rounded-lg transition">Previous</button>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + 1
                                        return (
                                            <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-2 rounded-lg transition ${currentPage === pageNum ? 'bg-primary text-white' : 'border border-default'}`}>
                                                {pageNum}
                                            </button>
                                        )
                                    })}
                                    {totalPages > 5 && <span className="px-2">...</span>}
                                </div>
                                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}
                                    className="btn-secondary px-4 py-2 rounded-lg transition">Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="card-bg rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto">
                        <div className="modal-header px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-primary">{isEditing ? "Edit Staff Member" : "Add New Staff Member"}</h2>
                            <button onClick={() => setShowModal(false)} className="text-secondary hover:text-white text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            {formErrors.length > 0 && (
                                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                    <ul className="text-danger list-disc list-inside">{formErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                                </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <div><label className="block font-semibold mb-2">Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg" placeholder="Full name" /></div>
                                <div><label className="block font-semibold mb-2">Role *</label><select name="role" value={formData.role} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg">
                                    <option value="">Select a role</option>{PREDEFINED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select></div>
                                <div><label className="block font-semibold mb-2">Phone *</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg" placeholder="10-digit phone" /></div>
                                <div><label className="block font-semibold mb-2">Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="email@example.com" /></div>
                                <div><label className="block font-semibold mb-2">Joining Date *</label><input type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg" /></div>
                                <div><label className="block font-semibold mb-2">Salary *</label><input type="number" name="salary" value={formData.salary} onChange={handleInputChange} required step="0.01" className="w-full px-4 py-2 border rounded-lg" placeholder="Monthly salary" /></div>
                                <div><label className="block font-semibold mb-2">PF (%) *</label><input type="number" name="pf" value={formData.pf} onChange={handleInputChange} required step="0.01" min="0" max="100" className="w-full px-4 py-2 border rounded-lg" placeholder="PF percentage" /></div>
                                <div><label className="block font-semibold mb-2">ESI (%) *</label><input type="number" name="esi" value={formData.esi} onChange={handleInputChange} required step="0.01" min="0" max="100" className="w-full px-4 py-2 border rounded-lg" placeholder="ESI percentage" /></div>
                                <div className="col-span-full"><label className="block font-semibold mb-2">Photo URL</label><input type="text" name="photo" value={formData.photo} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="URL to staff photo" /></div>
                            </div>
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-3 mb-2"><span className="text-lg">🔐</span><span className="font-semibold">User Account (Auto-created)</span></div>
                                <p className="text-secondary text-sm ml-8 mb-3">A login account will be created automatically.</p>
                                <div className="ml-8 p-3 bg-white rounded-lg border border-blue-100">
                                    <p className="text-sm"><span className="font-semibold">Username:</span> Auto-generated (STF-YYYY-NNN)</p>
                                    <p className="text-sm mt-1"><span className="font-semibold">Default Password:</span> <code className="bg-gray-100 px-2 py-0.5 rounded text-danger font-mono">Erp@123</code></p>
                                    <p className="text-xs text-muted mt-2">⚠️ User must change password on first login</p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <button type="submit" className="flex-1 btn-primary text-white px-6 py-2 rounded-lg transition font-semibold">{isEditing ? "Update" : "Create"} Staff Member</button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary px-6 py-2 rounded-lg transition font-semibold">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showDetailModal && selectedStaff && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 text-white flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Staff Details</h2>
                            <button onClick={() => setShowDetailModal(false)} className="text-white hover:text-gray-200 text-2xl">×</button>
                        </div>
                        <div className="p-6">
                            {selectedStaff.photo && <div className="mb-6 text-center"><img src={selectedStaff.photo} alt={selectedStaff.name} className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-200" /></div>}
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="text-blue-800 font-semibold text-sm mb-2">🔐 Login Credentials</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div><p className="text-gray-500 text-xs">Username</p><p className="font-bold font-mono text-lg">{selectedStaff.staff_id}</p></div>
                                    <div><p className="text-gray-500 text-xs">Default Password</p><p className="font-mono text-lg"><code className="bg-gray-100 px-2 py-0.5 rounded text-danger">Erp@123</code></p></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><h3 className="text-gray-500 text-sm mb-1">Name</h3><p className="text-lg font-semibold">{selectedStaff.name}</p></div>
                                <div><h3 className="text-gray-500 text-sm mb-1">Role</h3><p className="text-lg font-semibold">{selectedStaff.role}</p></div>
                                <div><h3 className="text-gray-500 text-sm mb-1">Phone</h3><p className="text-lg">{selectedStaff.personal_phone}</p></div>
                                <div><h3 className="text-gray-500 text-sm mb-1">Email</h3><p className="text-lg">{selectedStaff.personal_email || "-"}</p></div>
                                <div><h3 className="text-gray-500 text-sm mb-1">Joining Date</h3><p className="text-lg">{selectedStaff.joining_date}</p></div>
                                <div><h3 className="text-gray-500 text-sm mb-1">Monthly Salary</h3><p className="text-lg font-semibold">₹{parseFloat(selectedStaff.monthly_salary || 0).toLocaleString()}</p></div>
                            </div>
                            <div className="flex gap-3 mt-6 pt-4 border-t">
                                <button onClick={() => { setShowDetailModal(false); handleEditClick(selectedStaff) }} className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"><Edit2 size={18} /> Edit</button>
                                <button onClick={() => setShowDetailModal(false)} className="flex-1 btn-secondary px-6 py-2 rounded-lg transition font-semibold">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {confirmDelete !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
                        <h2 className="text-2xl font-bold mb-4">Confirm Delete</h2>
                        <p className="text-secondary mb-6">Are you sure you want to delete this staff member? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold">Delete</button>
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 btn-secondary px-4 py-2 rounded-lg transition font-semibold">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    )
}
