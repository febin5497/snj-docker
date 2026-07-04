/**
 * Attendance API Helper
 * Provides clean interface for all attendance-related API calls
 */

import api from './api';

/**
 * Staff Attendance APIs
 */
export const attendanceAPI = {
  // ==================== PUNCH-IN/OUT ====================

  /**
   * Submit photo for punch-in
   * @param {File} photoFile - Photo file from camera
   * @param {string} timestampCaptured - ISO 8601 timestamp when photo was taken
   * @returns {Promise} Response with photo_id and status
   */
  submitPunchInPhoto: async (photoFile, timestampCaptured) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('timestamp_captured', timestampCaptured);

    return api.post('/api/attendance/punch-in-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Get today's attendance status
   * @returns {Promise} Response with today's punch status
   */
  getTodayStatus: async () => {
    return api.get('/api/attendance/today-status');
  },

  /**
   * Record punch-out
   * @returns {Promise} Response with punch-out confirmation
   */
  punchOut: async () => {
    return api.post('/api/attendance/punch-out');
  },

  /**
   * Get recent attendance records (7 days)
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} Response with attendance records
   */
  getRecentRecords: async (startDate, endDate) => {
    return api.get('/api/attendance/report', {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
  },

  /**
   * Get attendance report with filters
   * @param {Object} filters - Filter object with start_date, end_date, staff_id, status, page, limit
   * @returns {Promise} Response with filtered attendance records
   */
  getReport: async (filters) => {
    const params = {};
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.staff_id) params.staff_id = filters.staff_id;
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    return api.get('/api/attendance/report', { params });
  },

  /**
   * Mark leave for today
   * @param {string} leaveReason - Reason for leave
   * @returns {Promise} Response with success status
   */
  markLeave: async (leaveReason) => {
    return api.post('/api/attendance/mark-leave', {
      leave_reason: leaveReason
    });
  },

  /**
   * Update overtime hours
   * @param {number} overtimeHours - Number of overtime hours
   * @returns {Promise} Response with updated record
   */
  updateOvertime: async (overtimeHours) => {
    return api.post('/api/attendance/update-overtime', {
      overtime_hours: parseFloat(overtimeHours)
    });
  },

  /**
   * Update night shift status
   * @param {boolean} nightShift - Whether staff worked night shift
   * @returns {Promise} Response with updated record
   */
  updateNightShift: async (nightShift) => {
    return api.post('/api/attendance/update-night-shift', {
      night_shift: Boolean(nightShift)
    });
  },

  // ==================== STATISTICS ====================

  /**
   * Get attendance statistics for a staff member
   * @param {number} staffId - Staff member ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} Response with attendance stats
   */
  getStats: async (staffId, startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    return api.get(`/api/attendance/stats/${staffId}`, { params });
  },

  // ==================== APPROVAL WORKFLOW ====================

  /**
   * Get pending photo approvals
   * @param {string} date - Optional date filter (YYYY-MM-DD)
   * @param {number} limit - Number of results per page
   * @param {number} offset - Pagination offset
   * @returns {Promise} Response with pending photos
   */
  getPendingApprovals: async (date, limit = 20, offset = 0) => {
    const params = { limit, offset };
    if (date) params.date = date;

    return api.get('/api/attendance/approvals/pending', { params });
  },

  /**
   * Get approval statistics
   * @param {string} date - Optional date filter (YYYY-MM-DD)
   * @returns {Promise} Response with approval counts
   */
  getApprovalStats: async (date) => {
    const params = {};
    if (date) params.date = date;

    return api.get('/api/attendance/approvals/stats', { params });
  },

  /**
   * Approve a pending photo
   * @param {number} photoId - Photo ID to approve
   * @param {string} notes - Optional approval notes
   * @returns {Promise} Response with approval confirmation
   */
  approvePhoto: async (photoId, notes = '') => {
    return api.post(`/api/attendance/approvals/${photoId}/approve`, {
      notes: notes || ''
    });
  },

  /**
   * Reject a pending photo
   * @param {number} photoId - Photo ID to reject
   * @param {string} rejectionReason - Reason for rejection
   * @returns {Promise} Response with rejection confirmation
   */
  rejectPhoto: async (photoId, rejectionReason) => {
    return api.post(`/api/attendance/approvals/${photoId}/reject`, {
      rejection_reason: rejectionReason || 'Rejected'
    });
  },

  /**
   * Bulk approve multiple photos
   * @param {number[]} photoIds - Array of photo IDs to approve
   * @returns {Promise} Response with approval counts
   */
  bulkApprovePhotos: async (photoIds) => {
    return api.post('/api/attendance/approvals/bulk-approve', {
      photo_ids: photoIds
    });
  },

  /**
   * Bulk reject multiple photos
   * @param {number[]} photoIds - Array of photo IDs to reject
   * @param {string} reason - Rejection reason for all photos
   * @returns {Promise} Response with rejection counts
   */
  bulkRejectPhotos: async (photoIds, reason = 'Rejected') => {
    return api.post('/api/attendance/approvals/bulk-reject', {
      photo_ids: photoIds,
      reason: reason
    });
  },

  // ==================== MANUAL ENTRY (HR/ADMIN) ====================

  /**
   * Manually record punch-in/out (HR only)
   * @param {number} staffId - Staff member ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @param {string} punchInTime - Punch-in time (ISO 8601)
   * @param {string} punchOutTime - Punch-out time (ISO 8601)
   * @param {number} overtimeHours - Overtime hours (optional)
   * @param {boolean} nightShift - Whether night shift (optional)
   * @param {boolean} saveAndApprove - Auto-approve or save as pending
   * @returns {Promise} Response with attendance record
   */
  manualPunch: async ({
    staffId,
    date,
    punchInTime,
    punchOutTime,
    overtimeHours = 0,
    nightShift = false,
    saveAndApprove = false
  }) => {
    const data = {
      staff_id: staffId,
      date: date,
      save_and_approve: saveAndApprove
    };

    if (punchInTime) data.punch_in_time = punchInTime;
    if (punchOutTime) data.punch_out_time = punchOutTime;
    if (overtimeHours > 0) data.overtime_hours = parseFloat(overtimeHours);
    if (nightShift) data.night_shift = true;

    return api.post('/api/attendance/manual-punch', data);
  },

  // ==================== CRUD OPERATIONS ====================

  /**
   * Get all attendance records with filters
   * @param {number} page - Page number
   * @param {number} perPage - Results per page
   * @param {number} staffId - Optional staff filter
   * @param {string} department - Optional department filter
   * @param {string} startDate - Optional start date
   * @param {string} endDate - Optional end date
   * @param {boolean} presentOnly - Only show present staff
   * @returns {Promise} Response with attendance records
   */
  getAllAttendance: async ({
    page = 1,
    perPage = 10,
    staffId,
    department,
    startDate,
    endDate,
    presentOnly = false
  } = {}) => {
    const params = { page, per_page: perPage };
    if (staffId) params.staff_id = staffId;
    if (department) params.department = department;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (presentOnly) params.present_only = 'true';

    return api.get('/api/attendance/', { params });
  },

  /**
   * Create attendance record
   * @param {Object} data - Attendance data
   * @returns {Promise} Response with created record
   */
  createAttendance: async (data) => {
    return api.post('/api/attendance/', data);
  },

  /**
   * Get attendance record by ID
   * @param {number} attendanceId - Attendance record ID
   * @returns {Promise} Response with attendance record
   */
  getAttendanceById: async (attendanceId) => {
    return api.get(`/api/attendance/${attendanceId}`);
  },

  /**
   * Update attendance record
   * @param {number} attendanceId - Attendance record ID
   * @param {Object} data - Fields to update
   * @returns {Promise} Response with updated record
   */
  updateAttendance: async (attendanceId, data) => {
    return api.put(`/api/attendance/${attendanceId}`, data);
  },

  /**
   * Delete attendance record
   * @param {number} attendanceId - Attendance record ID
   * @returns {Promise} Response with success status
   */
  deleteAttendance: async (attendanceId) => {
    return api.delete(`/api/attendance/${attendanceId}`);
  },

  // ==================== PHOTO RETRIEVAL ====================

  /**
   * Get photo file by ID
   * @param {number} photoId - Photo ID
   * @returns {Promise} Response with photo file
   */
  getPhotoFile: async (photoId) => {
    return api.get(`/api/attendance/photos/${photoId}`, {
      responseType: 'blob'
    });
  },

  // ==================== EXPORT ====================

  /**
   * Export attendance records to CSV or PDF
   * @param {string} format - Export format (csv or pdf)
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} Response with file blob
   */
  exportRecords: async (format = 'csv', startDate, endDate) => {
    return api.get('/api/attendance/export', {
      params: {
        format: format,
        start_date: startDate,
        end_date: endDate
      },
      responseType: 'blob'
    });
  }
};

export default attendanceAPI;
