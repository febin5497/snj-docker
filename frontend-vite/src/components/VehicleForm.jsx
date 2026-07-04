import { useEffect, useState, useRef } from "react"
import api from "../api/api"
import { useToast } from "./Toast"

export default function VehicleForm({ vehicle, isOpen, onClose, onSaved, getFormRef }) {
  const { showSuccess, showError } = useToast()
  const formRef = useRef(null)

  // Expose form ref to parent component
  useEffect(() => {
    if (getFormRef) {
      getFormRef(formRef)
    }
  }, [getFormRef])

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    registration_number: "",
    mileage: "",
    status: "active",
    type: "private",
    registration_date: "",
    pollution_date: "",
    insurance_date: "",
    tax_date: "",
    geology_certificate_date: "",
    emi_status: false,
    emi_amount: ""
  })
  const [formErrors, setFormErrors] = useState([])
  const [loading, setLoading] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (vehicle && isOpen) {
      setFormData({
        make: vehicle.make || "",
        model: vehicle.model || "",
        year: vehicle.year || new Date().getFullYear(),
        registration_number: vehicle.registration_number || "",
        mileage: vehicle.mileage || "",
        status: vehicle.status || "active",
        type: vehicle.type || "private",
        registration_date: vehicle.registration_date || "",
        pollution_date: vehicle.pollution_date || "",
        insurance_date: vehicle.insurance_date || "",
        tax_date: vehicle.tax_date || "",
        geology_certificate_date: vehicle.geology_certificate_date || "",
        emi_status: vehicle.emi_status || false,
        emi_amount: vehicle.emi_amount || ""
      })
      setFormErrors([])
    } else if (!vehicle && isOpen) {
      setFormData({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        registration_number: "",
        mileage: "",
        status: "active",
        type: "private",
        registration_date: "",
        pollution_date: "",
        insurance_date: "",
        tax_date: "",
        geology_certificate_date: "",
        emi_status: false,
        emi_amount: ""
      })
      setFormErrors([])
    }
  }, [vehicle, isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setFormErrors([])
  }

  const validateForm = () => {
    const errors = []
    if (!formData.make.trim()) errors.push("Make is required")
    if (!formData.model.trim()) errors.push("Model is required")
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1)
      errors.push("Year must be valid")
    if (!formData.registration_number.trim()) errors.push("Registration number is required")
    if (!formData.type) errors.push("Vehicle type is required")

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = validateForm()
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    setLoading(true)
    try {
      const payload = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        registration_number: formData.registration_number.trim(),
        mileage: formData.mileage ? parseFloat(formData.mileage) : null,
        status: formData.status,
        type: formData.type,
        registration_date: formData.registration_date || null,
        pollution_date: formData.pollution_date || null,
        insurance_date: formData.insurance_date || null,
        tax_date: formData.tax_date || null,
        geology_certificate_date: formData.geology_certificate_date || null,
        emi_status: formData.emi_status,
        emi_amount: formData.emi_status && formData.emi_amount ? parseFloat(formData.emi_amount) : null
      }

      if (vehicle && vehicle.id) {
        // Update existing vehicle
        await api.put(`/api/vehicles/${vehicle.id}`, payload)
        showSuccess("Vehicle updated successfully!")
      } else {
        // Create new vehicle
        await api.post("/api/vehicles/vehicles", payload)
        showSuccess("Vehicle created successfully!")
      }

      onSaved()
      onClose()
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Failed to save vehicle"
      showError(errorMsg)
      setFormErrors([errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {/* Error Messages */}
      {formErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-semibold mb-2">Please fix the following errors:</p>
          <ul className="text-red-600 text-sm space-y-1">
            {formErrors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Make & Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Make <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              placeholder="e.g., Tata"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g., 407"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>
        </div>

        {/* Year & Registration Number */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Registration # <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
              placeholder="e.g., KL-01-AB-1234"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>
        </div>

        {/* Mileage & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mileage (km)
            </label>
            <input
              type="number"
              name="mileage"
              value={formData.mileage}
              onChange={handleChange}
              placeholder="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Vehicle Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
            disabled={loading}
          >
            <option value="private">Private</option>
            <option value="commercial">Commercial</option>
            <option value="tipper">Commercial (Tipper)</option>
          </select>
        </div>

        {/* Conditional Fields - Private */}
        {(formData.type === "private") && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-gray-700">Private Vehicle Dates</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Registration Date
                </label>
                <input
                  type="date"
                  name="registration_date"
                  value={formData.registration_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pollution Certificate
                </label>
                <input
                  type="date"
                  name="pollution_date"
                  value={formData.pollution_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Insurance Date
                </label>
                <input
                  type="date"
                  name="insurance_date"
                  value={formData.insurance_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Conditional Fields - Commercial or Tipper */}
        {(formData.type === "commercial" || formData.type === "tipper") && (
          <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-gray-700">Commercial Vehicle Dates</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tax Certificate Date
                </label>
                <input
                  type="date"
                  name="tax_date"
                  value={formData.tax_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={loading}
                />
              </div>
              {formData.type === "tipper" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Geology Certificate Date
                  </label>
                  <input
                    type="date"
                    name="geology_certificate_date"
                    value={formData.geology_certificate_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMI Fields */}
        <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="emi_status"
              checked={formData.emi_status}
              onChange={handleChange}
              disabled={loading}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="font-semibold text-gray-700">Vehicle has EMI</span>
          </label>

          {formData.emi_status && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                EMI Amount (₹)
              </label>
              <input
                type="number"
                name="emi_amount"
                value={formData.emi_amount}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
