import { useEffect, useState } from "react"
import api from "../api/api"
import { useToast } from "./Toast"

export default function MaterialForm({ material, isOpen, onClose, onSaved }) {
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    unit_of_measurement: "",
    price: "",
    project_id: ""
  })
  const [formErrors, setFormErrors] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Populate form when editing
  useEffect(() => {
    if (material && isOpen) {
      setFormData({
        name: material.name || "",
        description: material.description || "",
        quantity: material.quantity || "",
        unit_of_measurement: material.unit_of_measurement || "",
        price: material.price || "",
        project_id: material.project_id || ""
      })
      setFormErrors([])
    } else if (!material && isOpen) {
      setFormData({
        name: "",
        description: "",
        quantity: "",
        unit_of_measurement: "",
        price: "",
        project_id: ""
      })
      setFormErrors([])
    }
  }, [material, isOpen])

  const loadProjects = async () => {
    try {
      const res = await api.get("/api/projects")
      // API returns { data: [...], success: true, message: "..." }
      const projectsData = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.projects)
        ? res.data.projects
        : Array.isArray(res.data)
        ? res.data
        : []
      setProjects(projectsData)
    } catch (error) {
      console.error("Failed to load projects:", error)
      setProjects([])
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setFormErrors([])
  }

  const validateForm = () => {
    const errors = []
    if (!formData.name.trim()) errors.push("Material name is required")
    if (!formData.quantity || parseFloat(formData.quantity) < 0) errors.push("Quantity must be a valid number")
    if (!formData.price || parseFloat(formData.price) < 0) errors.push("Price must be a valid number")

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
        name: formData.name.trim(),
        description: formData.description.trim(),
        quantity: parseFloat(formData.quantity),
        unit_of_measurement: formData.unit_of_measurement.trim(),
        price: parseFloat(formData.price),
        project_id: formData.project_id ? parseInt(formData.project_id) : null
      }

      if (material && material.id) {
        // Update existing material
        await api.put(`/api/materials/${material.id}`, payload)
        showSuccess("Material updated successfully!")
      } else {
        // Create new material
        await api.post("/api/materials", payload)
        showSuccess("Material created successfully!")
      }

      onSaved()
      onClose()
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Failed to save material"
      showError(errorMsg)
      setFormErrors([errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Material Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Cement Bags"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            disabled={loading}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description"
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
            disabled={loading}
          />
        </div>

        {/* Grid: Quantity, Unit, Price */}
        <div className="grid grid-cols-3 gap-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Unit
            </label>
            <input
              type="text"
              name="unit_of_measurement"
              value={formData.unit_of_measurement}
              onChange={handleChange}
              placeholder="e.g., kg, ltr, pcs"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>
        </div>

        {/* Project */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Project
          </label>
          <select
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
            disabled={loading}
          >
            <option value="">Select a project (optional)</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </form>
  )
}
