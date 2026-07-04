# Frontend Hooks Quick Reference

**Phase 1 Foundation - Essential Hooks for Consolidation**

---

## 1. usePaginatedData

**Purpose:** Handles pagination, loading, filtering, and API calls for lists

**Replaces:** 40+ pages with manual pagination state management

### Basic Usage
```javascript
import { usePaginatedData } from '../hooks'

function StaffList() {
  const {
    data: staff,
    loading,
    page,
    setPage,
    totalPages
  } = usePaginatedData('/api/staff')

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {staff.map(person => <div key={person.id}>{person.name}</div>)}
      <button onClick={() => setPage(page - 1)}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button onClick={() => setPage(page + 1)}>Next</button>
    </div>
  )
}
```

### With Filters
```javascript
function StaffList() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: staff, loading } = usePaginatedData(
    '/api/staff',
    { search: searchTerm },  // Filters object
    10                       // Per page (optional, default 10)
  )

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {staff.map(person => <div key={person.id}>{person.name}</div>)}
    </div>
  )
}
```

### All Available Properties
```javascript
const {
  data,           // Array of items
  loading,        // boolean
  error,          // Error message or null
  page,           // Current page (1-indexed)
  setPage,        // Go to specific page
  nextPage,       // Go to next page
  prevPage,       // Go to previous page
  perPage,        // Items per page
  total,          // Total items in database
  totalPages,     // Total pages
  hasNextPage,    // boolean - can go next?
  hasPrevPage,    // boolean - can go previous?
  refetch         // Refetch data function
} = usePaginatedData(endpoint, filters, perPage)
```

---

## 2. useFormInput

**Purpose:** Manages form field state and change handlers

**Replaces:** 40+ pages with manual form state management

### Basic Usage
```javascript
import { useFormInput } from '../hooks'

function UserForm() {
  const {
    formData,
    handleChange
  } = useFormInput({
    name: '',
    email: '',
    active: true
  })

  return (
    <form>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        type="email"
      />
      <input
        name="active"
        checked={formData.active}
        onChange={handleChange}
        type="checkbox"
      />
    </form>
  )
}
```

### With Custom Updates
```javascript
const {
  formData,
  handleChange,
  updateField,      // Update single field
  setMultiple,      // Update multiple fields at once
  reset             // Reset to initial state
} = useFormInput({ name: '', email: '' })

// Update single field programmatically
updateField('name', 'John')

// Update multiple fields
setMultiple({ name: 'John', email: 'john@example.com' })

// Reset form
reset()
```

### Nested Fields
```javascript
const { formData, handleNestedChange } = useFormInput({
  address: { city: '', country: '' }
})

// Update nested field
handleNestedChange('address', 'city', 'New York')
// Result: { address: { city: 'New York', country: '' } }
```

---

## 3. useModalState

**Purpose:** Manages multiple modal visibility states

**Replaces:** 57+ pages with manual modal state management

### Basic Usage
```javascript
import { useSimpleModalState } from '../hooks'

function StaffManagement() {
  const {
    showCreateModal,
    setShowCreateModal
  } = useSimpleModalState()

  return (
    <div>
      <button onClick={() => setShowCreateModal(true)}>Add Staff</button>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <StaffForm />
        </Modal>
      )}
    </div>
  )
}
```

### Custom Modal Names
```javascript
import { useModalState } from '../hooks'

function AdvancedForm() {
  const {
    openModal,
    closeModal,
    modals,
    showCreateModal,
    showEditModal,
    showDeleteModal
  } = useModalState(['create', 'edit', 'delete'])

  return (
    <div>
      <button onClick={() => openModal('create')}>Create</button>
      <button onClick={() => openModal('edit')}>Edit</button>
      <button onClick={() => openModal('delete')}>Delete</button>

      {modals.create && <CreateModal onClose={() => closeModal('create')} />}
      {modals.edit && <EditModal onClose={() => closeModal('edit')} />}
      {modals.delete && <DeleteModal onClose={() => closeModal('delete')} />}
    </div>
  )
}
```

