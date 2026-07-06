import { useState, useEffect } from 'react'
import api from '../../api/api'
import { useToast } from '../../components/Toast'
import FormModal from '../../components/FormModal'
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
const BudgetPage = () => {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [projects, setProjects] = useState([])
  const [formData, setFormData] = useState({
    project_id: '',
    total_budget: '',
    start_date: '',
    end_date: '',
    description: '',
    categories: [{ category: '', allocated_amount: '' }]
  })
  const [formErrors, setFormErrors] = useState([])
  const [formLoading, setFormLoading] = useState(false)
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()
  useEffect(() => {
    loadBudgets()
    loadProjects()
  }, [currentPage, perPage])
  const loadBudgets = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/finance/budgets?page=${currentPage}&per_page=${perPage}`)
      const raw = res.data?.data; setBudgets(Array.isArray(raw) ? raw : (raw?.items || []))
      setTotalPages(res.data?.pagination?.pages || 1)
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }
  const loadProjects = async () => {
    try {
      const res = await api.get('/api/projects')
      const raw2 = res.data?.data; setProjects(Array.isArray(raw2) ? raw2 : (raw2?.items || raw2?.projects || []))
    } catch (err) {
      showError('Failed to load projects')
    }
  }
  const validateForm = () => {
    const errors = []
    if (!formData.project_id) errors.push('Project is required')
    if (!formData.total_budget || parseFloat(formData.total_budget) <= 0) errors.push('Total budget must be positive')
    if (!formData.start_date) errors.push('Start date is required')
    const hasValidCategory = formData.categories.some(c => c.category && c.allocated_amount)
    if (!hasValidCategory) errors.push('At least one budget category is required')
    const totalAllocated = formData.categories.reduce((sum, c) => sum + (parseFloat(c.allocated_amount) || 0), 0)
    if (totalAllocated > parseFloat(formData.total_budget)) {
      errors.push('Total allocated exceeds total budget')
    }
    setFormErrors(errors)
    return errors.length === 0
  }
  const handleSave = async () => {
    if (!validateForm()) return
    try {
      setFormLoading(true)
      const payload = {
        ...formData,
        total_budget: parseFloat(formData.total_budget),
        categories: formData.categories.filter(c => c.category && c.allocated_amount)
          .map(c => ({
            ...c,
            allocated_amount: parseFloat(c.allocated_amount)
          }))
      }
      if (selectedBudget) {
        await api.put(`/api/finance/budgets/${selectedBudget.id}`, payload)
        showSuccess('Budget updated successfully')
      } else {
        await api.post('/api/finance/budgets', payload)
        showSuccess('Budget created successfully')
      }
      setIsFormOpen(false)
      loadBudgets()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save budget')
    } finally {
      setFormLoading(false)
    }
  }
  const handleEdit = (budget) => {
    setSelectedBudget(budget)
    setFormData({
      project_id: budget.project_id,
      total_budget: budget.total_budget,
      start_date: budget.start_date,
      end_date: budget.end_date,
      description: budget.description,
      categories: budget.categories || [{ category: '', allocated_amount: '' }]
    })
    setIsFormOpen(true)
  }
  const handleDelete = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return
    try {
      await api.delete(`/api/finance/budgets/${budgetId}`)
      showSuccess('Budget deleted successfully')
      loadBudgets()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete budget')
    }
  }
  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedBudget(null)
    setFormData({
      project_id: '',
      total_budget: '',
      start_date: '',
      end_date: '',
      description: '',
      categories: [{ category: '', allocated_amount: '' }]
    })
    setFormErrors([])
  }
  const addCategory = () => {
    setFormData({
      ...formData,
      categories: [...formData.categories, { category: '', allocated_amount: '' }]
    })
  }
  const updateCategory = (index, field, value) => {
    const newCategories = [...formData.categories]
    newCategories[index][field] = value
    setFormData({ ...formData, categories: newCategories })
  }
  const removeCategory = (index) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index)
    })
  }
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
  }
  return (
    <div className="p-6 min-h-screen page-bg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Budget Management</h1>
            <p className="text-secondary mt-2">Create and manage project budgets</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition font-medium bg-primary-gradient"
          >
            <FaPlus /> New Budget
          </button>
        </div>
        {/* Budgets Table */}
        <div className="card-bg rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-muted">Loading budgets...</div>
            </div>
          ) : budgets.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <p className="text-muted text-lg">No budgets created yet</p>
              </div>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default text-left">
                    <th className="px-6 py-4 font-semibold text-primary">Project</th>
                    <th className="px-6 py-4 font-semibold text-primary">Total Budget</th>
                    <th className="px-6 py-4 font-semibold text-primary">Allocated</th>
                    <th className="px-6 py-4 font-semibold text-primary">Spent</th>
                    <th className="px-6 py-4 font-semibold text-primary">Utilization</th>
                    <th className="px-6 py-4 font-semibold text-primary">Status</th>
                    <th className="px-6 py-4 font-semibold text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => (
                    <tr key={budget.id} className="border-b border-default">
                      <td className="px-6 py-4 font-medium text-primary">
                        Project #{budget.project_id}
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {formatCurrency(budget.total_budget)}
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {formatCurrency(budget.total_allocated)}
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {formatCurrency(budget.total_spent)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-32 rounded-full h-2 progress-bar-bg">
                            <div
                              className="h-2 rounded-full transition-all progress-bar-fill"
                              style={{
                                backgroundColor: budget.utilization_percent > 100 ? '#ef4444' : '#0052CC',
                                width: `${Math.min(budget.utilization_percent, 100)}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {budget.utilization_percent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          budget.status === 'active'
                            ? 'bg-success/15 text-success'
                            : 'bg-white/10 text-secondary'
                        }`}>
                          {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => navigate(`/budget/${budget.id}`)}
                          className="p-2 rounded-lg transition text-primary"
                          title="View details"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(budget)}
                          className="p-2 rounded-lg transition text-success"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="p-2 rounded-lg transition text-danger"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              <div className="border-t border-default px-6 py-4 flex justify-between">
                <div className="text-sm text-secondary">Page {currentPage} of {totalPages}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg disabled:opacity-50 transition border-primary text-primary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg disabled:opacity-50 transition border-primary text-primary"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Budget Form Modal */}
      <FormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        title={selectedBudget ? 'Edit Budget' : 'Create New Budget'}
        loading={formLoading}
        onSave={handleSave}
      >
        <div className="space-y-6">
          {formErrors.length > 0 && (
            <div className="border border-danger/30 rounded-lg p-4" style={{backgroundColor: 'rgba(255,107,107,0.1)'}}>
              {formErrors.map((error, idx) => (
                <div key={idx} className="text-danger text-sm">{error}</div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Project *</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border-default"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Total Budget (₹) *</label>
              <input
                type="number"
                value={formData.total_budget}
                onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                placeholder="Enter total budget"
                className="w-full px-3 py-2 rounded-lg border-default"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Start Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border-default"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border-default"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Budget description"
              rows="3"
              className="w-full px-3 py-2 rounded-lg border-default"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">Budget Categories *</label>
              <button
                onClick={addCategory}
                className="text-sm font-medium transition text-primary"
              >
                + Add Category
              </button>
            </div>
            {formData.categories.map((cat, idx) => (
              <div key={idx} className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={cat.category}
                    onChange={(e) => updateCategory(idx, 'category', e.target.value)}
                    placeholder="Category (material, labor, etc)"
                    className="w-full px-3 py-2 rounded-lg text-sm border-default"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="number"
                    value={cat.allocated_amount}
                    onChange={(e) => updateCategory(idx, 'allocated_amount', e.target.value)}
                    placeholder="Allocated Amount"
                    className="w-full px-3 py-2 rounded-lg text-sm border-default"
                  />
                </div>
                {formData.categories.length > 1 && (
                  <button
                    onClick={() => removeCategory(idx)}
                    className="p-2 rounded-lg transition text-danger"
                  >
                    <FaTrash size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </FormModal>
    </div>
  )
}
export default BudgetPage