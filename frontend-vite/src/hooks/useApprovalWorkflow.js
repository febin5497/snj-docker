/**
 * useApprovalWorkflow Hook - Multi-Level Approval Management
 *
 * Manages approval workflows including:
 * - Fetching pending approvals for current user
 * - Approving requests with notes
 * - Rejecting requests with reasons
 * - Fetching approval history
 * - Checking approval status
 * - Filtering by entity type
 *
 * Eliminates 30-40 lines of boilerplate per approval page
 */

import { useState, useCallback, useEffect } from 'react'
import api from '../api/api'

export const useApprovalWorkflow = (entityType = null, options = {}) => {
    const {
        onApprovalSuccess,
        onRejectionSuccess,
        onError,
        autoFetch = true
    } = options

    const [approvals, setApprovals] = useState([])
    const [selectedApproval, setSelectedApproval] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [approvalLoading, setApprovalLoading] = useState(false)
    const [error, setError] = useState(null)
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 10,
        total: 0,
        pages: 0
    })

    /**
     * Fetch pending approvals for current user
     */
    const fetchPendingApprovals = useCallback(async (page = 1, perPage = 10) => {
        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                page,
                per_page: perPage
            })

            if (entityType) {
                params.append('entity_type', entityType)
            }

            const response = await api.get(`/api/approvals/pending?${params}`)
            const data = response.data?.data || []

            setApprovals(data)
            setPagination({
                page,
                per_page: perPage,
                total: response.data?.total || 0,
                pages: response.data?.pages || 0
            })
        } catch (err) {
            console.error('Failed to fetch pending approvals:', err)
            setError(err.response?.data?.message || 'Failed to fetch approvals')
            if (onError) onError(err)
        } finally {
            setLoading(false)
        }
    }, [entityType, onError])

    /**
     * Fetch approval history for a specific approval
     */
    const fetchApprovalHistory = useCallback(async (approvalId) => {
        setLoading(true)
        setError(null)

        try {
            const response = await api.get(`/api/approvals/${approvalId}/history`)
            const historyData = response.data?.data || []
            setHistory(historyData)
        } catch (err) {
            console.error('Failed to fetch approval history:', err)
            setError(err.response?.data?.message || 'Failed to fetch history')
            if (onError) onError(err)
        } finally {
            setLoading(false)
        }
    }, [onError])

    /**
     * Approve a pending request
     */
    const approve = useCallback(async (approvalId, notes = '') => {
        setApprovalLoading(true)
        setError(null)

        try {
            const response = await api.post(`/api/approvals/${approvalId}/approve`, {
                notes
            })

            const approved = response.data?.data

            // Update local state
            setApprovals(prev =>
                prev.map(a => a.id === approvalId ? approved : a)
            )
            setSelectedApproval(approved)

            if (onApprovalSuccess) {
                onApprovalSuccess(approved)
            }

            return approved
        } catch (err) {
            console.error('Failed to approve:', err)
            setError(err.response?.data?.message || 'Approval failed')
            if (onError) onError(err)
            throw err
        } finally {
            setApprovalLoading(false)
        }
    }, [onApprovalSuccess, onError])

    /**
     * Reject a pending request
     */
    const reject = useCallback(async (approvalId, reason = '') => {
        setApprovalLoading(true)
        setError(null)

        try {
            const response = await api.post(`/api/approvals/${approvalId}/reject`, {
                reason
            })

            const rejected = response.data?.data

            // Update local state
            setApprovals(prev =>
                prev.map(a => a.id === approvalId ? rejected : a)
            )
            setSelectedApproval(rejected)

            if (onRejectionSuccess) {
                onRejectionSuccess(rejected)
            }

            return rejected
        } catch (err) {
            console.error('Failed to reject:', err)
            setError(err.response?.data?.message || 'Rejection failed')
            if (onError) onError(err)
            throw err
        } finally {
            setApprovalLoading(false)
        }
    }, [onRejectionSuccess, onError])

    /**
     * Get approval details
     */
    const getApprovalDetails = useCallback(async (approvalId) => {
        setLoading(true)
        setError(null)

        try {
            const response = await api.get(`/api/approvals/${approvalId}`)
            const approval = response.data?.data
            setSelectedApproval(approval)
            return approval
        } catch (err) {
            console.error('Failed to fetch approval details:', err)
            setError(err.response?.data?.message || 'Failed to fetch details')
            if (onError) onError(err)
        } finally {
            setLoading(false)
        }
    }, [onError])

    /**
     * Get approval statistics
     */
    const fetchApprovalStats = useCallback(async () => {
        try {
            const response = await api.get('/api/approvals/stats')
            return response.data?.data || {}
        } catch (err) {
            console.error('Failed to fetch approval stats:', err)
            if (onError) onError(err)
        }
    }, [onError])

    /**
     * Get approvals for a specific entity
     */
    const getEntityApprovals = useCallback(async (entityType, entityId) => {
        setLoading(true)
        setError(null)

        try {
            const response = await api.get(`/api/approvals/entity/${entityType}/${entityId}`)
            const approvalData = response.data?.data || []
            return approvalData
        } catch (err) {
            console.error('Failed to fetch entity approvals:', err)
            setError(err.response?.data?.message || 'Failed to fetch approvals')
            if (onError) onError(err)
        } finally {
            setLoading(false)
        }
    }, [onError])

    /**
     * Check if current user can approve a request
     */
    const canApprove = useCallback((approval) => {
        if (!approval) return false
        return approval.status === 'pending' && approval.approval_level > 0
    }, [])

    /**
     * Check if request is fully approved
     */
    const isFullyApproved = useCallback((approval) => {
        return approval?.status === 'approved'
    }, [])

    /**
     * Check if request is rejected
     */
    const isRejected = useCallback((approval) => {
        return approval?.status === 'rejected'
    }, [])

    /**
     * Paginate to next page
     */
    const nextPage = useCallback(() => {
        if (pagination.page < pagination.pages) {
            fetchPendingApprovals(pagination.page + 1, pagination.per_page)
        }
    }, [pagination, fetchPendingApprovals])

    /**
     * Paginate to previous page
     */
    const prevPage = useCallback(() => {
        if (pagination.page > 1) {
            fetchPendingApprovals(pagination.page - 1, pagination.per_page)
        }
    }, [pagination, fetchPendingApprovals])

    /**
     * Auto-fetch on mount if enabled
     */
    useEffect(() => {
        if (autoFetch) {
            fetchPendingApprovals()
        }
    }, [autoFetch, fetchPendingApprovals])

    return {
        // State
        approvals,
        selectedApproval,
        history,
        loading,
        approvalLoading,
        error,
        pagination,

        // Fetching
        fetchPendingApprovals,
        fetchApprovalHistory,
        getApprovalDetails,
        fetchApprovalStats,
        getEntityApprovals,

        // Actions
        approve,
        reject,
        setSelectedApproval,

        // Utilities
        canApprove,
        isFullyApproved,
        isRejected,
        nextPage,
        prevPage,
        pendingCount: approvals.length,
        hasMore: pagination.page < pagination.pages
    }
}

export default useApprovalWorkflow
