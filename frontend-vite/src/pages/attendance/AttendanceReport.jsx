import React, { useState, useEffect } from 'react';
import attendanceAPI from '../../api/attendance';
import api from '../../api/api';
import './AttendanceReport.css';

const ICONS = {
  csv: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  pdf: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  cross: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  minus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  moon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
};
const AttendanceReport = () => {
  const [records, setRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showManualForm, setShowManualForm] = useState(false);
  // Filter state
  const [filters, setFilters] = useState({
    dateStart: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    staffId: '',
    status: 'all',
    department: 'all'
  });
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(25);
  // Manual form data
  const [manualFormData, setManualFormData] = useState({
    staff_id: '',
    date: new Date().toISOString().split('T')[0],
    punch_in_time: '',
    punch_out_time: '',
    overtime_hours: 0,
    night_shift: false,
    reason: '',
    requires_approval: false
  });
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [recordsRes, staffRes] = await Promise.all([
          attendanceAPI.getReport({
            start_date: filters.dateStart,
            end_date: filters.dateEnd,
            staff_id: filters.staffId || undefined,
            status: filters.status !== 'all' ? filters.status : undefined,
            page: currentPage,
            limit: perPage
          }),
          api.get('/api/staff?per_page=100')
        ]);
        setRecords(recordsRes.data.records || []);
        // Handle both { data: [...] } and { data: { records: [...] } } formats
        const staffData = staffRes.data?.records || staffRes.data || [];
        setStaffList(Array.isArray(staffData) ? staffData : []);
      } catch (error) {
        alert('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, currentPage]);
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };
  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };
  const handleSelectAll = () => {
    if (selectedRows.size === records.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(records.map(r => r.id)));
    }
  };
  const handleBatchApprove = async () => {
    if (selectedRows.size === 0) {
      alert('Please select records to approve');
      return;
    }
    try {
      await Promise.all(
        Array.from(selectedRows).map(recordId =>
          attendanceAPI.updateAttendance(recordId, { status: 'approved' })
        )
      );
      alert(`${selectedRows.size} records approved`);
      setSelectedRows(new Set());
      // Refresh data
      const response = await attendanceAPI.getReport({
        start_date: filters.dateStart,
        end_date: filters.dateEnd,
        page: currentPage,
        limit: perPage
      });
      setRecords(response.data.records || []);
    } catch (error) {
      alert('Failed to approve records');
    }
  };
  const handleBatchReject = async () => {
    if (selectedRows.size === 0) {
      alert('Please select records to reject');
      return;
    }
    try {
      await Promise.all(
        Array.from(selectedRows).map(recordId =>
          attendanceAPI.updateAttendance(recordId, { status: 'rejected' })
        )
      );
      alert(`${selectedRows.size} records rejected`);
      setSelectedRows(new Set());
      // Refresh data
      const response = await attendanceAPI.getReport({
        start_date: filters.dateStart,
        end_date: filters.dateEnd,
        page: currentPage,
        limit: perPage
      });
      setRecords(response.data.records || []);
    } catch (error) {
      alert('Failed to reject records');
    }
  };
  const handleMarkNightShift = async () => {
    if (selectedRows.size === 0) {
      alert('Please select records');
      return;
    }
    try {
      await Promise.all(
        Array.from(selectedRows).map(recordId =>
          attendanceAPI.updateAttendance(recordId, { night_shift: true })
        )
      );
      alert(`${selectedRows.size} records marked as night shift`);
      setSelectedRows(new Set());
      const response = await attendanceAPI.getReport({
        start_date: filters.dateStart,
        end_date: filters.dateEnd,
        page: currentPage,
        limit: perPage
      });
      setRecords(response.data.records || []);
    } catch (error) {
      alert('Failed to mark night shift');
    }
  };
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualFormData.staff_id || !manualFormData.date) {
      alert('Please fill in required fields');
      return;
    }
    try {
      await attendanceAPI.manualPunch({
        staffId: Number(manualFormData.staff_id),
        date: manualFormData.date,
        punchInTime: manualFormData.punch_in_time ? `${manualFormData.date}T${manualFormData.punch_in_time}:00` : undefined,
        punchOutTime: manualFormData.punch_out_time ? `${manualFormData.date}T${manualFormData.punch_out_time}:00` : undefined,
        overtimeHours: manualFormData.overtime_hours || 0,
        nightShift: manualFormData.night_shift,
        saveAndApprove: !manualFormData.requires_approval,
      });
      alert('Attendance marked successfully');
      setShowManualForm(false);
      setManualFormData({
        staff_id: '',
        date: new Date().toISOString().split('T')[0],
        punch_in_time: '',
        punch_out_time: '',
        overtime_hours: 0,
        night_shift: false,
        reason: '',
        requires_approval: false
      });
      // Refresh data
      const response = await attendanceAPI.getReport({
        start_date: filters.dateStart,
        end_date: filters.dateEnd,
        page: currentPage,
        limit: perPage
      });
      setRecords(response.data.records || []);
    } catch (error) {
      alert('Failed to mark attendance');
    }
  };
  const handleExport = async (format) => {
    try {
      const response = await attendanceAPI.exportRecords(format, filters.dateStart, filters.dateEnd);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      alert('Failed to export data');
    }
  };
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'badge-approved';
      case 'pending': return 'badge-pending';
      case 'rejected': return 'badge-rejected';
      case 'present': return 'badge-present';
      case 'absent': return 'badge-absent';
      default: return 'badge-default';
    }
  };
  if (loading) {
    return (
      <div className="attendance-report-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading attendance data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="theme-blue-white">
    <div className="attendance-report-container">
      {/* Header */}
      <div className="ar-header">
        <h1 className="header-blue-white">Attendance Management</h1>
        <p>Manage and track staff attendance</p>
      </div>
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            value={filters.dateStart}
            onChange={(e) => handleFilterChange('dateStart', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            value={filters.dateEnd}
            onChange={(e) => handleFilterChange('dateEnd', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Staff</label>
          <select
            value={filters.staffId}
            onChange={(e) => handleFilterChange('staffId', e.target.value)}
          >
            <option value="">All Staff</option>
            {staffList.map(staff => (
              <option key={staff.id} value={staff.id}>{staff.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={() => setCurrentPage(1)}>
            Apply
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setFilters({
              dateStart: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
              dateEnd: new Date().toISOString().split('T')[0],
              staffId: '',
              status: 'all',
              department: 'all'
            })}
          >
            Reset
          </button>
        </div>
        <div className="export-buttons">
          <button className="btn btn-secondary" onClick={() => handleExport('csv')}>
            {ICONS.csv} CSV
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>
            {ICONS.pdf} PDF
          </button>
        </div>
      </div>
      {/* Manual Entry Form */}
      <div className="manual-form-section">
        <button
          className="btn btn-outline"
          onClick={() => setShowManualForm(!showManualForm)}
        >
          {showManualForm ? ICONS.minus : ICONS.plus} Mark Attendance Manually
        </button>
        {showManualForm && (
          <form className="manual-form" onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label>Staff *</label>
              <select
                value={manualFormData.staff_id}
                onChange={(e) => setManualFormData(prev => ({ ...prev, staff_id: e.target.value }))}
                required
              >
                <option value="">Select Staff</option>
                {Array.isArray(staffList) && staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={manualFormData.date}
                  onChange={(e) => setManualFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Punch In Time</label>
                <input
                  type="time"
                  value={manualFormData.punch_in_time}
                  onChange={(e) => setManualFormData(prev => ({ ...prev, punch_in_time: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Punch Out Time</label>
                <input
                  type="time"
                  value={manualFormData.punch_out_time}
                  onChange={(e) => setManualFormData(prev => ({ ...prev, punch_out_time: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Overtime Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={manualFormData.overtime_hours}
                  onChange={(e) => setManualFormData(prev => ({ ...prev, overtime_hours: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={manualFormData.night_shift}
                    onChange={(e) => setManualFormData(prev => ({ ...prev, night_shift: e.target.checked }))}
                  />
                  Night Shift
                </label>
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={manualFormData.requires_approval}
                    onChange={(e) => setManualFormData(prev => ({ ...prev, requires_approval: e.target.checked }))}
                  />
                  Requires Approval
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Reason/Notes</label>
              <textarea
                value={manualFormData.reason}
                onChange={(e) => setManualFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason or notes..."
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {manualFormData.requires_approval ? 'Save & Pending' : 'Save & Approve'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowManualForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      {/* Batch Actions */}
      {selectedRows.size > 0 && (
        <div className="batch-actions">
          <span>✓ {selectedRows.size} selected</span>
          <div className="action-buttons">
            <button className="btn btn-success" onClick={handleBatchApprove}>
              ✓ Approve
            </button>
            <button className="btn btn-danger" onClick={handleBatchReject}>
              ✗ Reject
            </button>
            <button className="btn btn-info" onClick={handleMarkNightShift}>
              Mark Night Shift
            </button>
          </div>
        </div>
      )}
      {/* Attendance Table */}
      <div className="table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr className="table-header-blue-white">
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedRows.size === records.length && records.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Staff Name</th>
              <th>Date</th>
              <th>Punch In</th>
              <th>Punch Out</th>
              <th>Hours</th>
              <th>OT Hours</th>
              <th>Night Shift</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className={selectedRows.has(record.id) ? 'selected' : ''}>
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(record.id)}
                    onChange={() => handleSelectRow(record.id)}
                  />
                </td>
                <td>
                  <strong>{record.staff_name}</strong>
                  <br />
                  <small>{record.staff_role}</small>
                </td>
                <td>{new Date(record.date).toLocaleDateString('en-IN')}</td>
                <td>{record.punch_in_time ? new Date(record.punch_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>{record.punch_out_time ? new Date(record.punch_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>{record.hours_worked || '—'}</td>
                <td>
                  <span className="editable-field">
                    {record.overtime_hours || 0}
                    <button
                      className="edit-btn"
                      onClick={() => {
                        const newValue = prompt('Enter overtime hours:', record.overtime_hours || 0);
                        if (newValue !== null) {
                          attendanceAPI.updateAttendance(record.id, { overtime_hours: parseFloat(newValue) })
                            .then(() => {
                              const updated = records.map(r => r.id === record.id ? { ...r, overtime_hours: parseFloat(newValue) } : r);
                              setRecords(updated);
                            })
                        }
                      }}
                    >
                      ✎
                    </button>
                  </span>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={record.night_shift || false}
                    onChange={(e) => {
                      attendanceAPI.updateAttendance(record.id, { night_shift: e.target.checked })
                        .then(() => {
                          const updated = records.map(r => r.id === record.id ? { ...r, night_shift: e.target.checked } : r);
                          setRecords(updated);
                        })
                    }}
                  />
                </td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td>
                  <button className="btn-action" title="View Details">{ICONS.eye}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="pagination">
        <button
          className="btn btn-outline"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          ← Prev
        </button>
        <span>Page {currentPage}</span>
        <button
          className="btn btn-outline"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={records.length < perPage}
        >
          Next →
        </button>
      </div>
    </div>
    </div>
  );
};
export default AttendanceReport;
