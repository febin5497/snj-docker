import { useState, useEffect } from 'react'
import api from '../../api/api'
import { useToast } from '../../components/Toast'
import FormModal from '../../components/FormModal'
import { FaPlus, FaCheck, FaInfoCircle } from 'react-icons/fa'
const GRNPage = () => {
  const [grns, setGrns] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isQCFormOpen, setIsQCFormOpen] = useState(false)
  const [selectedGRN, setSelectedGRN] = useState(null)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [formData, setFormData] = useState({
    purchase_order_id: '',
    receipt_date: '',
    vehicle_number: '',
    driver_name: '',
    items: [{ description: '', quantity_ordered: '', quantity_received: '' }]
  })
  const [qcData, setQCData] = useState({ status: 'pass', notes: '' })
  const [formErrors, setFormErrors] = useState([])
  const [formLoading, setFormLoading] = useState(false)
  const { showSuccess, showError } = useToast()
  useEffect(() => {
    loadGRNs()
    loadPurchaseOrders()
  }, [currentPage])
  const loadGRNs = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/procurement/grns?page=${currentPage}&per_page=10`)
      const raw = res.data?.data; setGrns(Array.isArray(raw) ? raw : (raw?.items || []));
      setTotalPages(res.data?.pagination?.pages || 1)
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to load GRNs')
    } finally {
      setLoading(false)
    }
  }
  const loadPurchaseOrders = async () => {
    try {
      const res = await api.get('/api/purchases')
      const raw2 = res.data?.data; setPurchaseOrders(Array.isArray(raw2) ? raw2 : (raw2?.items || []));
    } catch (err) {
      showError('Failed to load purchase orders')
    }
  }
  const handleCreateGRN = async () => {
    if (!formData.purchase_order_id || !formData.receipt_date) {
      showError('Please fill all required fields')
      return
    }
    try {
      setFormLoading(true)
      const payload = {
        ...formData,
        items: formData.items.filter(i => i.description && i.quantity_received)
      }
      await api.post('/api/procurement/grns', payload)
      showSuccess('GRN created')
      setIsFormOpen(false)
      loadGRNs()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create GRN')
    } finally {
      setFormLoading(false)
    }
  }
  const handleQualityCheck = async (grn) => {
    setSelectedGRN(grn)
    setIsQCFormOpen(true)
  }
  const submitQualityCheck = async () => {
    if (!selectedGRN) return
    try {
      await api.post(`/api/procurement/grns/${selectedGRN.id}/quality-check`, qcData)
      showSuccess('Quality check completed')
      setIsQCFormOpen(false)
      loadGRNs()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to submit quality check')
    }
  }
  const acceptGRN = async (grnId) => {
    try {
      await api.post(`/api/procurement/grns/${grnId}/accept`, {})
      showSuccess('GRN accepted')
      loadGRNs()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to accept GRN')
    }
  }
  const getStatusBadge = (status) => {
    const colors = {
      received: 'bg-blue-100 text-blue-800',
      inspected: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status] || colors.received
  }
  return (
    <div className="theme-blue-white" style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="header-blue-white">Goods Receipt Notes</h1>
            <p className="text-gray-600 mt-2">Track received materials and perform quality checks</p>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="btn-blue-white flex items-center gap-2">
            <FaPlus /> New GRN
          </button>
        </div>
        <div className="card-blue-white">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading GRNs...</div>
            </div>
          ) : grns.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500 text-lg">No GRNs created yet</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header-blue-white border-b text-left">
                    <th className="px-6 py-4 font-semibold text-gray-700">GRN #</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">PO ID</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Receipt Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">QC Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grns.map((grn) => (
                    <tr key={grn.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-blue-600">{grn.grn_number}</td>
                      <td className="px-6 py-4 text-gray-600">PO #{grn.purchase_order_id}</td>
                      <td className="px-6 py-4 text-gray-600">{grn.receipt_date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${grn.quality_check_status === 'pending' ? 'bg-gray-100 text-gray-800' : grn.quality_check_status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {grn.quality_check_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(grn.status)}`}>
                          {grn.status.charAt(0).toUpperCase() + grn.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {grn.status === 'received' && (
                          <button onClick={() => handleQualityCheck(grn)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Quality Check">
                            <FaInfoCircle size={16} />
                          </button>
                        )}
                        {grn.status === 'inspected' && (
                          <button onClick={() => acceptGRN(grn.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Accept">
                            <FaCheck size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t px-6 py-4 flex justify-between" style={{ backgroundColor: '#f0f5ff' }}>
                <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 disabled:opacity-50">Previous</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* GRN Form */}
      <FormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Create GRN" loading={formLoading} onSave={handleCreateGRN}>
        <div className="space-y-4">
          <select value={formData.purchase_order_id} onChange={(e) => setFormData({ ...formData, purchase_order_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Select Purchase Order *</option>
            {purchaseOrders.map(po => <option key={po.id} value={po.id}>PO #{po.id} - {po.supplier_name}</option>)}
          </select>
          <input type="date" value={formData.receipt_date} onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })} placeholder="Receipt Date *" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input type="text" value={formData.vehicle_number} onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} placeholder="Vehicle Number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input type="text" value={formData.driver_name} onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })} placeholder="Driver Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </FormModal>
      {/* Quality Check Form */}
      <FormModal isOpen={isQCFormOpen} onClose={() => setIsQCFormOpen(false)} title="Quality Check" loading={false} onSave={submitQualityCheck}>
        <div className="space-y-4">
          <select value={qcData.status} onChange={(e) => setQCData({ ...qcData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="partial">Partial</option>
          </select>
          <textarea value={qcData.notes} onChange={(e) => setQCData({ ...qcData, notes: e.target.value })} placeholder="Quality check notes" rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </FormModal>
    </div>
  )
}
export default GRNPage
