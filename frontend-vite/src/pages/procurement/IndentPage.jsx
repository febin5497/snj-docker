import { useState, useEffect } from 'react'
import api from '../../api/api'
import { useToast } from '../../components/Toast'
import FormModal from '../../components/FormModal'
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa'
const IndentPage = () => {
  const [indents, setIndents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedIndent, setSelectedIndent] = useState(null)
  const [projects, setProjects] = useState([])
  const [formData, setFormData] = useState({
    project_id: '',
    description: '',
    justification: '',
    required_by_date: '',
    items: [{ description: '', quantity: '', unit: 'qty', estimated_rate: '' }]
  })
  const [formErrors, setFormErrors] = useState([])
  const [formLoading, setFormLoading] = useState(false)
  const { showSuccess, showError } = useToast()
  useEffect(() => {
    loadIndents()
    loadProjects()
  }, [currentPage])
  const loadIndents = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/procurement/indents?page=${currentPage}&per_page=10`)
      const raw = res.data?.data; setIndents(Array.isArray(raw) ? raw : (raw?.items || []));
      setTotalPages(res.data?.pagination?.pages || 1)
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to load indents')
    } finally {
      setLoading(false)
    }
  }
  const loadProjects = async () => {
    try {
      const res = await api.get('/api/projects')
      const raw3 = res.data?.data; setProjects(Array.isArray(raw3) ? raw3 : (raw3?.items || raw3?.projects || []))
    } catch (err) {
      showError('Failed to load projects')
    }
  }
  const validateForm = () => {
    const errors = []
    if (!formData.description) errors.push('Description is required')
    if (!formData.required_by_date) errors.push('Required by date is required')
    if (formData.items.length === 0) errors.push('At least one item is required')
    const hasValidItem = formData.items.some(i => i.description && i.quantity)
    if (!hasValidItem) errors.push('At least one valid item is required')
    setFormErrors(errors)
    return errors.length === 0
  }
  const handleSave = async () => {
    if (!validateForm()) return
    try {
      setFormLoading(true)
      const payload = {
        ...formData,
        items: formData.items.filter(i => i.description && i.quantity)
      }
      if (selectedIndent) {
        await api.put(`/api/procurement/indents/${selectedIndent.id}`, payload)
        showSuccess('Indent updated')
      } else {
        await api.post('/api/procurement/indents', payload)
        showSuccess('Indent created')
      }
      handleCloseForm()
      loadIndents()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save indent')
    } finally {
      setFormLoading(false)
    }
  }
  const handleSubmit = async (indentId) => {
    try {
      await api.post(`/api/procurement/indents/${indentId}/submit`, {})
      showSuccess('Indent submitted for approval')
      loadIndents()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to submit indent')
    }
  }
  const handleApprove = async (indentId) => {
    try {
      await api.post(`/api/procurement/indents/${indentId}/approve`, {})
      showSuccess('Indent approved')
      loadIndents()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to approve indent')
    }
  }
  const handleEdit = (indent) => {
    setSelectedIndent(indent)
    setFormData({
      project_id: indent.project_id,
      description: indent.description,
      justification: indent.justification,
      required_by_date: indent.required_by_date,
      items: indent.items || [{ description: '', quantity: '', unit: 'qty' }]
    })
    setIsFormOpen(true)
  }
  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedIndent(null)
    setFormData({
      project_id: '',
      description: '',
      justification: '',
      required_by_date: '',
      items: [{ description: '', quantity: '', unit: 'qty', estimated_rate: '' }]
    })
    setFormErrors([])
  }
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: '', unit: 'qty', estimated_rate: '' }]
    })
  }
  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }
  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status] || colors.draft
  }
  return (
    <div className="theme-blue-white" style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="header-blue-white">Purchase Indents</h1>
            <p className="text-gray-600 mt-2">Create and manage material requests</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-blue-white flex items-center gap-2"
          >
            <FaPlus /> New Indent
          </button>
        </div>
        {/* Table */}
        <div className="card-blue-white">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading indents...</div>
            </div>
          ) : indents.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500 text-lg">No indents yet</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header-blue-white border-b text-left">
                    <th className="px-6 py-4 font-semibold text-gray-700">Indent #</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Description</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Items</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Required By</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {indents.map((indent) => (
                    <tr key={indent.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-blue-600">{indent.indent_number}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{indent.description}</td>
                      <td className="px-6 py-4 text-gray-600">{indent.items?.length || 0} items</td>
                      <td className="px-6 py-4 text-gray-600">{indent.required_by_date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(indent.status)}`}>
                          {indent.status.charAt(0).toUpperCase() + indent.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {indent.status === 'draft' && (
                          <>
                            <button onClick={() => handleEdit(indent)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Edit">
                              <FaEdit size={16} />
                            </button>
                            <button onClick={() => handleSubmit(indent.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Submit">
                              <FaCheck size={16} />
                            </button>
                          </>
                        )}
                        {indent.status === 'submitted' && (
                          <button onClick={() => handleApprove(indent.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                            <FaCheck size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              <div className="border-t px-6 py-4 flex justify-between" style={{ backgroundColor: '#f0f5ff' }}>
                <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-100 disabled:opacity-50">Previous</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-100 disabled:opacity-50">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Form Modal */}
      <FormModal isOpen={isFormOpen} onClose={handleCloseForm} title={selectedIndent ? 'Edit Indent' : 'Create Indent'} loading={formLoading} onSave={handleSave}>
        <div className="space-y-6">
          {formErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              {formErrors.map((err, i) => <div key={i} className="text-red-700 text-sm">{err}</div>)}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Project</label>
            <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Select Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Indent description" rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Justification</label>
            <textarea value={formData.justification} onChange={(e) => setFormData({ ...formData, justification: e.target.value })} placeholder="Why is this needed?" rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Required By Date *</label>
            <input type="date" value={formData.required_by_date} onChange={(e) => setFormData({ ...formData, required_by_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Items *</label>
              <button onClick={addItem} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add Item</button>
            </div>
            {formData.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <input type="text" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Description" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} placeholder="Qty" className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <select value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>qty</option>
                  <option>bag</option>
                  <option>meter</option>
                  <option>liter</option>
                </select>
                {formData.items.length > 1 && <button onClick={() => removeItem(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash size={14} /></button>}
              </div>
            ))}
          </div>
        </div>
      </FormModal>
    </div>
  )
}
export default IndentPage
