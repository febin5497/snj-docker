/**
 * useFormInput Hook
 *
 * Consolidates form input handling logic from 40+ page components.
 * Handles text input, checkbox, select, and nested field updates.
 *
 * Usage:
 * const { formData, setFormData, handleChange, reset } = useFormInput({
 *   name: '',
 *   email: '',
 *   active: true
 * })
 */

import { useState, useCallback } from 'react'

export const useFormInput = (initialData = {}) => {
  const [formData, setFormData] = useState(initialData)

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }, [])

  const handleNestedChange = useCallback((parentField, childField, value) => {
    setFormData((prev) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value,
      },
    }))
  }, [])

  const updateField = useCallback((fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }, [])

  const reset = useCallback(() => {
    setFormData(initialData)
  }, [initialData])

  const setMultiple = useCallback((updates) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }))
  }, [])

  return {
    formData,
    setFormData,
    handleChange,
    handleNestedChange,
    updateField,
    setMultiple,
    reset,
  }
}

export default useFormInput
