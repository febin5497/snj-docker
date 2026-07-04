import { useState, useEffect } from 'react'
import { FaUserTie, FaPlus, FaUnlink, FaHistory } from 'react-icons/fa'
import api from '../api/api'
import { useToast } from './Toast'
import '../styles/DriverAssignment.css'

export default function DriverAssignment({ vehicleId, vehicleName }) {
    const { showSuccess, showError } = useToast()
    const [currentDriver, setCurrentDriver] = useState(null)
    const [availableDrivers, setAvailableDrivers] = useState([])
    const [selectedDriverId, setSelectedDriverId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [history, setHistory] = useState([])

    useEffect(() => {
        if (vehicleId) {
            fetchCurrentDriver()
            fetchAvailableDrivers()
        }
    }, [vehicleId])

    const fetchCurrentDriver = async () => {
        try {
            const res = await api.get(`/api/vehicles/${vehicleId}/driver`)
            if (res.data?.data?.driver) {
                setCurrentDriver(res.data.data.driver)
            } else {
                setCurrentDriver(null)
            }
        } catch (err) {
            console.error('Failed to load current driver')
        }
    }

    const fetchAvailableDrivers = async () => {
        try {
            const res = await api.get('/api/staff?page=1&per_page=100&role=Driver')
            const allStaff = Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res.data)
                ? res.data
                : []
            const currentDriverId = currentDriver?.id
            const available = allStaff.filter((staff) => staff.id !== currentDriverId)
            setAvailableDrivers(available)
        } catch (err) {
            console.error('Failed to load available drivers')
            setAvailableDrivers([])
        }
    }

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/api/vehicles/${vehicleId}/driver-history`)
            setHistory(res.data?.data || [])
            setShowHistory(true)
        } catch (err) {
            showError('Failed to load driver history')
        }
    }

    const handleAssignDriver = async () => {
        if (!selectedDriverId) {
            showError('Please select a driver')
            return
        }

        setIsLoading(true)
        try {
            await api.post(`/api/vehicles/${vehicleId}/assign-driver`, {
                driver_id: parseInt(selectedDriverId)
            })
            showSuccess('Driver assigned successfully')
            setSelectedDriverId('')
            fetchCurrentDriver()
            fetchAvailableDrivers()
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to assign driver'
            showError(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUnassignDriver = async () => {
        if (!currentDriver) return
        if (!window.confirm('Unassign this driver from the vehicle?')) return

        setIsLoading(true)
        try {
            await api.post(`/api/vehicles/${vehicleId}/unassign-driver`, {
                driver_id: currentDriver.id
            })
            showSuccess('Driver unassigned successfully')
            setCurrentDriver(null)
            fetchAvailableDrivers()
        } catch (err) {
            showError('Failed to unassign driver')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="driver-assignment-container">
            <div className="driver-header">
                <div className="header-title">
                    <FaUserTie className="driver-icon" />
                    <h3>Driver Assignment</h3>
                </div>
                <button
                    className="btn-secondary btn-sm"
                    onClick={fetchHistory}
                    disabled={isLoading}
                    title="View driver history"
                >
                    <FaHistory /> History
                </button>
            </div>

            {/* Current Driver Card */}
            <div className="current-driver-section">
                <h4 className="section-title">Current Driver</h4>
                {currentDriver ? (
                    <div className="driver-card">
                        <div className="driver-info">
                            <div className="driver-name">{currentDriver.name}</div>
                            <div className="driver-details">
                                <span className="detail-item">
                                    <span className="label">Role:</span>
                                    <span className="value">{currentDriver.role || 'N/A'}</span>
                                </span>
                                <span className="detail-item">
                                    <span className="label">Phone:</span>
                                    <span className="value">{currentDriver.phone || 'N/A'}</span>
                                </span>
                                <span className="detail-item">
                                    <span className="label">Email:</span>
                                    <span className="value">{currentDriver.email || 'N/A'}</span>
                                </span>
                            </div>
                        </div>
                        <button
                            className="btn-icon unassign"
                            onClick={handleUnassignDriver}
                            title="Unassign driver"
                            disabled={isLoading}
                        >
                            <FaUnlink />
                        </button>
                    </div>
                ) : (
                    <div className="no-driver">No driver currently assigned</div>
                )}
            </div>

            {/* Assign Driver Section */}
            <div className="assign-driver-section">
                <h4 className="section-title">Assign New Driver</h4>
                <div className="assign-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Select Driver</label>
                            <select
                                value={selectedDriverId}
                                onChange={(e) => setSelectedDriverId(e.target.value)}
                                disabled={isLoading || availableDrivers.length === 0}
                            >
                                <option value="">-- Choose a driver --</option>
                                {availableDrivers.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.name} ({driver.phone || 'No phone'})
                                    </option>
                                ))}
                            </select>
                            {availableDrivers.length === 0 && (
                                <span className="hint-text">No available drivers</span>
                            )}
                        </div>
                        <button
                            className="btn-primary assign-btn"
                            onClick={handleAssignDriver}
                            disabled={isLoading || !selectedDriverId}
                        >
                            <FaPlus /> Assign
                        </button>
                    </div>
                </div>
            </div>

            {/* Driver History Modal */}
            {showHistory && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>Driver Assignment History</h4>
                            <button
                                className="btn-close"
                                onClick={() => setShowHistory(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            {history.length === 0 ? (
                                <div className="empty-state">No driver history</div>
                            ) : (
                                <div className="history-list">
                                    {history.map((entry, index) => (
                                        <div key={index} className="history-entry">
                                            <div className="history-driver-name">{entry.driver_name}</div>
                                            <div className="history-dates">
                                                <span className="label">Assigned:</span>
                                                <span className="value">
                                                    {new Date(entry.assigned_date).toLocaleDateString()}
                                                </span>
                                                {entry.unassigned_date && (
                                                    <>
                                                        <span className="label">Unassigned:</span>
                                                        <span className="value">
                                                            {new Date(entry.unassigned_date).toLocaleDateString()}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
