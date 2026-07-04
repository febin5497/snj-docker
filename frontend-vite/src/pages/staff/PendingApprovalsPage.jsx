import { useState, useEffect } from 'react'
import api from '../../api/api'
import { useToast } from '../../components/Toast'
import { FaCheckCircle, FaTimesCircle, FaClock, FaFilter, FaSearch, FaShieldAlt } from 'react-icons/fa'
const PendingApprovalsPage = () => {
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedExpenseForRejection, setSelectedExpenseForRejection] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { showSuccess, showError } = useToast()
  useEffect(() => { loadApprovals() }, [currentPage, perPage, entityTypeFilter])
  const loadApprovals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: currentPage, per_page: perPage, status: 'pending', approval_tier: 'Tier2_second' })
      const res = await api.get(`/api/staff/approvals/expenses?${params}`)
      setPendingApprovals(res.data?.data || [])
      setTotalPages(res.data?.pagination?.pages || 1)
    } catch (err) { showError(err.response?.data?.error || 'Failed to load pending approvals') }
    finally { setLoading(false) }
  }
  const handleDirectApprove = async (expense) => {
    try { setApprovalLoading(true); await api.post(`/api/staff/expenses/${expense.id}/approve`); showSuccess('Second approval recorded!'); loadApprovals() }
    catch (err) { showError(err.response?.data?.error || 'Failed to approve') }
    finally { setApprovalLoading(false) }
  }
  const handleDirectReject = (expense) => { setSelectedExpenseForRejection(expense); setRejectionReason(''); setRejectionModalOpen(true) }
  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) { showError('Please provide a rejection reason'); return }
    try {
      setApprovalLoading(true)
      await api.post(`/api/staff/expenses/${selectedExpenseForRejection.id}/reject`, { rejection_reason: rejectionReason })
      showSuccess('Expense rejected successfully'); setRejectionModalOpen(false); setRejectionReason(''); setSelectedExpenseForRejection(null); loadApprovals()
    } catch (err) { showError(err.response?.data?.error || 'Failed to reject') }
    finally { setApprovalLoading(false) }
  }
  const getStatusBadge = (status) => {
    const badges = { pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock }, approved: { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheckCircle }, rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: FaTimesCircle } }
    const badge = badges[status] || badges.pending; const Icon = badge.icon
    return <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}><Icon size={14} />{status.charAt(0).toUpperCase() + status.slice(1)}</span>
  }
  const filteredApprovals = pendingApprovals.filter(exp => !searchTerm || exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) || exp.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  const totalAmount = pendingApprovals.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const criticalApprovals = pendingApprovals.filter(exp => exp.amount > 200000).length
  return (
    <div className="page-bg">
      <div className="p-6"><div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Final Approval Required</h1>
            <p className="text-secondary text-lg flex items-center gap-2"><FaShieldAlt className="text-warning" />Tier 2 - Second Level Approval (&gt;₹50,000)</p>
          </div>
          <div className="text-right"><div className="text-3xl font-bold text-warning">₹{totalAmount.toLocaleString('en-IN')}</div><p className="text-secondary text-sm">Awaiting Final Approval</p></div>
        </div>
        {criticalApprovals > 0 && (
          <div className="rounded-lg p-4 mb-8 flex items-start gap-4 bg-red-900/20 border-l-4 border-danger">
            <FaTimesCircle className="text-xl flex-shrink-0 mt-0.5 text-danger" />
            <div><h3 className="font-bold text-danger">Critical Approvals Pending</h3><p className="text-sm mt-1 text-secondary"><strong>{criticalApprovals} expense(s)</strong> exceeding ₹2,00,000</p></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="stat-card"><p className="text-secondary text-sm font-medium">Pending Final Approvals</p><p className="text-3xl font-bold mt-2">{pendingApprovals.length}</p></div>
          <div className="stat-card"><p className="text-secondary text-sm font-medium">Total Amount</p><p className="text-3xl font-bold mt-2">₹{(totalAmount / 100000).toFixed(1)}L</p></div>
          <div className="stat-card" style={{borderLeftColor: criticalApprovals > 0 ? 'var(--color-danger)' : 'var(--color-primary)'}}>
            <p className="text-sm font-medium" style={{color: criticalApprovals > 0 ? 'var(--color-danger)' : 'var(--color-primary)'}}>Critical Items (&gt;₹2L)</p>
            <p className="text-3xl font-bold mt-2" style={{color: criticalApprovals > 0 ? 'var(--color-danger)' : 'var(--text-primary)'}}>{criticalApprovals}</p>
          </div>
        </div>
        <div className="card-bg p-4 mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[250px] relative"><FaSearch className="absolute left-3 top-3 text-muted" />
              <input type="text" placeholder="Search by staff, project, or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <div className="flex items-center gap-2"><FaFilter className="text-muted" size={16} />
              <select value={entityTypeFilter} onChange={(e) => { setEntityTypeFilter(e.target.value); setCurrentPage(1) }} className="px-4 py-2 border rounded-lg">
                <option value="">All Categories</option><option value="Materials">Materials</option><option value="Labor">Labor</option><option value="Equipment">Equipment</option><option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-bg border overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64"><div className="text-center"><div className="inline-block animate-spin"><div className="h-12 w-12 border-4 border-orange-200 border-t-orange-600 rounded-full"></div></div><p className="text-secondary mt-4">Loading...</p></div></div>
          ) : filteredApprovals.length === 0 ? (
            <div className="flex justify-center items-center h-64"><div className="text-center"><FaCheckCircle className="mx-auto text-5xl text-success mb-4" /><p className="text-lg font-medium">All set!</p><p className="text-secondary mt-2">No expenses awaiting final approval</p></div></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr>
                    <th className="px-6 py-4 font-semibold">Staff</th><th className="px-6 py-4 font-semibold">Project</th><th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Category</th><th className="px-6 py-4 font-semibold text-right">Amount</th><th className="px-6 py-4 font-semibold">Status</th><th className="px-6 py-4 font-semibold text-center">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredApprovals.map((expense) => (
                      <tr key={expense.id} className="border-b group">
                        <td className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">{expense.staff_name?.[0] || 'U'}</div>{expense.staff_name || 'Unknown'}</div></td>
                        <td className="px-6 py-4 text-secondary font-medium">{expense.project_name || 'Unassigned'}</td>
                        <td className="px-6 py-4"><span className="px-3 py-1 rounded-md font-medium text-xs bg-primary text-white">{expense.description}</span></td>
                        <td className="px-6 py-4 text-secondary"><span className="px-2 py-1 rounded bg-badge text-secondary text-xs">{expense.category}</span></td>
                        <td className="px-6 py-4 text-right"><span className={`font-bold text-lg ${expense.amount > 200000 ? 'text-danger' : ''}`}>₹{expense.amount?.toLocaleString('en-IN')}</span></td>
                        <td className="px-6 py-4">{getStatusBadge(expense.status)}</td>
                        <td className="px-6 py-4 text-center"><div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => handleDirectApprove(expense)} disabled={approvalLoading} className="btn-primary px-4 py-2 text-white rounded-lg transition text-xs font-medium disabled:opacity-50">✓ Approve</button>
                          <button onClick={() => handleDirectReject(expense)} disabled={approvalLoading} className="btn-danger px-4 py-2 rounded-lg transition text-xs font-medium disabled:opacity-50">✕ Reject</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t px-6 py-4 flex items-center justify-between">
                <div className="text-secondary text-sm">Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span></div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary px-4 py-2 rounded-lg transition text-sm">← Previous</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary px-4 py-2 rounded-lg transition text-sm">Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div></div>
      {rejectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-bg rounded-lg max-w-md w-full">
            <div className="border-b px-6 py-4 bg-red-900/20"><h3 className="text-xl font-bold text-danger">Reject Expense</h3><p className="text-secondary text-sm mt-1">{selectedExpenseForRejection?.description} - ₹{selectedExpenseForRejection?.amount?.toLocaleString('en-IN')}</p></div>
            <div className="px-6 py-4"><label className="block text-sm font-medium mb-3">Rejection Reason <span className="text-danger">*</span></label>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Provide a clear reason..." className="w-full px-4 py-3 border rounded-lg resize-none" rows="4" />
            </div>
            <div className="border-t px-6 py-4 flex gap-3 justify-end">
              <button onClick={() => { setRejectionModalOpen(false); setRejectionReason(''); setSelectedExpenseForRejection(null) }} className="btn-secondary px-6 py-2 rounded-lg font-medium transition">Cancel</button>
              <button onClick={handleConfirmReject} disabled={approvalLoading} className="btn-danger px-6 py-2 rounded-lg font-medium transition disabled:opacity-50">{approvalLoading ? 'Rejecting...' : 'Confirm Rejection'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default PendingApprovalsPage
