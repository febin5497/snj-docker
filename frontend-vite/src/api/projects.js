/**
 * Projects API Helper
 * Provides clean interface for all project-related API calls
 */

import api from './api';

export const projectAPI = {
  // ==================== PROJECT MANAGEMENT ====================

  /**
   * Get all projects
   * @returns {Promise} Response with projects list
   */
  getAllProjects: async () => {
    return api.get('/api/projects');
  },

  /**
   * Get single project by ID
   * @param {number} projectId - Project ID
   * @returns {Promise} Response with project details
   */
  getProject: async (projectId) => {
    return api.get(`/api/projects/${projectId}`);
  },

  // ==================== STAFF ASSIGNMENT ====================

  /**
   * Get assigned staff for a project
   * @param {number} projectId - Project ID
   * @returns {Promise} Response with assigned staff list
   */
  getAssignedStaff: async (projectId) => {
    return api.get(`/api/projects/${projectId}/staff`);
  },

  /**
   * Get staff assignment history for a project
   * @param {number} projectId - Project ID
   * @returns {Promise} Response with assignment history
   */
  getStaffHistory: async (projectId) => {
    return api.get(`/api/projects/${projectId}/history`);
  },

  /**
   * Assign staff to project
   * @param {number} projectId - Project ID
   * @param {number} staffId - Staff ID
   * @returns {Promise} Response with assignment details
   */
  assignStaff: async (projectId, staffId) => {
    return api.post(`/api/projects/${projectId}/assign-staff`, {
      staff_id: staffId
    });
  },

  /**
   * Remove staff from project
   * @param {number} projectId - Project ID
   * @param {number} staffId - Staff ID
   * @returns {Promise} Response with removal confirmation
   */
  unassignStaff: async (projectId, staffId) => {
    return api.post(`/api/projects/${projectId}/unassign-staff`, {
      staff_id: staffId
    });
  },

  /**
   * Bulk assign multiple staff to project
   * @param {number} projectId - Project ID
   * @param {array} staffIds - Array of staff IDs
   * @returns {Promise} Response with bulk assignment results
   */
  bulkAssignStaff: async (projectId, staffIds) => {
    return api.post(`/api/projects/${projectId}/assign-staff-bulk`, {
      staff_ids: staffIds
    });
  },

  /**
   * Reassign staff between projects
   * @param {number} fromProjectId - Source project ID
   * @param {number} toProjectId - Target project ID
   * @param {number} staffId - Staff ID
   * @returns {Promise} Response with reassignment details
   */
  reassignStaff: async (fromProjectId, toProjectId, staffId) => {
    return api.post(`/api/projects/${fromProjectId}/reassign-staff`, {
      staff_id: staffId,
      to_project_id: toProjectId
    });
  }
};

export default projectAPI;
