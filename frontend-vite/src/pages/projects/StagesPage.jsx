import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import FormModal from '../../components/FormModal';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
const StagesPage = () => {
  const { projectId } = useParams();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    percentage_complete: 0,
    billing_percentage: 0,
    planned_start_date: '',
    planned_end_date: ''
  });
  useEffect(() => {
    fetchStages();
  }, [projectId]);
  const fetchStages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/projects/${projectId}/stages`);
      setStages(response.data?.data || []);
    } catch (error) {
      showToast('Error fetching stages', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleCreateStage = () => {
    setSelectedStage(null);
    setFormData({
      name: '',
      description: '',
      percentage_complete: 0,
      billing_percentage: 0,
      planned_start_date: '',
      planned_end_date: ''
    });
    setShowModal(true);
  };
  const handleSubmit = async () => {
    if (!formData.name) {
      showToast('Stage name is required', 'error');
      return;
    }
    try {
      if (selectedStage) {
        await api.put(`/api/projects/${projectId}/stages/${selectedStage.id}`, formData);
        showToast('Stage updated successfully', 'success');
      } else {
        await api.post(`/api/projects/${projectId}/stages`, formData);
        showToast('Stage created successfully', 'success');
      }
      setShowModal(false);
      fetchStages();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error saving stage', 'error');
    }
  };
  const handleDeleteStage = async (stageId) => {
    if (!window.confirm('Are you sure you want to delete this stage?')) return;
    try {
      await api.delete(`/api/projects/${projectId}/stages/${stageId}`);
      showToast('Stage deleted successfully', 'success');
      fetchStages();
    } catch (error) {
      showToast('Error deleting stage', 'error');
    }
  };
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  return (
    <div className="page-bg max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Project Stages</h1>
        <button
          onClick={handleCreateStage}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-white rounded-lg transition"
        >
          <PlusIcon size={20} />
          New Stage
        </button>
      </div>
      <div className="card-bg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Stage Name</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Progress %</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Billing %</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Start Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">End Date</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stages.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-muted">
                  No stages created yet
                </td>
              </tr>
            ) : (
              stages.map(stage => (
                <tr key={stage.id} className="border-b">
                  <td className="px-6 py-4 font-semibold">{stage.name}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="progress-bar-bg w-16 h-2 rounded-full overflow-hidden mx-auto">
                      <div
                        className="progress-bar-fill h-full"
                        style={{ width: `${stage.percentage_complete}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">{stage.percentage_complete}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">{stage.billing_percentage}%</td>
                  <td className="px-6 py-4 text-sm">
                    {stage.planned_start_date ? new Date(stage.planned_start_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {stage.planned_end_date ? new Date(stage.planned_end_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-center flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        setSelectedStage(stage);
                        setFormData({
                          name: stage.name,
                          description: stage.description || '',
                          percentage_complete: stage.percentage_complete || 0,
                          billing_percentage: stage.billing_percentage || 0,
                          planned_start_date: stage.planned_start_date || '',
                          planned_end_date: stage.planned_end_date || ''
                        });
                        setShowModal(true);
                      }}
                      className="p-2 rounded transition text-primary"
                    >
                      <EditIcon size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteStage(stage.id)}
                      className="p-2 rounded transition text-danger"
                    >
                      <TrashIcon size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedStage ? 'Edit Stage' : 'Create Stage'}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Stage Name *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Progress %</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2 border rounded"
                value={formData.percentage_complete}
                onChange={(e) => setFormData({ ...formData, percentage_complete: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Billing %</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2 border rounded"
                value={formData.billing_percentage}
                onChange={(e) => setFormData({ ...formData, billing_percentage: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded"
                value={formData.planned_start_date}
                onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded"
                value={formData.planned_end_date}
                onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
              />
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
};
export default StagesPage;
