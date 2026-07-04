import { useState, useEffect } from 'react'
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaTimes, FaExclamationTriangle } from 'react-icons/fa'
import api from '../api/api'
import { useToast } from './Toast'
import '../styles/MaintenanceScheduleManager.css'

export default function MaintenanceScheduleManager({ vehicleId, vehicleName }) {
    const { showSuccess, showError } = useToast()
    const [schedules, setSchedules] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState(null)
    const [formData, setFormData] = useState({
        maintenance_type: '',
        interval_km: '',
        interval_days: '',
        last_done_km: '',
        last_done_date: new Date().toISOString().split('T')[0],
        next_due_km: '',
        next_due_date: ''
    })
    const [errors, setErrors] = useState({})

    const maintenanceTypes = ['Oil Change', 'Tire Rotation', 'Filter Replacement', 'Brake Inspection', 'Transmission Service', 'Coolant Flush', 'Spark Plugs', 'Battery Check', 'Other']

    useEffect(() => {
        if (vehicleId) {
            fetchSchedules()
        }
    }, [vehicleId])

    const fetchSchedules = async () => {
        setIsLoading(true)
        try {
            const res = await api.get(`/api/vehicles/${vehicleId}/maintenance-schedule`)
            setSchedules(res.data?.data || [])
        } catch (err) {
            showError('Failed to load maintenance schedules')
        } finally {
            setIsLoading(false)
        }
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.maintenance_type) newErrors.maintenance_type = 'Type is required'
        if (!formData.interval_km && !formData.interval_days) newErrors.interval = 'Either km or days interval required'
        if (formData.interval_km && parseFloat(formData.interval_km) <= 0) newErrors.interval_km = 'Must be greater than 0'
        if (formData.interval_days && parseFloat(formData.interval_days) <= 0) newErrors.interval_days = 'Must be greater than 0'
        if (!formData.last_done_date) newErrors.last_done_date = 'Last done date is required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const calculateNextDue = () => {
        const newFormData = { ...formData }

        if (formData.last_done_date && formData.interval_days) {
            const lastDate = new Date(formData.last_done_date)
            const nextDate = new Date(lastDate.getTime() + parseInt(formData.interval_days) * 24 * 60 * 60 * 1000)
            newFormData.next_due_date = nextDate.toISOString().split('T')[0]
        }

        if (formData.last_done_km && formData.interval_km) {
            newFormData.next_due_km = (parseFloat(formData.last_done_km) + parseFloat(formData.interval_km)).toFixed(1)
        }

        return newFormData
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            const calculatedData = calculateNextDue()
            const payload = {
                maintenance_type: calculatedData.maintenance_type,
                interval_km: calculatedData.interval_km ? parseFloat(calculatedData.interval_km) : null,
                interval_days: calculatedData.interval_days ? parseInt(calculatedData.interval_days) : null,
                last_done_km: calculatedData.last_done_km ? parseFloat(calculatedData.last_done_km) : null,
                last_done_date: calculatedData.last_done_date,
                next_due_km: calculatedData.next_due_km ? parseFloat(calculatedData.next_due_km) : null,
                next_due_date: calculatedData.next_due_date || null
            }

            if (editingSchedule) {
                await api.put(`/api/vehicles/${vehicleId}/maintenance-schedule/${editingSchedule.id}`, payload)
                showSuccess('Maintenance schedule updated successfully')
            } else {
                await api.post(`/api/vehicles/${vehicleId}/maintenance-schedule`, payload)
                showSuccess('Maintenance schedule created successfully')
            }

            resetForm()
            fetchSchedules()
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to save maintenance schedule'
            showError(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (schedule) => {
        setEditingSchedule(schedule)
        setFormData({
            maintenance_type: schedule.maintenance_type,
            interval_km: schedule.interval_km || '',
            interval_days: schedule.interval_days || '',
            last_done_km: schedule.last_done_km || '',
            last_done_date: schedule.last_done_date,
            next_due_km: schedule.next_due_km || '',
            next_due_date: schedule.next_due_date || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (scheduleId) => {
        if (!window.confirm('Delete this maintenance schedule?')) return

        setIsLoading(true)
        try {
            await api.delete(`/api/vehicles/${vehicleId}/maintenance-schedule/${scheduleId}`)
            showSuccess('Maintenance schedule deleted successfully')
            fetchSchedules()
        } catch (err) {
            showError('Failed to delete maintenance schedule')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            maintenance_type: '',
            interval_km: '',
            interval_days: '',
            last_done_km: '',
            last_done_date: new Date().toISOString().split('T')[0],
            next_due_km: '',
            next_due_date: ''
        })
        setEditingSchedule(null)
        setShowForm(false)
        setErrors({})
    }

    const checkIfDue = (schedule) => {
        const now = new Date()
        const today = now.toISOString().split('T')[0]

        const isDueByDate = schedule.next_due_date && schedule.next_due_date <= today
        return isDueByDate
    }

    return (
        <div className="maintenance-schedule-container">
            <div className="schedule-header">
                <div className="schedule-title">
                    <FaCalendarAlt className="schedule-icon" />
                    <h3>Maintenance Schedules</h3>
                </div>
                <button
                    className="btn-primary btn-sm"
                    onClick={() => setShowForm(true)}
                    disabled={isLoading}
                >
                    <FaPlus /> Add Schedule
                </button>
            </div>

            {showForm && (
                <div className="form-modal">
                    <div className="form-modal-content">
                        <div className="form-modal-header">
                            <h4>{editingSchedule ? 'Edit Schedule' : 'Add Maintenance Schedule'}</h4>
                            <button className="btn-close" onClick={resetForm} disabled={isLoading}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Maintenance Type *</label>
                                <select
                                    value={formData.maintenance_type}
                                    onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                                    disabled={isLoading}
                                >
                                    <option value="">Select type...</option>
                                    {maintenanceTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {errors.maintenance_type && <span className="error-text">{errors.maintenance_type}</span>}
                            </div>

                            <div className="form-info">
                                <FaExclamationTriangle className="info-icon" />
                                <span>Set either km interval or days interval (or both)</span>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Interval (km)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.interval_km}
                                        onChange={(e) => setFormData({ ...formData, interval_km: e.target.value })}
                                        placeholder="5000"
                                        disabled={isLoading}
                                    />
                                    {errors.interval_km && <span className="error-text">{errors.interval_km}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Interval (days)</label>
                                    <input
                                        type="number"
                                        value={formData.interval_days}
                                        onChange={(e) => setFormData({ ...formData, interval_days: e.target.value })}
                                        placeholder="180"
                                        disabled={isLoading}
                                    />
                                    {errors.interval_days && <span className="error-text">{errors.interval_days}</span>}
                                </div>
                            </div>

                            {errors.interval && <span className="error-text">{errors.interval}</span>}

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Last Done Date *</label>
                                    <input
                                        type="date"
                                        value={formData.last_done_date}
                                        onChange={(e) => setFormData({ ...formData, last_done_date: e.target.value })}
                                        disabled={isLoading}
                                    />
                                    {errors.last_done_date && <span className="error-text">{errors.last_done_date}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Last Done (km)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.last_done_km}
                                        onChange={(e) => setFormData({ ...formData, last_done_km: e.target.value })}
                                        placeholder="20000"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="form-hint">
                                Next due date and km will be calculated automatically based on the intervals set above.
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

            <div className="schedules-list">
                {isLoading && schedules.length === 0 ? (
                    <div className="loading">Loading maintenance schedules...</div>
                ) : schedules.length === 0 ? (
                    <div className="empty-state">No maintenance schedules set up yet</div>
                ) : (
                    <div className="schedules-grid">
                        {schedules.map((schedule) => {
                            const isDue = checkIfDue(schedule)
                            return (
                                <div key={schedule.id} className={`schedule-card ${isDue ? 'due' : ''}`}>
                                    {isDue && (
                                        <div className="due-badge">
                                            <FaExclamationTriangle /> Due
                                        </div>
                                    )}

                                    <div className="schedule-card-header">
                                        <h4 className="schedule-type">{schedule.maintenance_type}</h4>
                                        <div className="schedule-actions">
                                            <button
                                                className="btn-icon edit"
                                                onClick={() => handleEdit(schedule)}
                                                title="Edit"
                                                disabled={isLoading}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                onClick={() => handleDelete(schedule.id)}
                                                title="Delete"
                                                disabled={isLoading}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="schedule-card-content">
                                        <div className="schedule-info">
                                            <span className="label">Last Done:</span>
                                            <span className="value">{new Date(schedule.last_done_date).toLocaleDateString()}</span>
                                        </div>

                                        {schedule.interval_km && (
                                            <div className="schedule-info">
                                                <span className="label">Interval (km):</span>
                                                <span className="value">{schedule.interval_km.toFixed(1)}</span>
                                            </div>
                                        )}

                                        {schedule.interval_days && (
                                            <div className="schedule-info">
                                                <span className="label">Interval (days):</span>
                                                <span className="value">{schedule.interval_days}</span>
                                            </div>
                                        )}

                                        {schedule.next_due_date && (
                                            <div className="schedule-info">
                                                <span className="label">Next Due Date:</span>
                                                <span className="value">{new Date(schedule.next_due_date).toLocaleDateString()}</span>
                                            </div>
                                        )}

                                        {schedule.next_due_km && (
                                            <div className="schedule-info">
                                                <span className="label">Next Due (km):</span>
                                                <span className="value">{schedule.next_due_km.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
