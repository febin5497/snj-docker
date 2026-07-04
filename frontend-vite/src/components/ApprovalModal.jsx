import { useState } from 'react'
import FormModal from './FormModal'
import { useToast } from './Toast'

const ApprovalModal = ({ isOpen, onClose, entity, onApprove, onReject, loading = false }) => {
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [approvalAction, setApprovalAction] = useState('approve') // 'approve' or 'reject'
  const [formErrors, setFormErrors] = useState([])
  const { showError } = useToast()

  const validateForm = () => {
    const errors = []

    if (approvalAction === 'approve' && !approvalNotes.trim()) {
      errors.push('Approval notes are required')
    }

    if (approvalAction === 'reject' && !rejectionReason.trim()) {
      errors.push('Rejection reason is required')
    }

    setFormErrors(errors)
    return errors.length === 0
  }

  const handleApproveClick = async () => {
    if (!validateForm()) return

    await onApprove({
      notes: approvalNotes,
      reason: ''
    })

    setApprovalNotes('')
    setApprovalAction('approve')
    setFormErrors([])
  }

  const handleRejectClick = async () => {
    if (!validateForm()) return

    await onReject({
      notes: '',
      reason: rejectionReason
    })

    setRejectionReason('')
    setApprovalAction('approve')
    setFormErrors([])
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${approvalAction === 'approve' ? 'Approve' : 'Reject'} Request`}
      loading={loading}
      onSave={approvalAction === 'approve' ? handleApproveClick : handleRejectClick}
      saveButtonLabel={approvalAction === 'approve' ? 'Approve' : 'Reject'}
      saveButtonColor={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
    >
      <div className="space-y-6">
        {formErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            {formErrors.map((error, idx) => (
              <div key={idx} className="text-red-700 text-sm">{error}</div>
            ))}
          </div>
        )}

        {/* Entity Details */}
        {entity && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {entity.staff_name && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Staff:</span>
                <span className="text-gray-600 ml-2">{entity.staff_name}</span>
              </div>
            )}
            {entity.project_name && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Project:</span>
                <span className="text-gray-600 ml-2">{entity.project_name}</span>
              </div>
            )}
            {entity.amount && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Amount:</span>
                <span className="text-gray-600 ml-2">₹{Number(entity.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {entity.total && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Total:</span>
                <span className="text-gray-600 ml-2">₹{Number(entity.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {entity.description && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Description:</span>
                <span className="text-gray-600 ml-2">{entity.description}</span>
              </div>
            )}
            {entity.approval_tier && (
              <div className="text-sm pt-2 border-t border-gray-300">
                <span className="font-semibold text-gray-700">Approval Tier:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                  entity.approval_tier === 'Tier1'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {entity.approval_tier} - {entity.approvals_received}/{entity.approvals_required}
                </span>
              </div>
            )}
            {entity.approval_tier === 'Tier2' && entity.approvals_received === 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                ✓ First approval received. This is the second approval phase. Once approved, the expense will be fully approved.
              </div>
            )}
          </div>
        )}

        {/* Action Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Action</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="approve"
                checked={approvalAction === 'approve'}
                onChange={(e) => {
                  setApprovalAction(e.target.value)
                  setFormErrors([])
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Approve</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="reject"
                checked={approvalAction === 'reject'}
                onChange={(e) => {
                  setApprovalAction(e.target.value)
                  setFormErrors([])
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Reject</span>
            </label>
          </div>
        </div>

        {/* Approval Notes */}
        {approvalAction === 'approve' && (
          <div className="space-y-2">
            <label htmlFor="approvalNotes" className="block text-sm font-medium text-gray-700">
              Approval Notes
            </label>
            <textarea
              id="approvalNotes"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Enter approval notes or comments..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Rejection Reason */}
        {approvalAction === 'reject' && (
          <div className="space-y-2">
            <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
              Rejection Reason
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        )}
      </div>
    </FormModal>
  )
}

export default ApprovalModal
