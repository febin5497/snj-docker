/**
 * usePaginatedData Hook
 *
 * Consolidates pagination logic from 40+ page components.
 * Handles loading, pagination state, filtering, and API calls.
 *
 * Usage:
 * const { data, loading, page, setPage, perPage, total, totalPages }
 *   = usePaginatedData('/api/endpoint', filters)
 */

import { useState, useEffect, useCallback } from 'react'
import api from '../api/api'

export const usePaginatedData = (endpoint, filters = {}, perPage = 10) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page,
        per_page: perPage,
        ...filters,
      })

      const response = await api.get(`${endpoint}?${params}`)

      // Handle different response formats
      const responseData = response.data?.data || response.data || []
      const pagination = response.data?.pagination || {}

      setData(Array.isArray(responseData) ? responseData : [responseData])
      setTotal(pagination.total || 0)
      setTotalPages(pagination.pages || 0)
    } catch (err) {
      console.error('Error fetching paginated data:', err)
      setError(err.response?.data?.error || 'Error loading data')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, perPage, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }, [totalPages])

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }, [page, totalPages])

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1)
    }
  }, [page])

  return {
    data,
    loading,
    error,
    page,
    setPage: goToPage,
    nextPage,
    prevPage,
    perPage,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    refetch: fetchData,
  }
}

export default usePaginatedData
