import { useState, useEffect } from 'react'
import { FaWrench, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa'
import api from '../api/api'
import { useToast } from './Toast'
import '../styles/MaintenanceLogManager.css'

export default function MaintenanceLogManager({ vehicleId, vehicleName }) {
    const { showSuccess, showError } = useToast()
    const [maintenanceLogs, setMaintenanceLogs] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingLog, setEditingLog] = useState(null)
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Service',
        cost: '',
        description: '',
        service_center: '',
        mileage_at_service: ''
    })
    const [errors, setErrors] = useState({})

    const maintenanceTypes = ['Service', 'Repair', 'Inspection', 'Oil Change', 'Tire Replacement', 'Battery', 'Other']

    useEffect(() => {
        if (vehicleId) {
            fetchMaintenanceLogs()
        }
    }, [vehicleId])

    const fetchMaintenanceLogs = async () => {
        setIsLoading(true)
        try {
            const res = await api.get(`/api/vehicles/${vehicleId}/maintenance-logs?page=1&per_page=10`)
            setMaintenanceLogs(res.data?.data || [])
        } catch (err) {
            showError('Failed to load maintenance logs')
        } finally {
            setIsLoading(false)
        }
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.date) newErrors.date = 'Date is required'
        if (!formData.type) newErrors.type = 'Type is required'
        if (!formData.cost || parseFloat(formData.cost) <= 0) newErrors.cost = 'Cost must be greater than 0'
        if (!formData.description || formData.description.trim().length === 0) newErrors.description = 'Description is required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            const payload = {
                date: formData.date,
                type: formData.type,
                cost: parseFloat(formData.cost),
                description: formData.description,
                service_center: formData.service_center || null,
                mileage_at_service: formData.mileage_at_service ? parseFloat(formData.mileage_at_service) : null
            }

            if (editingLog) {
                await api.put(`/api/vehicles/${vehicleId}/maintenance-logs/${editingLog.id}`, payload)
                showSuccess('Maintenance log updated successfully')
            } else {
                await api.post(`/api/vehicles/${vehicleId}/maintenance-logs`, payload)
                showSuccess('Maintenance log created successfully')
            }

            resetForm()
            fetchMaintenanceLogs()
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to save maintenance log'
            showError(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (log) => {
        setEditingLog(log)
        setFormData({
            date: log.date,
            type: log.type,
            cost: log.cost,
            description: log.description,
            service_center: log.service_center || '',
            mileage_at_service: log.mileage_at_service || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (logId) => {
        if (!window.confirm('Delete this maintenance log?')) return

        setIsLoading(true)
        try {
            await api.delete(`/api/vehicles/${vehicleId}/maintenance-logs/${logId}`)
            showSuccess('Maintenance log deleted successfully')
            fetchMaintenanceLogs()
        } catch (err) {
            showError('Failed to delete maintenance log')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            type: 'Service',
            cost: '',
            description: '',
            service_center: '',
            mileage_at_service: ''
        })
        setEditingLog(null)
        setShowForm(false)
        setErrors({})
    }

    const getTypeColor = (type) => {
        const colors = {
            'Service': 'bg-blue-100 text-blue-800',
            'Repair': 'bg-red-100 text-red-800',
            'Inspection': 'bg-purple-100 text-purple-800',
            'Oil Change': 'bg-yellow-100 text-yellow-800',
            'Tire Replacement': 'bg-green-100 text-green-800',
            'Battery': 'bg-orange-100 text-orange-800',
            'Other': 'bg-gray-100 text-gray-800'
        }
        return colors[type] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="maintenance-log-container">
            <div className="maintenance-log-header">
                <div className="maintenance-log-title">
                    <FaWrench className="maintenance-icon" />
                    <h3>Maintenance Logs</h3>
                </div>
                <button
                    className="btn-primary btn-sm"
                    onClick={() => setShowForm(true)}
                    disabled={isLoading}
                >
                    <FaPlus /> Add Maintenance
                </button>
            </div>

            {showForm && (
                <div className="form-modal">
                    <div className="form-modal-content">
                        <div className="form-modal-header">
                            <h4>{editingLog ? 'Edit Maintenance Log' : 'Add Maintenance Log'}</h4>
                            <button className="btn-close" onClick={resetForm} disabled={isLoading}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Date *</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    disabled={isLoading}
                                />
                                {errors.date && <span className="error-text">{errors.date}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        disabled={isLoading}
                                    >
                                        {maintenanceTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.type && <span className="error-text">{errors.type}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Cost ($) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                        placeholder="0.00"
                                        disabled={isLoading}
                                    />
                                    {errors.cost && <span className="error-text">{errors.cost}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the maintenance work..."
                                    disabled={isLoading}
                                    rows="3"
                                />
                                {errors.description && <span className="error-text">{errors.description}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Service Center</label>
                                    <input
                                        type="text"
                                        value={formData.service_center}
                                        onChange={(e) => setFormData({ ...formData, service_center: e.target.value })}
                                        placeholder="e.g., ABC Auto Shop"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Mileage at Service</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.mileage_at_service}
                                        onChange={(e) => setFormData({ ...formData, mileage_at_service: e.target.value })}
                                        placeholder="km"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={resetForm} disabled={isLoading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="maintenance-logs-list">
                {isLoading && maintenanceLogs.length === 0 ? (
                    <div className="loading">Loading maintenance logs...</div>
                ) : maintenanceLogs.length === 0 ? (
                    <div className="empty-state">No maintenance logs recorded yet</div>
                ) : (
                    <div className="logs-grid">
                        {maintenanceLogs.map((log) => (
                            <div key={log.id} className="log-card">
                                <div className="log-card-header">
                                    <div className={`log-type-badge ${getTypeColor(log.type)}`}>
                                        {log.type}
                                    </div>
                                    <div className="log-actions">
                                        <button
                                            className="btn-icon edit"
                                            onClick={() => handleEdit(log)}
                                            title="Edit"
                                            disabled={isLoading}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="btn-icon delete"
                                            onClick={() => handleDelete(log.id)}
                                            title="Delete"
                                            disabled={isLoading}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>

                                <div className="log-card-content">
                                    <div className="log-info">
                                        <span className="label">Date:</span>
                                        <span className="value">{new Date(log.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="log-info">
                                        <span className="label">Cost:</span>
                                        <span className="value">${log.cost.toFixed(2)}</span>
                                    </div>
                                    <div className="log-info full-width">
                                        <span className="label">Description:</span>
                                        <span className="value">{log.description}</span>
                                    </div>
                                    {log.service_center && (
                                        <div className="log-info">
                                            <span className="label">Service Center:</span>
                                            <span className="value">{log.service_center}</span>
                                        </div>
                                    )}
                                    {log.mileage_at_service && (
                                        <div className="log-info">
                                            <span className="label">Mileage:</span>
                                            <span className="value">{log.mileage_at_service.toFixed(1)} km</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