### Available Methods
```javascript
const {
  modals,           // { create: false, edit: false, ... }
  openModal(name),  // Open specific modal
  closeModal(name), // Close specific modal
  toggleModal(name),// Toggle modal
  closeAll(),       // Close all modals

  // Convenience methods (for simple modals)
  showCreateModal, setShowCreateModal,
  showEditModal, setShowEditModal,
  // ... etc
} = useModalState(['create', 'edit', 'detail', 'confirm'])
```

---

## Quick Conversion Guide

### Converting a Component Using All Three Hooks

#### BEFORE (Old Way - 100+ lines)
```javascript
function Staff() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(0)

  const [formData, setFormData] = useState({ name: '', email: '' })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => { fetchStaff() }, [page, perPage])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/staff?page=${page}&per_page=${perPage}`)
      setStaff(res.data?.data || [])
      setTotalPages(res.data?.pagination?.pages || 0)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div>
      <button onClick={() => setShowCreateModal(true)}>Add</button>
      {staff.map(p => <div key={p.id}>{p.name}</div>)}
      <button onClick={() => setPage(page - 1)}>Prev</button>
      <span>Page {page}/{totalPages}</span>
      <button onClick={() => setPage(page + 1)}>Next</button>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <form>
            <input name="name" value={formData.name} onChange={handleInputChange} />
            <input name="email" value={formData.email} onChange={handleInputChange} />
          </form>
        </Modal>
      )}
    </div>
  )
}
```

#### AFTER (Using Hooks - 30 lines)
```javascript
function Staff() {
  const { data: staff, loading, page, setPage, totalPages }
    = usePaginatedData('/api/staff')
  const { formData, handleChange }
    = useFormInput({ name: '', email: '' })
  const { showCreateModal, setShowCreateModal }
    = useSimpleModalState()

  return (
    <div>
      <button onClick={() => setShowCreateModal(true)}>Add</button>
      {staff.map(p => <div key={p.id}>{p.name}</div>)}

      <button onClick={() => setPage(page - 1)}>Prev</button>
      <span>Page {page}/{totalPages}</span>
      <button onClick={() => setPage(page + 1)}>Next</button>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <form>
            <input name="name" value={formData.name} onChange={handleChange} />
            <input name="email" value={formData.email} onChange={handleChange} />
          </form>
        </Modal>
      )}
    </div>
  )
}
```

**Lines saved: 70 lines (70% reduction!)**

---

## Common Patterns

### Pattern 1: List with Pagination and Create Modal
```javascript
function ResourceList() {
  const { data, loading, page, setPage, totalPages }
    = usePaginatedData('/api/resources')
  const { showCreateModal, setShowCreateModal }
    = useSimpleModalState()
  const { formData, handleChange, reset }
    = useFormInput({ name: '', description: '' })

  const handleCreate = async () => {
    await api.post('/api/resources', formData)
    setShowCreateModal(false)
    reset()
  }

  return (
    // ... JSX with list + pagination + create button + modal
  )
}
```

### Pattern 2: Filtered List
```javascript
function FilteredList() {
  const [filters, setFilters] = useState({ search: '', status: 'active' })

  const { data, loading, page, setPage }
    = usePaginatedData('/api/items', filters)

  return (
    <div>
      <input
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />
      {/* List here */}
    </div>
  )
}
```

### Pattern 3: Form with Multiple Sections
```javascript
function ComplexForm() {
  const { formData, updateField, setMultiple } = useFormInput({
    basic: { name: '', email: '' },
    address: { city: '', country: '' }
  })

  return (
    <div>
      <input value={formData.basic.name} onChange={(e) =>
        updateField('basic.name', e.target.value)}
      />
      {/* More fields */}
    </div>
  )
}
```

---

## Migration Path

### Step 1: Start with usePaginatedData
- Most common pattern
- Biggest code reduction
- Lowest risk

### Step 2: Add useFormInput
- Works well with usePaginatedData
- Eliminates form boilerplate

### Step 3: Add useModalState
- Completes the pattern
- All state now via hooks

### Result
- 60-70% less state management code
- More readable components
- Consistent patterns across app

---

## API Integration Notes

These hooks assume your API responses follow this format:
```json
{
  "success": true,
  "message": "...",
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 100,
    "pages": 10
  }
}
```

The hook handles different response structures automatically:
- `response.data.data`
- `response.data` (direct array)
- Falls back to empty array on error

---

## Troubleshooting

**Pagination not updating?**
- Check that endpoint returns correct pagination object
- Verify filters object is stable (not recreated each render)

**Form not updating?**
- Make sure input has `name` attribute matching form field
- For checkboxes, use `checked` not `value`

**Modals not opening?**
- Verify modal name matches the one you're trying to open
- Check that modal component receives correct prop

---

## Phase 2: Advanced Hooks

### 4. useCrudForm

**Purpose:** Combines form state management with API submission for create/update operations

**Replaces:** 20-30 lines of boilerplate per form page

### Basic Usage
```javascript
import { useCrudForm } from '../hooks'

