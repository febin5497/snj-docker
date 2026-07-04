/**
 * Manual Attendance Form Component
 * Allows HR/Managers to manually record punch-in/out for staff
 *
 * Features:
 * - Staff selection with search
 * - Date, time, and shift information entry
 * - Overtime hours and night shift tracking
 * - Save & Approve or Save & Pending options
 */

import React, { useState, useEffect } from 'react';
import attendanceAPI from '../api/attendance';
import { useToast } from './Toast';
import { X, Loader } from 'lucide-react';

const ManualAttendanceForm = ({ onSuccess, onCancel, staffList = [] }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStaff, setFilteredStaff] = useState(staffList);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    staffId: '',
    staffName: '',
    date: new Date().toISOString().split('T')[0],
    punchInTime: '09:00',
    punchOutTime: '17:30',
    overtimeHours: 0,
    nightShift: false,
    saveAndApprove: true,
    reason: ''
  });

  const [errors, setErrors] = useState({});

  // Handle staff search
  useEffect(() => {
    if (searchTerm.trim()) {
      setSearching(true);
      const filtered = staffList.filter(staff =>
        staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.id?.toString().includes(searchTerm)
      );
      setFilteredStaff(filtered);
      setShowDropdown(true);
      setSearching(false);
    } else {
      setFilteredStaff(staffList);
      setShowDropdown(false);
    }
  }, [searchTerm, staffList]);

  // Handle staff selection
  const handleSelectStaff = (staff) => {
    setFormData(prev => ({
      ...prev,
      staffId: staff.id,
      staffName: staff.name
    }));
    setSearchTerm(staff.name);
    setShowDropdown(false);
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.staffId) {
      newErrors.staffId = 'Please select a staff member';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.punchInTime) {
      newErrors.punchInTime = 'Punch-in time is required';
    }

    // Validate overtime hours
    const ot = parseFloat(formData.overtimeHours);
    if (isNaN(ot) || ot < 0) {
      newErrors.overtimeHours = 'Overtime must be a non-negative number';
    }

    // Validate time order (punch-in should be before punch-out)
    if (formData.punchOutTime && formData.punchInTime >= formData.punchOutTime) {
      newErrors.punchOutTime = 'Punch-out time must be after punch-in time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Please fix the errors below');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        staffId: parseInt(formData.staffId),
        date: formData.date,
        punchInTime: `${formData.date}T${formData.punchInTime}:00Z`,
        ...(formData.punchOutTime && {
          punchOutTime: `${formData.date}T${formData.punchOutTime}:00Z`
        }),
        ...(formData.overtimeHours > 0 && {
          overtimeHours: parseFloat(formData.overtimeHours)
        }),
        ...(formData.nightShift && {
          nightShift: true
        }),
        saveAndApprove: formData.saveAndApprove
      };

      const result = await attendanceAPI.manualPunch(payload);

      if (result.data.success) {
        showSuccess(
          formData.saveAndApprove
            ? 'Attendance marked and approved successfully'
            : 'Attendance marked (pending approval)'
        );
        onSuccess?.(result.data.data);
        resetForm();
      } else {
        showError(result.data.error || 'Failed to mark attendance');
      }
    } catch (err) {
      showError(
        err.response?.data?.error ||
        err.message ||
        'Error marking attendance'
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      staffId: '',
      staffName: '',
      date: new Date().toISOString().split('T')[0],
      punchInTime: '09:00',
      punchOutTime: '17:30',
      overtimeHours: 0,
      nightShift: false,
      saveAndApprove: true,
      reason: ''
    });
    setSearchTerm('');
    setErrors({});
  };

  return (
    <div className="manual-attendance-form">
      <div className="form-header">
        <h3>Mark Attendance Manually</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-close"
            title="Close"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="form-content">
        {/* Staff Selection */}
        <div className="form-group">
          <label htmlFor="staff-search">Staff Member *</label>
          <div className="staff-search-container">
            <input
              id="staff-search"
              type="text"
              placeholder="Search staff name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className={`form-control ${errors.staffId ? 'error' : ''}`}
              disabled={loading}
            />
            {searching && <Loader size={16} className="spinner" />}

            {showDropdown && filteredStaff.length > 0 && (
              <div className="staff-dropdown">
                {filteredStaff.slice(0, 5).map(staff => (
                  <div
                    key={staff.id}
                    className="dropdown-item"
                    onClick={() => handleSelectStaff(staff)}
                  >
                    <div className="staff-name">{staff.name}</div>
                    <div className="staff-meta">ID: {staff.id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.staffId && <span className="error-text">{errors.staffId}</span>}
          {formData.staffId && (
            <small className="text-muted">Selected: {formData.staffName} (ID: {formData.staffId})</small>
          )}
        </div>

        {/* Date */}
        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className={`form-control ${errors.date ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.date && <span className="error-text">{errors.date}</span>}
        </div>

        {/* Punch-In Time */}
        <div className="form-group">
          <label htmlFor="punch-in-time">Punch-In Time *</label>
          <input
            id="punch-in-time"
            type="time"
            value={formData.punchInTime}
            onChange={(e) => handleInputChange('punchInTime', e.target.value)}
            className={`form-control ${errors.punchInTime ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.punchInTime && <span className="error-text">{errors.punchInTime}</span>}
        </div>

        {/* Punch-Out Time */}
        <div className="form-group">
          <label htmlFor="punch-out-time">Punch-Out Time</label>
          <input
            id="punch-out-time"
            type="time"
            value={formData.punchOutTime}
            onChange={(e) => handleInputChange('punchOutTime', e.target.value)}
            className={`form-control ${errors.punchOutTime ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.punchOutTime && <span className="error-text">{errors.punchOutTime}</span>}
        </div>

        {/* Overtime Hours */}
        <div className="form-group">
          <label htmlFor="overtime-hours">Overtime Hours</label>
          <input
            id="overtime-hours"
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={formData.overtimeHours}
            onChange={(e) => handleInputChange('overtimeHours', e.target.value)}
            placeholder="0.0"
            className={`form-control ${errors.overtimeHours ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.overtimeHours && <span className="error-text">{errors.overtimeHours}</span>}
        </div>

        {/* Night Shift Checkbox */}
        <div className="form-group form-checkbox">
          <label htmlFor="night-shift">
            <input
              id="night-shift"
              type="checkbox"
              checked={formData.nightShift}
              onChange={(e) => handleInputChange('nightShift', e.target.checked)}
              disabled={loading}
            />
            <span>Mark as Night Shift</span>
          </label>
        </div>

        {/* Reason/Notes */}
        <div className="form-group">
          <label htmlFor="reason">Reason/Notes</label>
          <textarea
            id="reason"
            placeholder="Any notes or reason for manual entry..."
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            className="form-control"
            rows="2"
            disabled={loading}
          />
        </div>

        {/* Approval Option */}
        <div className="form-group form-radio">
          <label>
            <input
              type="radio"
              name="approval"
              value="approve"
              checked={formData.saveAndApprove}
              onChange={() => handleInputChange('saveAndApprove', true)}
              disabled={loading}
            />
            <span>Save & Approve Immediately</span>
          </label>
          <label>
            <input
              type="radio"
              name="approval"
              value="pending"
              checked={!formData.saveAndApprove}
              onChange={() => handleInputChange('saveAndApprove', false)}
              disabled={loading}
            />
            <span>Save & Require Approval</span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                onCancel();
              }}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="spinner" />
                Saving...
              </>
            ) : (
              'Mark Attendance'
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .manual-attendance-form {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 0;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .form-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .btn-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: #f0f0f0;
          color: #000;
        }

        .form-content {
          padding: 20px;
          max-height: 600px;
          overflow-y: auto;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .form-control {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .form-control.error {
          border-color: #dc3545;
        }

        .form-control:disabled {
          background-color: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .staff-search-container {
          position: relative;
        }

        .staff-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 4px 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .dropdown-item {
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }

        .dropdown-item:hover {
          background-color: #f5f5f5;
        }

        .staff-name {
          font-weight: 500;
          color: #333;
        }

        .staff-meta {
          font-size: 12px;
          color: #999;
        }

        .error-text {
          color: #dc3545;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .text-muted {
          color: #999;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .form-checkbox label,
        .form-radio label {
          display: flex;
          align-items: center;
          cursor: pointer;
          margin-bottom: 8px;
          font-weight: normal;
        }

        .form-checkbox input,
        .form-radio input {
          margin-right: 8px;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          padding: 16px;
          border-top: 1px solid #e0e0e0;
          background-color: #f9f9f9;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #5a6268;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        textarea {
          resize: vertical;
        }
      `}</style>
    </div>
  );
};

export default ManualAttendanceForm;
