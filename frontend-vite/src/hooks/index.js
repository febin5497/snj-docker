/**
 * Hooks Index
 *
 * Centralized export of all custom React hooks
 *
 * Phase 1 Hooks:
 * - usePaginatedData: Pagination with filtering
 * - useFormInput: Form state management
 * - useModalState: Modal state management
 *
 * Phase 2 Advanced Hooks:
 * - useCrudForm: Form + API integration
 * - useApprovalWorkflow: Multi-level approval management
 * - useFilters: Advanced dynamic filtering
 */

// Phase 1 - Core Hooks
export { usePaginatedData } from './usePaginatedData'
export { useFormInput } from './useFormInput'
export { useModalState, useSimpleModalState } from './useModalState'

// Phase 2 - Advanced Hooks
export { useCrudForm } from './useCrudForm'
export { useApprovalWorkflow } from './useApprovalWorkflow'
export { useFilters } from './useFilters'
