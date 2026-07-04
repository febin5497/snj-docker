/**
 * useCrudForm Hook - Combined Form + API Integration
 *
 * Combines form state management with API submission for CRUD operations.
 * Handles:
 * - Form input state and changes
 * - API submission (create/update)
 * - Loading states
 * - Error handling and display
 * - Success callbacks
 * - Form reset and clearing
 * - Field-level validation errors
 *
 * Eliminates 20-30 lines of boilerplate per form page
 */

import { useState, useCallback } from 'react'
import api from '../api/api'

export const useCrudForm = (
    apiEndpoint,  // e.g., '/api/projects' or '/api/projects/123'
    initialData = {},
    options = {}
) => {
    const {
        onSuccess,           // Called after successful submit
        onError,            // Called on error
        method = 'POST',    // HTTP method (POST for create, PUT for update)
        validateOnChange = true,
        transformResponse = (response) => response.data?.data || response.data  // Parse response
    } = options

    const [formData, setFormData] = useState(initialData)
    const [errors, setErrors] = useState({})
    const [fieldErrors, setFieldErrors] = useState({})  // Per-field errors from API
    const [loading, setLoading] = useState(false)
    const [submitError, setSubmitError] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    /**
     * Handle single field change
     */
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target
        const fieldValue = type === 'checkbox' ? checked : value

        setFormData(prev => ({
            ...prev,
            [name]: fieldValue
        }))

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: null
            }))
        }
    }, [fieldErrors])

    /**
     * Handle nested field changes (e.g., address.street)
     */
    const handleNestedChange = useCallback((path, value) => {
        const keys = path.split('.')
        setFormData(prev => {
            const newData = { ...prev }
            let current = newData

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {}
                }
                current = current[keys[i]]
            }

            current[keys[keys.length - 1]] = value
            return newData
        })
    }, [])

    /**
     * Validate form (can be overridden by passing validator in options)
     */
    const validate = useCallback((data = formData) => {
        const newErrors = {}

        // Add custom validation logic here if needed
        // This is a simple example - override in options.validator if needed

        return newErrors
    }, [formData])

    /**
     * Handle form submission to API
     */
    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault()

        setIsSubmitting(true)
        setSubmitError(null)
        setFieldErrors({})

        // Validate
        const validationErrors = validate(formData)
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            setIsSubmitting(false)
            return
        }

        try {
            const response = await api({
                method,
                url: apiEndpoint,
                data: formData
            })

            const result = transformResponse(response)

            // Clear form on success
            setFormData(initialData)
            setErrors({})
            setFieldErrors({})

            if (onSuccess) {
                onSuccess(result, response)
            }

            return result
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Submission failed'
            setSubmitError(errorMessage)

            // Handle field-level errors from API
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                const fieldErrs = {}
                error.response.data.errors.forEach(err => {
                    if (err.field) {
                        fieldErrs[err.field] = err.message
                    }
                })
                setFieldErrors(fieldErrs)
            }

            if (onError) {
                onError(error)
            }

            throw error
        } finally {
            setIsSubmitting(false)
        }
    }, [formData, apiEndpoint, method, validate, transformResponse, onSuccess, onError, initialData])

    /**
     * Update multiple fields at once
     */
    const setMultiple = useCallback((updates) => {
        setFormData(prev => ({
            ...prev,
            ...updates
        }))
    }, [])

    /**
     * Update a single field value
     */
    const updateField = useCallback((name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }, [])

    /**
     * Reset form to initial state
     */
    const reset = useCallback(() => {
        setFormData(initialData)
        setErrors({})
        setFieldErrors({})
        setSubmitError(null)
    }, [initialData])

    /**
     * Clear all form data
     */
    const clear = useCallback(() => {
        const emptyData = Object.keys(formData).reduce((acc, key) => {
            acc[key] = ''
            return acc
        }, {})
        setFormData(emptyData)
        setErrors({})
        setFieldErrors({})
        setSubmitError(null)
    }, [formData])

    /**
     * Get field props (name, value, onChange) for input elements
     */
    const getFieldProps = useCallback((fieldName) => ({
        name: fieldName,
        value: formData[fieldName] || '',
        onChange: handleChange,
        error: fieldErrors[fieldName] || errors[fieldName]
    }), [formData, fieldErrors, errors, handleChange])

    /**
     * Set field error manually (useful for async validation)
     */
    const setFieldError = useCallback((fieldName, error) => {
        setFieldErrors(prev => ({
            ...prev,
            [fieldName]: error
        }))
    }, [])

    return {
        // State
        formData,
        setFormData,
        errors,
        fieldErrors,
        submitError,
        loading: isSubmitting,
        isSubmitting,

        // Handlers
        handleChange,
        handleNestedChange,
        handleSubmit,
        reset,
        clear,
        setMultiple,
        updateField,
        setFieldError,

        // Utilities
        getFieldProps,
        validate,
        hasErrors: Object.keys(errors).length > 0 || Object.keys(fieldErrors).length > 0
    }
}

export default useCrudForm
