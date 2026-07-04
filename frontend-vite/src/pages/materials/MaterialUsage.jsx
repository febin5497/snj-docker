import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import { FaBox, FaArrowDown, FaSearch, FaFilter, FaCheckCircle } from "react-icons/fa"
export default function MaterialUsage() {
    const { showSuccess, showError, showWarning } = useToast()
    const [materials, setMaterials] = useState([])
    const [usageAmounts, setUsageAmounts] = useState({})
    const [searchTerm, setSearchTerm] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    useEffect(() => {
        loadMaterials()
    }, [])
    const loadMaterials = async () => {
        const res = await api.get("/api/materials")
        // Ensure materials is always an array
        const materialsData = Array.isArray(res.data) ? res.data : (res.data?.data || [])
        setMaterials(materialsData)
    }
    const handleUseMaterial = async (id, materialName) => {
        const amount = usageAmounts[id]
        if (!amount || amount <= 0) {
            showWarning("Please enter a valid quantity")
            return
        }
        try {
            await api.post("/api/materials/use", {
                material_id: id,
                quantity: amount
            })
            setSuccessMessage(`✓ ${amount} ${materials.find(m => m.id === id)?.unit} of ${materialName} deducted successfully!`)
            setTimeout(() => setSuccessMessage(""), 3000)
            showSuccess(`${materialName} usage updated successfully!`)
            // Clear the input
            setUsageAmounts({ ...usageAmounts, [id]: "" })
            // Reload materials
            loadMaterials()
        } catch (error) {
            showError("Error using material")
        }
    }
    // Filter materials
    const filteredMaterials = materials.filter(m =>
        (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.unit && m.unit.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    const totalAvailableQuantity = filteredMaterials.reduce((sum, m) => sum + (m.quantity || 0), 0)
    return (
        <div className="p-6 theme-blue-white" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)', minHeight: '100vh' }}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold flex items-center gap-3" style={{ color: '#0052CC' }}>
                    <FaArrowDown /> Material Usage Tracking
                </h1>
                <p className="text-gray-600 mt-2">Record and track material consumption on your projects</p>
            </div>
            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg flex items-center gap-2">
                    <FaCheckCircle /> {successMessage}
                </div>
            )}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 transform hover:shadow-xl transition-shadow" style={{ borderLeftColor: '#0052CC' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold uppercase">Available Materials</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{filteredMaterials.length}</p>
                        </div>
                        <div className="text-5xl opacity-30" style={{ color: '#0052CC' }}>
                            <FaBox />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 transform hover:shadow-xl transition-shadow" style={{ borderLeftColor: '#0052CC' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold uppercase">Total Stock Units</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{totalAvailableQuantity.toLocaleString()}</p>
                        </div>
                        <div className="text-5xl opacity-30" style={{ color: '#0052CC' }}>
                            📊
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 transform hover:shadow-xl transition-shadow" style={{ borderLeftColor: '#0052CC' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold uppercase">In Use Today</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">Ready</p>
                        </div>
                        <div className="text-5xl opacity-30" style={{ color: '#0052CC' }}>
                            <FaArrowDown />
                        </div>
                    </div>
                </div>
            </div>
            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Search Bar */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Search Materials</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by material name or unit..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                style={{ focusBorderColor: '#0052CC', focusRingColor: '#e8f0fe' }}
                            />
                        </div>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">Showing {filteredMaterials.length} of {materials.length} materials</p>
            </div>
            {/* Material Usage Table */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#0052CC' }}>
                    Record Material Usage ({filteredMaterials.length})
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 bg-blue-50" style={{ borderBottomColor: '#0052CC' }}>
                                <th className="text-left py-3 px-4 font-semibold" style={{ color: '#0052CC' }}>Material Name</th>
                                <th className="text-right py-3 px-4 font-semibold" style={{ color: '#0052CC' }}>Current Stock</th>
                                <th className="text-center py-3 px-4 font-semibold" style={{ color: '#0052CC' }}>Unit</th>
                                <th className="text-center py-3 px-4 font-semibold" style={{ color: '#0052CC' }}>Quantity to Use</th>
                                <th className="text-center py-3 px-4 font-semibold" style={{ color: '#0052CC' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500">
                                        No materials found
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterials.map((material) => (
                                    <tr key={material.id} className="border-b hover:bg-blue-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <FaBox style={{ color: '#0052CC' }} />
                                                <span className="font-medium text-gray-800">{material.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="font-bold text-gray-900">
                                                {material.quantity ? material.quantity.toLocaleString() : '0'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                                                {material.unit || 'units'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={usageAmounts[material.id] || ""}
                                                onChange={(e) => setUsageAmounts({
                                                    ...usageAmounts,
                                                    [material.id]: e.target.value
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 transition-all"
                                                style={{ focusBorderColor: '#0052CC', focusRingColor: '#e8f0fe' }}
                                            />
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => handleUseMaterial(material.id, material.name)}
                                                disabled={!usageAmounts[material.id] || usageAmounts[material.id] <= 0}
                                                className="inline-flex items-center gap-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ backgroundColor: '#0052CC' }}
                                            >
                                                <FaArrowDown /> Use
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Enter the quantity of material you want to use/deduct from stock, then click the "Use" button to record the usage.
                    </p>
                </div>
            </div>
        </div>
    )
}