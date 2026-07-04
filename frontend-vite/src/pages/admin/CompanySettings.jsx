import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import { Save, X } from "lucide-react"
import "../../styles/CompanySettings.css"
export default function CompanySettings() {
    const { showSuccess, showError } = useToast()
    const [company, setCompany] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        logo_url: "",
        tax_percentage: 0,
        gst_number: ""
    })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editing, setEditing] = useState(null)
    const [editValue, setEditValue] = useState("")
    useEffect(() => {
        loadCompanySettings()
    }, [])
    const loadCompanySettings = async () => {
        setLoading(true)
        try {
            const res = await api.get("/api/company")
            if (res.data.success) {
                setCompany(res.data.data)
            } else {
                showError(res.data.error || "Failed to load company settings")
            }
        } catch (err) {
            showError(err.response?.data?.error || "Error loading company settings")
        } finally {
            setLoading(false)
        }
    }
    const handleEditClick = (field, value) => {
        setEditing(field)
        setEditValue(value || "")
    }
    const handleSave = async (field) => {
        try {
            setSaving(true)
            const updateData = { [field]: editValue }
            // Convert tax_percentage to float
            if (field === "tax_percentage") {
                updateData[field] = parseFloat(editValue) || 0
            }
            const res = await api.put("/api/company", updateData)
            if (res.data.success) {
                setCompany(res.data.data)
                setEditing(null)
                showSuccess("Setting updated successfully")
            }
        } catch (err) {
            showError(err.response?.data?.error || "Error updating setting")
        } finally {
            setSaving(false)
        }
    }
    const handleCancel = () => {
        setEditing(null)
        setEditValue("")
    }
    const companyFields = [
        { key: "name", label: "Company Name", description: "Your organization's official name", type: "text" },
        { key: "email", label: "Company Email", description: "Primary contact email address", type: "email" },
        { key: "phone", label: "Company Phone", description: "Main office phone number", type: "tel" },
        { key: "address", label: "Company Address", description: "Headquarters address", type: "text" },
        { key: "logo_url", label: "Logo URL", description: "Company logo image URL", type: "text" },
        { key: "tax_percentage", label: "Tax Percentage (%)", description: "Default tax percentage for invoices", type: "number" },
        { key: "gst_number", label: "GST/VAT Number", description: "Government registration number for GST/VAT", type: "text" }
    ]
    if (loading) {
        return (
            <div className="company-settings">
                <div className="loading">Loading company settings...</div>
            </div>
        )
    }
    return (
        <div className="company-settings theme-blue-white" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)', minHeight: '100vh' }}>
            {/* Header */}
            <div className="settings-header">
                <div>
                    <h1 className="settings-title" style={{ color: '#0052CC' }}>Company Settings</h1>
                    <p className="settings-subtitle">Manage your organization's information and financial settings</p>
                </div>
            </div>
            {/* Settings Card */}
            <div className="settings-card">
                <div className="settings-list">
                    {companyFields.map((field) => (
                        <div key={field.key} className="setting-item">
                            <div className="setting-label-section">
                                <label className="setting-label">{field.label}</label>
                                <p className="setting-description">{field.description}</p>
                            </div>
                            <div className="setting-value-section">
                                {editing === field.key ? (
                                    <div className="setting-edit">
                                        <input
                                            type={field.type || "text"}
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="setting-input"
                                            autoFocus
                                            step={field.type === "number" ? "0.01" : undefined}
                                            min={field.type === "number" ? "0" : undefined}
                                        />
                                        <div className="edit-actions">
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleSave(field.key)}
                                                disabled={saving}
                                                title="Save"
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={handleCancel}
                                                disabled={saving}
                                                title="Cancel"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="setting-display">
                                        <span className="setting-value">
                                            {field.key === "tax_percentage" ? (
                                                `${company[field.key]}%`
                                            ) : (
                                                company[field.key] || "—"
                                            )}
                                        </span>
                                        <button
                                            className="btn btn-sm btn-edit"
                                            onClick={() => handleEditClick(field.key, company[field.key])}
                                            title="Edit"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Info Box */}
            <div className="info-box">
                <p><strong>Note:</strong> Changes to company settings are applied immediately. Tax percentage is used in invoice calculations, and GST number is required for tax compliance.</p>
            </div>
        </div>
    )
}
