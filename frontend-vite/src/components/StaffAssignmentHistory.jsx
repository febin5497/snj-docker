/**
 * Staff Assignment History
 * Displays the history of staff assignments for a project
 */

import React, { useState, useEffect } from 'react';
import projectAPI from '../api/projects';
import '../styles/StaffAssignmentHistory.css';

const StaffAssignmentHistory = ({ projectId, projectName }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded && projectId) {
      fetchHistory();
    }
  }, [isExpanded, projectId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectAPI.getStaffHistory(projectId);
      setHistory(response.data.data || []);
    } catch (err) {
      console.error('Error fetching staff history:', err);
      setError('Failed to load assignment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDurationDays = (assignedDate, unassignedDate) => {
    if (!assignedDate || !unassignedDate) return null;
    const start = new Date(assignedDate);
    const end = new Date(unassignedDate);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="staff-assignment-history">
      <button
        className="history-toggle-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        title="View staff assignment history"
      >
        <span className="history-icon">📜</span>
        <span className="history-label">Assignment History</span>
        <span className={`history-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="history-content">
          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading-state">
              <p className="loading-text">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">📭 No assignment history yet</p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Department</th>
                    <th>Assigned On</th>
                    <th>Unassigned On</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record.id} className={record.is_active ? 'active' : 'inactive'}>
                      <td className="staff-name">
                        <span className="name-text">{record.staff_name}</span>
                        <span className="role-text">{record.staff_role}</span>
                      </td>
                      <td className="department">{record.staff_department || '-'}</td>
                      <td className="date-assigned">
                        {formatDate(record.assigned_date)}
                      </td>
                      <td className="date-unassigned">
                        {record.unassigned_date ? formatDate(record.unassigned_date) : '-'}
                      </td>
                      <td className="duration">
                        {getDurationDays(record.assigned_date, record.unassigned_date) !== null
                          ? `${getDurationDays(record.assigned_date, record.unassigned_date)} days`
                          : 'Ongoing'}
                      </td>
                      <td className={`status ${record.is_active ? 'active' : 'removed'}`}>
                        <span className={`status-badge ${record.is_active ? 'active' : 'removed'}`}>
                          {record.is_active ? '✓ Active' : '✗ Removed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="history-footer">
            <p className="history-info">
              Total records: <strong>{history.length}</strong>
            </p>
            {history.some(r => r.is_active) && (
              <p className="current-staff-count">
                Currently assigned: <strong>{history.filter(r => r.is_active).length}</strong> staff
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAssignmentHistory;