function CreateProjectForm() {
  const {
    formData,
    errors,
    fieldErrors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset
  } = useCrudForm('/api/projects', {
    name: '',
    location: '',
    startDate: ''
  })

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Project name"
      />
      {fieldErrors.name && <span className="error">{fieldErrors.name}</span>}

      <input
        name="location"
        value={formData.location}
        onChange={handleChange}
        placeholder="Location"
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
      <button type="button" onClick={reset}>Reset</button>
    </form>
  )
}
```

### With Callbacks and Validation
```javascript
const { formData, handleSubmit } = useCrudForm(
  '/api/projects',
  { name: '', location: '' },
  {
    method: 'PUT',  // For updates
    onSuccess: (result) => {
      toast.success('Project created successfully')
      navigate('/projects')
    },
    onError: (error) => {
      toast.error(error.message)
    },
    validator: (data) => {
      const errors = {}
      if (data.name.length < 3) errors.name = 'Minimum 3 characters'
      return errors
    }
  }
)
```

### API Methods
- `formData` - Current form data
- `setFormData` - Set all form data
- `errors` - Validation errors
- `fieldErrors` - API field-level errors
- `submitError` - Form-level submission error
- `isSubmitting` - Loading state during submission
- `handleChange` - Handle input changes
- `handleNestedChange` - Handle nested field changes (e.g., 'address.street')
- `handleSubmit` - Submit form to API
- `reset` - Reset to initial data
- `clear` - Clear all fields
- `setMultiple` - Update multiple fields
- `updateField` - Update single field
- `getFieldProps` - Get name/value/onChange props for input
- `setFieldError` - Set field error manually
- `hasErrors` - Check if form has errors
- `validate` - Run validation

---

### 5. useApprovalWorkflow

**Purpose:** Manages multi-level approval workflows

**Replaces:** 30-40 lines per approval page

### Basic Usage
```javascript
import { useApprovalWorkflow } from '../hooks'

