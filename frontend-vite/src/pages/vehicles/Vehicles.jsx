import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import FormModal from "../../components/FormModal"
import VehicleForm from "../../components/VehicleForm"
import FuelLogManager from "../../components/FuelLogManager"
import MaintenanceLogManager from "../../components/MaintenanceLogManager"
import MaintenanceScheduleManager from "../../components/MaintenanceScheduleManager"
import VehicleProjectAssignment from "../../components/VehicleProjectAssignment"
import DriverAssignment from "../../components/DriverAssignment"
import { FaTruck, FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaTimes, FaChevronRight } from "react-icons/fa"
export default function Vehicles() {
    const { showError } = useToast()
    const [vehicles, setVehicles] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [showVehicleForm, setShowVehicleForm] = useState(false)
    const [selectedVehicle, setSelectedVehicle] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [detailViewVehicle, setDetailViewVehicle] = useState(null)
    const formRef = { current: null }
    useEffect(() => {
        fetchVehicles()
    }, [])
    const fetchVehicles = async () => {
        try {
            const res = await api.get(`/api/vehicles`)
            // API returns { data: [...], success: true, message: "..." }
            const allVehicles = Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res.data)
                ? res.data
                : []
            setVehicles(allVehicles)
        } catch (err) {
            showError("Failed to load vehicles")
            setVehicles([])
        }
    }
    // Filter vehicles
    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch =
            (v.make && v.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (v.model && v.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (v.registration_number && v.registration_number.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesStatus = statusFilter === "all" || (v.status && v.status.toLowerCase() === statusFilter.toLowerCase())
        return matchesSearch && matchesStatus
    })
    const getStatusColor = (status) => {
        if (!status) return 'bg-white/10 text-secondary'
        const colors = {
            'active': 'bg-success/15 text-success',
            'inactive': 'bg-danger/15 text-danger',
            'maintenance': 'bg-yellow-500/15 text-yellow-400',
            'in-use': 'bg-primary/15 text-accent',
            'available': 'bg-success/15 text-success'
        }
        return colors[status.toLowerCase()] || 'bg-white/10 text-secondary'
    }
    const activeCount = vehicles.filter(v => v.status && (v.status.toLowerCase() === 'active' || v.status.toLowerCase() === 'in-use' || v.status.toLowerCase() === 'available')).length
    const maintenanceCount = vehicles.filter(v => v.status && v.status.toLowerCase() === 'maintenance').length
    const handleOpenAddForm = () => {
        setSelectedVehicle(null)
        setShowVehicleForm(true)
    }
    const handleOpenEditForm = (vehicle) => {
        setSelectedVehicle(vehicle)
        setShowVehicleForm(true)
    }
    const handleCloseForm = () => {
        setShowVehicleForm(false)
        setSelectedVehicle(null)
    }
    const handleFormSaved = () => {
        fetchVehicles()
    }
    const handleFormSubmit = () => {
        if (formRef.current) {
            formRef.current.dispatchEvent(new Event('submit', { bubbles: true }))
        }
    }
    const getFormRef = (ref) => {
        formRef.current = ref.current
    }
    const handleDeleteVehicle = async (vehicleId) => {
        setIsLoading(true)
        try {
            await api.delete(`/api/vehicles/${vehicleId}`)
            setDeleteConfirm(null)
            fetchVehicles()
        } catch (error) {
            const errorMsg = error.response?.data?.error || "Failed to delete vehicle"
            showError(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }
    const handleOpenDetailView = (vehicle) => {
        setDetailViewVehicle(vehicle)
    }
    const handleCloseDetailView = () => {
        setDetailViewVehicle(null)
    }
    return (
        <div className="p-6 md:p-6 sm:p-4 page-bg min-h-screen">
            {/* Header with Action Button */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3 text-primary">
                        <FaTruck className="text-primary" /> Fleet Management
                    </h1>
                    <p className="text-secondary mt-2">Track and manage your vehicle fleet</p>
                </div>
                <button
                    onClick={handleOpenAddForm}
                    className="btn-blue-white flex items-center gap-2 px-6 py-3"
                >
                    <FaPlus /> Add Vehicle
                </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card-bg rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase text-primary">Total Vehicles</p>
                            <p className="text-3xl font-bold mt-2 text-primary">{vehicles.length}</p>
                        </div>
                        <div className="text-5xl opacity-20 text-primary">
                            <FaTruck />
                        </div>
                    </div>
                </div>
                <div className="card-bg rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase text-primary">Active Vehicles</p>
                            <p className="text-3xl font-bold mt-2 text-primary">{activeCount}</p>
                        </div>
                        <div className="text-5xl opacity-20 text-primary">
                            ✓
                        </div>
                    </div>
                </div>
                <div className="card-bg rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase text-primary">In Maintenance</p>
                            <p className="text-3xl font-bold mt-2 text-primary">{maintenanceCount}</p>
                        </div>
                        <div className="text-5xl opacity-20 text-primary">
                            ⚙️
                        </div>
                    </div>
                </div>
            </div>
            {/* Filter and Search Section */}
            <div className="card-bg rounded-lg shadow-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Search Bar */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-secondary mb-2">Search Vehicles</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-3 text-muted" />
                            <input
                                type="text"
                                placeholder="Search by vehicle name or number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-blue-white w-full pl-10 pr-4 py-2"
                            />
                        </div>
                    </div>
                    {/* Status Filter */}
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-semibold text-secondary mb-2">
                            <FaFilter className="inline mr-2" /> Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border-default rounded-lg"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="in-use">In Use</option>
                            <option value="available">Available</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                <p className="text-sm text-muted mt-3">Showing {filteredVehicles.length} of {vehicles.length} vehicles</p>
            </div>
            {/* Vehicles Table */}
            <div className="card-bg rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 header-blue-white">
                    Vehicle Fleet ({filteredVehicles.length})
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="table-header-blue-white">
                                <th className="text-left py-3 px-4">Make / Model</th>
                                <th className="text-left py-3 px-4">Registration Number</th>
                                <th className="text-center py-3 px-4">Status</th>
                                <th className="text-center py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVehicles.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-muted">
                                        No vehicles found
                                    </td>
                                </tr>
                            ) : (
                                filteredVehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="border-b border-default transition-colors hover:bg-white/5">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <FaTruck className="text-green-500" />
                                                <span className="font-medium text-primary">{vehicle.make} {vehicle.model}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-mono font-bold text-secondary">{vehicle.registration_number}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(vehicle.status)}`}>
                                                {vehicle.status ? vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1) : 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => handleOpenDetailView(vehicle)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold text-sm text-secondary hover:bg-white/10"
                                                    title="View operations and details"
                                                >
                                                    <FaChevronRight /> Details
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditForm(vehicle)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold text-sm text-secondary hover:bg-white/10"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(vehicle.id)}
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
            {/* Vehicle Form Modal */}
            <FormModal
                isOpen={showVehicleForm}
                title={selectedVehicle ? "Edit Vehicle" : "Add Vehicle"}
                onClose={handleCloseForm}
                onSubmit={handleFormSubmit}
                isLoading={false}
            >
                <VehicleForm
                    vehicle={selectedVehicle}
                    isOpen={showVehicleForm}
                    onClose={handleCloseForm}
                    onSaved={handleFormSaved}
                    getFormRef={getFormRef}
                />
            </FormModal>
            {/* Vehicle Detail View Modal */}
            {detailViewVehicle && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto p-4">
                    <div className="card-solid rounded-lg shadow-2xl w-full max-w-3xl my-8">
                        {/* Header */}
                        <div className="sticky top-0 bg-primary-gradient text-white p-6 flex justify-between items-center rounded-t-lg">
                            <div>
                                <h2 className="text-2xl font-bold">{detailViewVehicle.make} {detailViewVehicle.model}</h2>
                                <p className="text-green-200">{detailViewVehicle.registration_number}</p>
                            </div>
                            <button
                                onClick={handleCloseDetailView}
                                className="text-white hover:bg-primary/80 p-2 rounded-lg transition-colors"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>
                        {/* Content */}
                        <div className="p-6 space-y-6" style={{backgroundColor: 'rgba(255,255,255,0.03)'}}>
                            {/* Vehicle Summary */}
                            <div className="card-bg rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-primary mb-4">Vehicle Information</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-secondary">Year</p>
                                        <p className="font-semibold text-primary">{detailViewVehicle.year || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary">Type</p>
                                        <p className="font-semibold text-primary">{detailViewVehicle.type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary">Status</p>
                                        <p className={`font-semibold inline-block px-2 py-1 rounded text-sm ${getStatusColor(detailViewVehicle.status)}`}>
                                            {detailViewVehicle.status || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary">Company</p>
                                        <p className="font-semibold text-primary">{detailViewVehicle.company_id || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Operations */}
                            <FuelLogManager vehicleId={detailViewVehicle.id} vehicleName={`${detailViewVehicle.make} ${detailViewVehicle.model}`} />
                            <MaintenanceLogManager vehicleId={detailViewVehicle.id} vehicleName={`${detailViewVehicle.make} ${detailViewVehicle.model}`} />
                            <MaintenanceScheduleManager vehicleId={detailViewVehicle.id} vehicleName={`${detailViewVehicle.make} ${detailViewVehicle.model}`} />
                            <VehicleProjectAssignment vehicleId={detailViewVehicle.id} vehicleName={`${detailViewVehicle.make} ${detailViewVehicle.model}`} />
                            <DriverAssignment vehicleId={detailViewVehicle.id} vehicleName={`${detailViewVehicle.make} ${detailViewVehicle.model}`} />
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 rounded-b-lg flex justify-end border-t border-default">
                            <button
                                onClick={handleCloseDetailView}
                                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/80 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card-solid rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-primary mb-4">Confirm Delete</h3>
                        <p className="text-secondary mb-6">
                            Are you sure you want to delete this vehicle? This action cannot be undone.
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
                                onClick={() => handleDeleteVehicle(deleteConfirm)}
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