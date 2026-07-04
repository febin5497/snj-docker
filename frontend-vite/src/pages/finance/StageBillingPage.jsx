import React, { useState, useEffect } from 'react';
import FormModal from '../../components/FormModal';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

export default function StageBillingPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [formData, setFormData] = useState({
    stage_name: '',
    stage_number: '',
    billing_percentage: '',
    milestone_date: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState([]);
  const { showToast } = useToast();

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load stages when project changes
  useEffect(() => {
    if (selectedProject) {
      loadStages();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/projects');
      setProjects(response.data?.data || response.data?.items || response.data || []);
    } catch (error) {
      showToast('Error loading projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/projects/${selectedProject}/stages`);
      setStages(response.data?.data || response.data?.items || response.data || []);
    } catch (error) {
      showToast('Error loading stages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.stage_name?.trim()) errors.push('Stage name is required');
    if (!formData.stage_number) errors.push('Stage number is required');
    if (!formData.billing_percentage) errors.push('Billing percentage is required');
    if (formData.billing_percentage && (parseFloat(formData.billing_percentage) <= 0 || parseFloat(formData.billing_percentage) > 100)) {
      errors.push('Billing percentage must be between 0 and 100');
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        stage_name: formData.stage_name,
        stage_number: parseInt(formData.stage_number),
        billing_percentage: parseFloat(formData.billing_percentage),
        milestone_date: formData.milestone_date || null,
        description: formData.description || null,
      };

      if (selectedStage) {
        // Update
        await api.put(`/api/projects/${selectedProject}/stages/${selectedStage.id}`, payload);
        showToast('Stage updated successfully', 'success');
      } else {
        // Create
        await api.post(`/api/projects/${selectedProject}/stages`, payload);
        showToast('Stage created successfully', 'success');
      }

      setFormOpen(false);
      setFormData({ stage_name: '', stage_number: '', billing_percentage: '', milestone_date: '', description: '' });
      setSelectedStage(null);
      await loadStages();
    } catch (error) {
      showToast(error.response?.data?.error || 'Error saving stage', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stageId) => {
    if (window.confirm('Are you sure you want to delete this stage?')) {
      try {
        setLoading(true);
        await api.delete(`/api/projects/${selectedProject}/stages/${stageId}`);
        showToast('Stage deleted successfully', 'success');
        await loadStages();
      } catch (error) {
        showToast('Error deleting stage', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (stage) => {
    setSelectedStage(stage);
    setFormData({
      stage_name: stage.stage_name,
      stage_number: stage.stage_number,
      billing_percentage: stage.billing_percentage,
      milestone_date: stage.milestone_date ? stage.milestone_date.split('T')[0] : '',
      description: stage.description || '',
    });
    setFormErrors([]);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedStage(null);
    setFormData({ stage_name: '', stage_number: '', billing_percentage: '', milestone_date: '', description: '' });
    setFormErrors([]);
    setFormOpen(true);
  };

  const totalPercentage = stages.reduce((sum, s) => sum + (s.billing_percentage || 0), 0);
  const projectName = projects.find(p => p.id === selectedProject)?.name || 'Select a project';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Stage-Based Billing</h1>
          <p className="text-gray-600 mt-2">Manage project stages and billing schedules</p>
        </div>

        {/* Project Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Project</label>
          <select
            value={selectedProject || ''}
            onChange={(e) => {
              const projectId = parseInt(e.target.value) || null;
              setSelectedProject(projectId);
            }}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Choose a project --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <>
            {/* Billing Percentage Progress */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Billing Allocation</h3>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${totalPercentage > 100 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                />
              </div>
              <p className={`mt-2 text-sm font-medium ${totalPercentage > 100 ? 'text-red-600' : 'text-green-600'}`}>
                {totalPercentage.toFixed(2)}% Allocated {totalPercentage > 100 && '(exceeds 100%)'}
              </p>
            </div>

            {/* Add Button */}
            <div className="mb-6">
              <button
                onClick={handleAddNew}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                + Add New Stage
              </button>
            </div>

            {/* Stages Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {stages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No stages created yet. Click "Add New Stage" to get started.
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-blue-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Stage #</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Stage Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Billing %</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Milestone Date</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stages.map((stage, idx) => (
                      <tr key={stage.id} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                        <td className="px-6 py-4 text-sm text-gray-700">{stage.stage_number}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{stage.stage_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{stage.billing_percentage}%</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{stage.milestone_date ? new Date(stage.milestone_date).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${stage.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {stage.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => handleEdit(stage)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(stage.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={formOpen}
        title={selectedStage ? 'Edit Stage' : 'Add New Stage'}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={loading}
      >
        {formErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            {formErrors.map((err, idx) => (
              <p key={idx} className="text-sm text-red-700">{err}</p>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage Number</label>
            <input
              type="number"
              value={formData.stage_number}
              onChange={(e) => setFormData({ ...formData, stage_number: e.target.value })}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing %</label>
            <input
              type="number"
              step="0.01"
              value={formData.billing_percentage}
              onChange={(e) => setFormData({ ...formData, billing_percentage: e.target.value })}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Stage Name</label>
          <input
            type="text"
            value={formData.stage_name}
            onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Date</label>
          <input
            type="date"
            value={formData.milestone_date}
            onChange={(e) => setFormData({ ...formData, milestone_date: e.target.value })}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
      </FormModal>
    </div>
  );
}
