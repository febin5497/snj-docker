import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaChevronLeft, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import '../../styles/ExpenseList.css';

export default function ExpenseList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  // Detect which view: staff expenses or finance approvals
  const isApprovalView = location.pathname.includes('/finance/approvals');
  const isStaffView = location.pathname.includes('/staff/expenses');

  // Get user role from localStorage
  const userRole = localStorage.getItem('role') || 'staff';
  const isFinanceUser = userRole === 'finance' || userRole === 'manager' || userRole === 'admin';

  // Redirect if trying to access finance/approvals without proper role
  useEffect(() => {
    if (isApprovalView && !isFinanceUser) {
      showError('You do not have permission to access expense approvals');
      navigate('/staff/expenses');
    }
  }, [isApprovalView, isFinanceUser, navigate, showError]);

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: isApprovalView ? 'pending' : '',
    category: '',
  });
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  useEffect(() => {
    loadExpenses();
  }, [filters, page]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        per_page: perPage,
        ...filters
      });

      let endpoint = '/api/staff/expenses';

      // For finance approvals view, get all pending expenses for approval
      if (isApprovalView) {
        endpoint = '/api/staff/approvals/expenses';
      }

      const response = await api.get(`${endpoint}?${params}`);
      if (response.data.success) {
        setExpenses(response.data.data || []);
      }
    } catch (err) {
      showError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/api/staff/expenses/${id}`);
      showSuccess('Expense deleted successfully');
      loadExpenses();
    } catch (err) {
      showError('Failed to delete expense');
    }
  };

  const approveExpense = async (id) => {
    try {
      const response = await api.post(`/api/staff/expenses/${id}/approve`, {});
      if (response.data.success) {
        showSuccess('Expense approved successfully');
        loadExpenses();
      } else {
        showError(response.data.message || 'Failed to approve expense');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to approve expense');
    }
  };

  const rejectExpense = async (id) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
      const response = await api.post(`/api/staff/expenses/${id}/reject`, {
        rejection_reason: reason || 'No reason provided'
      });
      if (response.data.success) {
        showSuccess('Expense rejected successfully');
        loadExpenses();
      } else {
        showError(response.data.message || 'Failed to reject expense');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reject expense');
    }
  };

  const statusBadgeColor = (status) => {
    switch(status) {
      case 'approved': return '#43e97b';
      case 'pending': return '#ffa502';
      case 'rejected': return '#f5576c';
      default: return '#64748b';
    }
  };

  return (
    <div className="expense-list-container">
      <div className="expense-header">
        <div className="expense-title-section">
          <button className="back-btn" onClick={() => navigate(isApprovalView ? '/dashboard' : '/staff')}>
            <FaChevronLeft /> Back
          </button>
          <h1>
            {isApprovalView ? '💼 Expense Approvals' : '📝 My Expenses'}
          </h1>
          {isApprovalView && (
            <p className="subtitle">Review and approve staff expenses</p>
          )}
        </div>
        {isStaffView && (
          <button className="add-expense-btn" onClick={() => navigate('/staff/expenses/new')}>
            <FaPlus /> New Expense
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="expense-filters">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({...filters, status: e.target.value});
              setPage(1);
            }}
          >
            {isApprovalView ? (
              <>
                <option value="pending">Pending</option>
              </>
            ) : (
              <>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </>
            )}
          </select>
        </div>
        <div className="filter-group">
          <label>Category</label>
          <select
            value={filters.category}
            onChange={(e) => {
              setFilters({...filters, category: e.target.value});
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            <option value="materials">Materials</option>
            <option value="labor">Labor</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="loading">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <p>
            {isApprovalView
              ? '✅ No pending expenses to review'
              : '📋 No expenses submitted yet'}
          </p>
          {isStaffView && (
            <button onClick={() => navigate('/staff/expenses/new')} className="primary-btn">
              Create Your First Expense
            </button>
          )}
        </div>
      ) : (
        <div className="expenses-table-container">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                {isApprovalView && <th>Staff Member</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id}>
                  <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td>{expense.category}</td>
                  <td>{expense.description}</td>
                  <td>₹{parseFloat(expense.amount).toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                  {isApprovalView && <td>{expense.staff_name || 'N/A'}</td>}
                  <td>
                    <span
                      className="status-badge"
                      style={{backgroundColor: statusBadgeColor(expense.status)}}
                    >
                      {expense.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {/* APPROVAL VIEW - Finance can approve/reject */}
                    {isApprovalView && expense.status?.toLowerCase() === 'pending' && (
                      <>
                        <button
                          className="btn-approve"
                          onClick={() => approveExpense(expense.id)}
                          title="Approve"
                        >
                          <FaCheck /> Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => rejectExpense(expense.id)}
                          title="Reject"
                        >
                          <FaTimes /> Reject
                        </button>
                      </>
                    )}

                    {/* STAFF VIEW - Can edit/delete pending, delete approved */}
                    {isStaffView && (
                      <>
                        {expense.status?.toLowerCase() === 'pending' && (
                          <>
                            <button
                              className="btn-edit"
                              onClick={() => navigate(`/staff/expenses/${expense.id}/edit`)}
                              title="Edit"
                            >
                              <FaEdit /> Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => deleteExpense(expense.id)}
                              title="Delete"
                            >
                              <FaTrash /> Delete
                            </button>
                          </>
                        )}
                        {expense.status?.toLowerCase() === 'approved' && (
                          <button
                            className="btn-delete"
                            onClick={() => deleteExpense(expense.id)}
                            title="Delete"
                          >
                            <FaTrash /> Delete
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && expenses.length > 0 && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
