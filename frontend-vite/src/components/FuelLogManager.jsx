import { useState, useEffect } from 'react'
import { FaGasPump, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa'
import api from '../api/api'
import { useToast } from './Toast'
import '../styles/FuelLogManager.css'

export default function FuelLogManager({ vehicleId, vehicleName }) {
    const { showSuccess, showError } = useToast()
    const [fuelLogs, setFuelLogs] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingLog, setEditingLog] = useState(null)
    const [summary, setSummary] = useState(null)
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        cost: '',
        notes: ''
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (vehicleId) {
            console.log('FuelLogManager: Loading data for vehicle', vehicleId)
            fetchFuelLogs()
            fetchFuelSummary()
        } else {
            console.warn('FuelLogManager: No vehicleId provided')
        }
    }, [vehicleId])

    const fetchFuelLogs = async () => {
        setIsLoading(true)
        try {
            console.log('FuelLogManager: Fetching fuel logs from /api/vehicles/' + vehicleId + '/fuel-logs')
            const res = await api.get(`/api/vehicles/${vehicleId}/fuel-logs?page=1&per_page=10`)
            console.log('FuelLogManager: Response received:', res.data)
            setFuelLogs(res.data?.data || [])
        } catch (err) {
            console.error('FuelLogManager: Error fetching fuel logs:', err)
            showError('Failed to load fuel logs')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchFuelSummary = async () => {
        try {
            console.log('FuelLogManager: Fetching fuel summary from /api/vehicles/' + vehicleId + '/fuel-logs/summary')
            const res = await api.get(`/api/vehicles/${vehicleId}/fuel-logs/summary`)
            console.log('FuelLogManager: Summary response received:', res.data)
            setSummary(res.data?.data)
        } catch (err) {
            console.error('FuelLogManager: Error fetching fuel summary:', err)
        }
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.date) newErrors.date = 'Date is required'
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0'
        if (!formData.cost || parseFloat(formData.cost) <= 0) newErrors.cost = 'Cost must be greater than 0'
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
                amount: parseFloat(formData.amount),
                cost: parseFloat(formData.cost),
                notes: formData.notes
            }

            if (editingLog) {
                await api.put(`/api/vehicles/${vehicleId}/fuel-logs/${editingLog.id}`, payload)
                showSuccess('Fuel log updated successfully')
            } else {
                await api.post(`/api/vehicles/${vehicleId}/fuel-logs`, payload)
                showSuccess('Fuel log created successfully')
            }

            resetForm()
            fetchFuelLogs()
            fetchFuelSummary()
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to save fuel log'
            showError(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (log) => {
        setEditingLog(log)
        setFormData({
            date: log.date,
            amount: log.amount,
            cost: log.cost,
            notes: log.notes || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (logId) => {
        if (!window.confirm('Delete this fuel log?')) return

        setIsLoading(true)
        try {
            await api.delete(`/api/vehicles/${vehicleId}/fuel-logs/${logId}`)
            showSuccess('Fuel log deleted successfully')
            fetchFuelLogs()
            fetchFuelSummary()
        } catch (err) {
            showError('Failed to delete fuel log')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            amount: '',
            cost: '',
            notes: ''
        })
        setEditingLog(null)
        setShowForm(false)
        setErrors({})
    }

    return (
        <div className="fuel-log-container">
            <div className="fuel-log-header">
                <div className="fuel-log-title">
                    <FaGasPump className="fuel-icon" />
                    <h3>Fuel Logs</h3>
                </div>
                <button
                    className="btn-primary btn-sm"
                    onClick={() => setShowForm(true)}
                    disabled={isLoading}
                >
                    <FaPlus /> Add Fuel Log
                </button>
            </div>

            {summary && (
                <div className="fuel-summary">
                    <div className="summary-card">
                        <label>Total Fuel (L)</label>
                        <div className="value">{(summary.total_liters || 0).toFixed(2)}</div>
                    </div>
                    <div className="summary-card">
                        <label>Total Cost</label>
                        <div className="value">${(summary.total_cost || 0).toFixed(2)}</div>
                    </div>
                    <div className="summary-card">
                        <label>Avg Daily (L)</label>
                        <div className="value">{(summary.avg_daily_liters || 0).toFixed(2)}</div>
                    </div>
                    <div className="summary-card">
                        <label>Avg Daily Cost</label>
                        <div className="value">${(summary.avg_daily_cost || 0).toFixed(2)}</div>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="form-modal">
                    <div className="form-modal-content">
                        <div className="form-modal-header">
                            <h4>{editingLog ? 'Edit Fuel Log' : 'Add Fuel Log'}</h4>
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
                                    <label>Amount (Liters) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        disabled={isLoading}
                                    />
                                    {errors.amount && <span className="error-text">{errors.amount}</span>}
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
                                <label>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Optional notes..."
                                    disabled={isLoading}
                                    rows="3"
                                />
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

            <div className="fuel-logs-list">
                {isLoading && fuelLogs.length === 0 ? (
                    <div className="loading">Loading fuel logs...</div>
                ) : fuelLogs.length === 0 ? (
                    <div className="empty-state">No fuel logs recorded yet</div>
                ) : (
                    <div className="table-responsive">
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Amount (L)</th>
                                    <th>Cost ($)</th>
                                    <th>Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fuelLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.date).toLocaleDateString()}</td>
                                        <td className="text-right">{log.amount.toFixed(2)}</td>
                                        <td className="text-right">${log.cost.toFixed(2)}</td>
                                        <td>{log.notes || '-'}</td>
                                        <td className="actions">
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
