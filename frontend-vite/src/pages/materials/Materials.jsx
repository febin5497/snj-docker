import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import FormModal from "../../components/FormModal"
import MaterialForm from "../../components/MaterialForm"
import { FaBox, FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaExclamationTriangle } from "react-icons/fa"
export default function Materials() {
    const { showError } = useToast()
    const [materials, setMaterials] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("name")
    const [showMaterialForm, setShowMaterialForm] = useState(false)
    const [selectedMaterial, setSelectedMaterial] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    useEffect(() => {
        loadMaterials()
    }, [])
    const loadMaterials = async () => {
        try {
            const res = await api.get(`/api/materials`)
            const raw = res.data?.data; const allMaterials = Array.isArray(raw) ? raw : (raw?.items || [])
            setMaterials(allMaterials)
        } catch (err) {
            showError("Failed to load materials")
            setMaterials([])
        }
    }
    // Filter and sort materials
    const filteredMaterials = materials.filter(m =>
        (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.unit && m.unit.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => {
        if (sortBy === "name") {
            return (a.name || "").localeCompare(b.name || "")
        } else if (sortBy === "quantity") {
            return (b.quantity || 0) - (a.quantity || 0)
        }
        return 0
    })
    const totalMaterials = materials.length
    const totalQuantity = materials.reduce((sum, m) => sum + (m.quantity || 0), 0)
    const lowStockCount = materials.filter(m => m.quantity && m.quantity < 10).length
    const getLowStockColor = (quantity) => {
        if (!quantity) return 'text-red-600'
        if (quantity < 10) return 'text-red-600 font-bold'
        if (quantity < 50) return 'text-yellow-600 font-bold'
        return 'text-green-600'
    }
    const handleOpenAddForm = () => {
        setSelectedMaterial(null)
        setShowMaterialForm(true)
    }
    const handleOpenEditForm = (material) => {
        setSelectedMaterial(material)
        setShowMaterialForm(true)
    }
    const handleCloseForm = () => {
        setShowMaterialForm(false)
        setSelectedMaterial(null)
    }
    const handleFormSaved = () => {
        loadMaterials()
    }
    const handleDeleteMaterial = async (materialId) => {
        setIsLoading(true)
        try {
            await api.delete(`/api/materials/${materialId}`)
            setDeleteConfirm(null)
            loadMaterials()
        } catch (error) {
            const errorMsg = error.response?.data?.error || "Failed to delete material"
            showError(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <div className="p-6 md:p-6 sm:p-4 page-bg min-h-screen">
            {/* Header with Action Button */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3 text-primary">
                        <FaBox className="text-primary" /> Materials Inventory
                    </h1>
                    <p className="text-secondary mt-2">Manage your construction materials and stock levels</p>
                </div>
                <button
                    onClick={handleOpenAddForm}
                    className="btn-blue-white flex items-center gap-2 px-6 py-3"
                >
                    <FaPlus /> Add Material
                </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card-bg rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase text-primary">Total Materials</p>
                            <p className="text-3xl font-bold mt-2 text-primary">{totalMaterials}</p>
                        </div>
                        <div className="text-5xl opacity-20 text-primary">
                            <FaBox />
                        </div>
                    </div>
                </div>
                <div className="card-bg rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase text-primary">Total Quantity</p>
                            <p className="text-3xl font-bold mt-2 text-primary">{totalQuantity.toLocaleString()}</p>
                        </div>
                        <div className="text-5xl opacity-20 text-primary">
                            📦
                        </div>
                    </div>
                </div>
                <div className="card-bg rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase text-primary">Low Stock Items</p>
                            <p className="text-3xl font-bold mt-2 text-primary">{lowStockCount}</p>
                        </div>
                        <div className="text-5xl opacity-20 text-primary">
                            <FaExclamationTriangle />
                        </div>
                    </div>
                </div>
            </div>
            {/* Filter and Search Section */}
            <div className="card-bg rounded-lg shadow-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Search Bar */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-secondary mb-2">Search Materials</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-3 text-muted" />
                            <input
                                type="text"
                                placeholder="Search by material name or unit..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-blue-white w-full pl-10 pr-4 py-2"
                            />
                        </div>
                    </div>
                    {/* Sort By */}
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-semibold text-secondary mb-2">
                            <FaFilter className="inline mr-2" /> Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-2 border-default rounded-lg"
                        >
                            <option value="name">Name (A-Z)</option>
                            <option value="quantity">Quantity (High to Low)</option>
                        </select>
                    </div>
                </div>
                <p className="text-sm text-muted mt-3">Showing {filteredMaterials.length} of {materials.length} materials</p>
            </div>
            {/* Materials Table */}
            <div className="card-bg rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 header-blue-white">
                    Material Inventory ({filteredMaterials.length})
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="table-header-blue-white">
                                <th className="text-left py-3 px-4">Material Name</th>
                                <th className="text-right py-3 px-4">Quantity</th>
                                <th className="text-left py-3 px-4">Unit</th>
                                <th className="text-center py-3 px-4">Stock Status</th>
                                <th className="text-center py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-muted">
                                        No materials found
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterials.map((material) => (
                                    <tr key={material.id} className="border-b border-default transition-colors hover:bg-white/5">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <FaBox className="text-amber-500" />
                                                <span className="font-medium text-primary">{material.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className={`font-bold ${getLowStockColor(material.quantity)}`}>
                                                {material.quantity ? material.quantity.toLocaleString() : '0'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-secondary">{material.unit || 'N/A'}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {material.quantity && material.quantity < 10 ? (
                                                <span className="inline-block px-3 py-1 bg-danger/15 text-danger rounded-full text-sm font-semibold">
                                                    ⚠️ Low Stock
                                                </span>
                                            ) : material.quantity && material.quantity < 50 ? (
                                                <span className="inline-block px-3 py-1 bg-yellow-500/15 text-yellow-400 rounded-full text-sm font-semibold">
                                                    ⚡ Medium
                                                </span>
                                            ) : (
                                                <span className="inline-block px-3 py-1 bg-success/15 text-success rounded-full text-sm font-semibold">
                                                    ✓ Good Stock
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => handleOpenEditForm(material)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold text-sm text-secondary hover:bg-white/10"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(material.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold text-sm text-danger hover:bg-danger/10"
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
            {/* Material Form Modal */}
            <FormModal
                isOpen={showMaterialForm}
                title={selectedMaterial ? "Edit Material" : "Add Material"}
                onClose={handleCloseForm}
                onSubmit={() => {}}
                isLoading={false}
            >
                <MaterialForm
                    material={selectedMaterial}
                    isOpen={showMaterialForm}
                    onClose={handleCloseForm}
                    onSaved={handleFormSaved}
                />
            </FormModal>
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card-solid rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-primary mb-4">Confirm Delete</h3>
                        <p className="text-secondary mb-6">
                            Are you sure you want to delete this material? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isLoading}
                                className="px-6 py-2 border border-default text-secondary rounded-lg font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteMaterial(deleteConfirm)}
                                disabled={isLoading}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}