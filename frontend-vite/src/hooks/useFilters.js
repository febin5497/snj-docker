/**
 * useFilters Hook - Advanced Dynamic Filtering
 *
 * Manages dynamic filtering with:
 * - Multiple filter criteria
 * - Dynamic filter composition
 * - Filter persistence
 * - Reset functionality
 * - URL query parameter sync
 *
 * Eliminates 20-25 lines of filter boilerplate per data table page
 */

import { useState, useCallback, useEffect } from 'react'

export const useFilters = (initialFilters = {}, options = {}) => {
    const {
        onFilterChange,
        persistToUrl = false,  // Save filters to URL query params
        customFilterValidators = {}  // Custom validation for specific filters
    } = options

    const [filters, setFilters] = useState(initialFilters)
    const [activeFilterCount, setActiveFilterCount] = useState(0)

    /**
     * Add or update a single filter
     */
    const setFilter = useCallback((filterName, value) => {
        setFilters(prev => {
            const newFilters = {
                ...prev,
                [filterName]: value
            }

            // Remove filter if value is empty/null
            if (!value || value === '' || value === null) {
                delete newFilters[filterName]
            }

            if (onFilterChange) {
                onFilterChange(newFilters)
            }

            return newFilters
        })
    }, [onFilterChange])

    /**
     * Add or update multiple filters at once
     */
    const setMultipleFilters = useCallback((newFilters) => {
        setFilters(prev => {
            const updated = {
                ...prev,
                ...newFilters
            }

            // Remove empty filters
            Object.keys(updated).forEach(key => {
                if (!updated[key] || updated[key] === '' || updated[key] === null) {
                    delete updated[key]
                }
            })

            if (onFilterChange) {
                onFilterChange(updated)
            }

            return updated
        })
    }, [onFilterChange])

    /**
     * Toggle a boolean filter
     */
    const toggleFilter = useCallback((filterName) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: !prev[filterName]
        }))
    }, [])

    /**
     * Clear a specific filter
     */
    const clearFilter = useCallback((filterName) => {
        setFilters(prev => {
            const newFilters = { ...prev }
            delete newFilters[filterName]

            if (onFilterChange) {
                onFilterChange(newFilters)
            }

            return newFilters
        })
    }, [onFilterChange])

    /**
     * Clear all filters
     */
    const clearAllFilters = useCallback(() => {
        setFilters({})
        if (onFilterChange) {
            onFilterChange({})
        }
    }, [onFilterChange])

    /**
     * Check if a specific filter is active
     */
    const isFilterActive = useCallback((filterName) => {
        return filters[filterName] !== undefined && filters[filterName] !== null && filters[filterName] !== ''
    }, [filters])

    /**
     * Get value of a filter
     */
    const getFilterValue = useCallback((filterName, defaultValue = null) => {
        return filters[filterName] !== undefined ? filters[filterName] : defaultValue
    }, [filters])

    /**
     * Apply custom validation to filters
     */
    const getValidFilters = useCallback(() => {
        const validFilters = {}

        Object.entries(filters).forEach(([key, value]) => {
            const validator = customFilterValidators[key]

            if (validator) {
                if (validator(value)) {
                    validFilters[key] = value
                }
            } else {
                // No custom validator, assume valid if not empty
                if (value !== '' && value !== null) {
                    validFilters[key] = value
                }
            }
        })

        return validFilters
    }, [filters, customFilterValidators])

    /**
     * Get filters as query parameters (for API calls)
     */
    const getQueryParams = useCallback(() => {
        const params = new URLSearchParams()

        Object.entries(getValidFilters()).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => params.append(key, v))
            } else {
                params.append(key, value)
            }
        })

        return params
    }, [getValidFilters])

    /**
     * Get filters as object (for API calls)
     */
    const getFilterObject = useCallback(() => {
        return getValidFilters()
    }, [getValidFilters])

    /**
     * Update count of active filters
     */
    useEffect(() => {
        const count = Object.values(filters).filter(v => v !== '' && v !== null).length
        setActiveFilterCount(count)
    }, [filters])

    /**
     * Persist filters to URL if enabled
     */
    useEffect(() => {
        if (persistToUrl) {
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value)
            })

            const queryString = params.toString()
            if (queryString) {
                window.history.replaceState({}, '', `?${queryString}`)
            } else {
                window.history.replaceState({}, '', window.location.pathname)
            }
        }
    }, [filters, persistToUrl])

    /**
     * Load filters from URL query parameters
     */
    const loadFromUrl = useCallback(() => {
        const params = new URLSearchParams(window.location.search)
        const urlFilters = {}

        params.forEach((value, key) => {
            urlFilters[key] = value
        })

        if (Object.keys(urlFilters).length > 0) {
            setFilters(urlFilters)
        }
    }, [])

    /**
     * Reset filters to initial state
     */
    const reset = useCallback(() => {
        setFilters(initialFilters)
        if (onFilterChange) {
            onFilterChange(initialFilters)
        }
    }, [initialFilters, onFilterChange])

    return {
        // State
        filters,
        activeFilterCount,
        hasActiveFilters: activeFilterCount > 0,

        // Single filter operations
        setFilter,
        clearFilter,
        isFilterActive,
        getFilterValue,
        toggleFilter,

        // Multiple filter operations
        setMultipleFilters,
        clearAllFilters,
        reset,

        // Export filters
        getValidFilters,
        getQueryParams,
        getFilterObject,

        // URL integration
        loadFromUrl
    }
}

export default useFilters
