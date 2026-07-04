import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import { FaFileAlt, FaDownload, FaTrash, FaSearch, FaFilter, FaUpload, FaCalendar } from "react-icons/fa"
export default function Documents() {
    const { showError, showInfo } = useToast()
    const [docs, setDocs] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState("all")
    const [sortBy, setSortBy] = useState("date")
    useEffect(() => {
        loadDocs()
    }, [])
    const loadDocs = async () => {
        const res = await api.get("/documents")
        const raw = res.data?.data; setDocs(Array.isArray(raw) ? raw : (raw?.items || []))
    }
    // Get unique document types
    const uniqueTypes = [...new Set(docs.map(d => d.type))]
    // Filter and search documents
    const filteredDocs = docs.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = typeFilter === "all" || d.type === typeFilter
        return matchesSearch && matchesType
    }).sort((a, b) => {
        if (sortBy === "date") {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        }
        return a.name.localeCompare(b.name)
    })
    const handleDelete = async (docId) => {
        if (confirm("Are you sure you want to delete this document?")) {
            try {
                await api.delete(`/documents/${docId}`)
                loadDocs()
            } catch (error) {
                showError("Error deleting document")
            }
        }
    }
    const getTypeColor = (type) => {
        const colors = {
            'PDF': 'bg-red-100 text-red-800',
            'Image': 'bg-blue-100 text-blue-800',
            'Word': 'bg-blue-100 text-blue-800',
            'Excel': 'bg-green-100 text-green-800',
            'Other': 'bg-gray-100 text-gray-800'
        }
        return colors[type] || 'bg-gray-100 text-gray-800'
    }
    return (
        <div className="p-6 theme-blue-white page-bg">
            {/* Header with Action Button */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3 text-primary">
                        <FaFileAlt /> Documents
                    </h1>
                    <p className="text-gray-600 mt-2">Manage and organize your project documents</p>
                </div>
                <button
                    onClick={() => showInfo("Upload Document feature coming soon!")}
                    className="btn-blue-white flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold bg-primary"
                >
                    <FaUpload /> Upload Document
                </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-400 to-cyan-600 rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-semibold uppercase">Total Documents</p>
                            <p className="text-3xl font-bold text-white mt-2">{docs.length}</p>
                        </div>
                        <div className="text-5xl text-blue-200 opacity-50">
                            <FaFileAlt />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 transform hover:shadow-xl transition-shadow border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold uppercase">Document Types</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{uniqueTypes.length}</p>
                        </div>
                        <div className="text-5xl opacity-30 text-primary">
                            <FaFilter />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 transform hover:shadow-xl transition-shadow border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold uppercase">Filtered Results</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{filteredDocs.length}</p>
                        </div>
                        <div className="text-5xl opacity-30 text-primary">
                            <FaSearch />
                        </div>
                    </div>
                </div>
            </div>
            {/* Filter and Search Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Search Bar */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Search Documents</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by document name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>
                    {/* Type Filter */}
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <FaFilter className="inline mr-2" /> Type
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                        >
                            <option value="all">All Types</option>
                            {uniqueTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    {/* Sort By */}
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <FaCalendar className="inline mr-2" /> Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                        >
                            <option value="date">Latest First</option>
                            <option value="name">Name (A-Z)</option>
                        </select>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">Showing {filteredDocs.length} of {docs.length} documents</p>
            </div>
            {/* Documents Table */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-primary">
                    Document Library ({filteredDocs.length})
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-blue-200 bg-blue-50">
                                <th className="text-left py-3 px-4 font-semibold text-blue-700">Document Name</th>
                                <th className="text-left py-3 px-4 font-semibold text-blue-700">Type</th>
                                <th className="text-left py-3 px-4 font-semibold text-blue-700">Date Added</th>
                                <th className="text-center py-3 px-4 font-semibold text-blue-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-500">
                                        No documents found
                                    </td>
                                </tr>
                            ) : (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="border-b hover:bg-blue-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <FaFileAlt className="text-blue-500" />
                                                <span className="font-medium text-gray-800">{doc.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(doc.type)}`}>
                                                {doc.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN') : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <a
                                                    href={`http://localhost:5000/uploads/${doc.file}`}
                                                    download
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors font-semibold text-sm"
                                                >
                                                    <FaDownload /> Download
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-semibold text-sm"
                                                >
                                                    <FaTrash /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