function PendingApprovalsPage() {
  const {
    approvals,
    loading,
    approve,
    reject,
    canApprove,
    pendingCount
  } = useApprovalWorkflow('invoice')  // Optional: filter by entity type

  if (loading) return <div>Loading approvals...</div>

  return (
    <div>
      <h2>Pending Approvals ({pendingCount})</h2>
      {approvals.map(approval => (
        <div key={approval.id} className="approval-card">
          <h3>{approval.entity_type} #{approval.entity_id}</h3>
          <p>Level {approval.approval_level} of {approval.total_levels}</p>

          {canApprove(approval) && (
            <>
              <button onClick={() => approve(approval.id, 'Looks good')}>
                Approve
              </button>
              <button onClick={() => reject(approval.id, 'Needs revision')}>
                Reject
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
```

### With History and Details
```javascript
const {
  selectedApproval,
  history,
  getApprovalDetails,
  fetchApprovalHistory
} = useApprovalWorkflow()

useEffect(() => {
  getApprovalDetails(approvalId)
  fetchApprovalHistory(approvalId)
}, [approvalId])

return (
  <div>
    <h3>Approval Details</h3>
    <p>Status: {selectedApproval?.status}</p>
    <p>Current Level: {selectedApproval?.approval_level}</p>

    <h4>Approval History</h4>
    {history.map(entry => (
      <div key={entry.id}>
        <p>{entry.action} by User {entry.performed_by_id}</p>
        <p>{new Date(entry.performed_at).toLocaleString()}</p>
        {entry.notes && <p>Notes: {entry.notes}</p>}
      </div>
    ))}
  </div>
)
```

### API Methods
- `approvals` - List of pending approvals
- `selectedApproval` - Currently selected approval
- `history` - Approval history entries
- `loading` - Loading state
- `error` - Error message if any
- `approve()` - Approve with optional notes
- `reject()` - Reject with reason
- `fetchPendingApprovals()` - Fetch pending list
- `getApprovalDetails()` - Get single approval
- `fetchApprovalHistory()` - Get approval history
- `fetchApprovalStats()` - Get statistics
- `getEntityApprovals()` - Get approvals for specific entity
- `canApprove()` - Check if user can approve
- `isFullyApproved()` - Check if fully approved
- `isRejected()` - Check if rejected
- `nextPage()` / `prevPage()` - Pagination
- `pendingCount` - Number of pending approvals

---

### 6. useFilters

**Purpose:** Advanced dynamic filtering with validation and persistence

**Replaces:** 20-25 lines of filter logic per data table

### Basic Usage
```javascript
import { useFilters } from '../hooks'

function StaffTable() {
  const {
    filters,
    setFilter,
    clearAllFilters,
    hasActiveFilters,
    getQueryParams
  } = useFilters()

  const { data: staff } = usePaginatedData(
    '/api/staff',
    Object.fromEntries(getQueryParams())  // Pass filters to pagination hook
  )

  return (
    <div>
      <input
        placeholder="Search staff"
        onChange={(e) => setFilter('search', e.target.value)}
      />

      <select onChange={(e) => setFilter('status', e.target.value)}>
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {hasActiveFilters && (
        <button onClick={clearAllFilters}>Clear Filters</button>
      )}

      <StaffTableDisplay data={staff} />
    </div>
  )
}
```

### With Advanced Features
```javascript
const {
  filters,
    isFilterActive,
    getFilterValue,
    setMultipleFilters,
    reset,
    getValidFilters
} = useFilters(
  { department: 'engineering', status: 'active' },
  {
    persistToUrl: true,  // Save to URL query params
    customFilterValidators: {
      department: (value) => ['engineering', 'operations'].includes(value),
      status: (value) => ['active', 'inactive'].includes(value)
    }
  }
)

// Check if filter is active
if (isFilterActive('department')) {
  const dept = getFilterValue('department')
  console.log('Filtering by:', dept)
}

// Set multiple filters
setMultipleFilters({
  department: 'operations',
  manager_id: 5
})

// Get only valid filters for API
const apiFilters = getValidFilters()  // { department: 'operations', manager_id: 5 }
```

### API Methods
- `filters` - Current filter values
- `activeFilterCount` - Number of active filters
- `hasActiveFilters` - Boolean check
- `setFilter(name, value)` - Set single filter
- `setMultipleFilters(obj)` - Set multiple at once
- `clearFilter(name)` - Clear single filter
- `clearAllFilters()` - Clear all filters
- `isFilterActive(name)` - Check if active
- `getFilterValue(name, default)` - Get filter value
- `toggleFilter(name)` - Toggle boolean filter
- `getValidFilters()` - Get validated filters
- `getQueryParams()` - Get as URLSearchParams
- `getFilterObject()` - Get as plain object
- `loadFromUrl()` - Load from URL query params
- `reset()` - Reset to initial

---

## Summary: Phase 2 Advanced Hooks

| Hook | Purpose | Lines Replaced |
|------|---------|-----------------|
| useCrudForm | Form + API submission | 20-30 |
| useApprovalWorkflow | Multi-level approvals | 30-40 |
| useFilters | Dynamic filtering | 20-25 |

**Total Lines Saved:** 70-95 per typical data page

---

**Phase 1 + 2 Complete! Ready for Phase 2.4 Components? ✅**
