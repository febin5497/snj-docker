import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
const STATUS_COLORS = {
    "Not Started": "bg-gray-100 text-gray-700",
    "Planned":     "bg-blue-100 text-blue-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
    "Completed":   "bg-green-100 text-green-700",
    "On Hold":     "bg-red-100 text-red-700",
    "active":      "bg-green-100 text-green-700",
    "pending":     "bg-yellow-100 text-yellow-700",
    "completed":   "bg-green-100 text-green-700",
    "on_hold":     "bg-red-100 text-red-700",
}
export default function Projects() {
    const { showError } = useToast()
    const [projects, setProjects] = useState([])
    const [clients, setClients] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const navigate = useNavigate()
    useEffect(() => {
        fetchClients()
        fetchProjects()
    }, [])
    const fetchClients = async () => {
        try {
            const res = await api.get("/clients/")
            const clientsArray = res.data.data ?? res.data ?? []
            const clientMap = {}
            clientsArray.forEach(client => {
                clientMap[client.id] = client.name
            })
            setClients(clientMap)
        } catch (err) {
        }
    }
    const fetchProjects = async () => {
        setLoading(true)
        try {
            const res = await api.get("/api/projects?per_page=100")
            const raw = res.data?.data ?? res.data ?? []
            const allProjects = Array.isArray(raw) ? raw : (raw.items || raw.projects || [])
            setProjects(allProjects)
            setError("")
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load projects")
            setProjects([])
        } finally {
            setLoading(false)
        }
    }
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete project "${name}"?`)) return
        try {
            await api.delete(`/api/projects/${id}`)
            setProjects(prev => prev.filter(p => p.id !== id))
        } catch (err) {
            showError(err.response?.data?.error || "Failed to delete project")
        }
    }
    return (
        <div className="page-bg">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-primary">Projects</h1>
                        <p className="text-secondary text-sm mt-1">Manage all your construction projects</p>
                    </div>
                    <button
                        onClick={() => navigate("/projects/new")}
                        className="btn-primary text-white px-6 py-2.5 rounded-lg font-medium transition"
                    >
                        + Add Project
                    </button>
                </div>
                {error && <div className="text-danger mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}
                <div className="card-bg p-6">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin">
                            <div className="h-8 w-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                        </div>
                        <p className="text-secondary ml-3">Loading projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-secondary">No projects found.</p>
                        <button
                            onClick={() => navigate("/projects/new")}
                            className="mt-4 btn-primary text-white px-6 py-2 rounded-lg font-medium"
                        >
                            Create Your First Project
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="py-3 pr-4 text-left font-semibold">Name</th>
                                <th className="py-3 pr-4 text-left font-semibold">Client</th>
                                <th className="py-3 pr-4 text-left font-semibold">Location</th>
                                <th className="py-3 pr-4 text-left font-semibold">Start Date</th>
                                <th className="py-3 pr-4 text-left font-semibold">Status</th>
                                <th className="py-3 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b cursor-pointer transition"
                                    onClick={() => navigate(`/projects/${p.id}`)}
                                >
                                    <td className="py-3 pr-4 font-semibold text-primary">{p.name}</td>
                                    <td className="py-3 pr-4 text-secondary">{clients[p.client_id] || "—"}</td>
                                    <td className="py-3 pr-4 text-secondary">{p.location}</td>
                                    <td className="py-3 pr-4 text-secondary">{p.start_date}</td>
                                    <td className="py-3 pr-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-700"}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="py-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex gap-3">
                                            <button
                                                className="font-medium text-xs transition text-accent"
                                                onClick={() => navigate(`/projects/${p.id}/edit`)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="text-danger font-medium text-xs transition"
                                                onClick={() => handleDelete(p.id, p.name)}
                                            >
                                                Delete
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
            </div>
        </div>
    )
}
