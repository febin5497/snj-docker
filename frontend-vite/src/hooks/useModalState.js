/**
 * useModalState Hook
 *
 * Consolidates modal state management from 57+ page components.
 * Supports multiple modals and modal stacking.
 *
 * Usage:
 * const { showCreateModal, setShowCreateModal, ... } = useModalState()
 *
 * Or with custom modal names:
 * const modals = useModalState(['create', 'edit', 'detail', 'confirm'])
 */

import { useState, useCallback } from 'react'

export const useModalState = (modalNames = ['create', 'edit', 'detail', 'confirm']) => {
  const [modals, setModals] = useState(
    modalNames.reduce((acc, name) => ({ ...acc, [name]: false }), {})
  )

  const openModal = useCallback((modalName) => {
    if (!modalNames.includes(modalName)) {
      console.warn(`Modal '${modalName}' not defined`)
      return
    }
    setModals((prev) => ({ ...prev, [modalName]: true }))
  }, [modalNames])

  const closeModal = useCallback((modalName) => {
    if (!modalNames.includes(modalName)) {
      console.warn(`Modal '${modalName}' not defined`)
      return
    }
    setModals((prev) => ({ ...prev, [modalName]: false }))
  }, [modalNames])

  const toggleModal = useCallback((modalName) => {
    if (!modalNames.includes(modalName)) {
      console.warn(`Modal '${modalName}' not defined`)
      return
    }
    setModals((prev) => ({ ...prev, [modalName]: !prev[modalName] }))
  }, [modalNames])

  const closeAll = useCallback(() => {
    setModals(modalNames.reduce((acc, name) => ({ ...acc, [name]: false }), {}))
  }, [modalNames])

  // Generate individual show/hide methods for each modal
  const handlers = {}
  modalNames.forEach((name) => {
    handlers[`show${name.charAt(0).toUpperCase() + name.slice(1)}Modal`] = () => openModal(name)
    handlers[`hide${name.charAt(0).toUpperCase() + name.slice(1)}Modal`] = () => closeModal(name)
    handlers[`toggle${name.charAt(0).toUpperCase() + name.slice(1)}Modal`] = () => toggleModal(name)
  })

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAll,
    // Convenience properties for individual modals
    ...modalNames.reduce((acc, name) => {
      acc[`show${name.charAt(0).toUpperCase() + name.slice(1)}Modal`] = modals[name]
      acc[`set${name.charAt(0).toUpperCase() + name.slice(1)}Modal`] = (value) => {
        if (value) openModal(name)
        else closeModal(name)
      }
      return acc
    }, {}),
    ...handlers,
  }
}

// Backward compatibility for common modal names
export const useSimpleModalState = () => {
  return useModalState(['create', 'edit', 'detail', 'confirm', 'approval', 'delete'])
}

export default useModalState
