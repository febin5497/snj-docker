import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

export default function RetentionTrackingPage() {
  const [retentions, setRetentions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [releaseModal, setReleaseModal] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadRetentions();
  }, []);

  const loadRetentions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/finance/retentions');
      setRetentions(response.data?.data || response.data?.items || response.data || []);
    } catch (error) {
      showToast('Error loading retentions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (retentionId) => {
    try {
      setLoading(true);
      await api.post(`/api/finance/retentions/${retentionId}/release`);
      showToast('Retention released successfully', 'success');
      setReleaseModal(null);
      await loadRetentions();
    } catch (error) {
      showToast('Error releasing retention', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Retention Tracking</h1>
        <p className="text-gray-600 mb-6">Manage pending retentions and release schedules</p>

        <div className="bg-white rounded-lg shadow">
          {retentions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No pending retentions</div>
          ) : (
            <table className="w-full">
              <thead className="bg-blue-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Invoice #</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Retention %</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Release Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {retentions.map(ret => (
                  <tr key={ret.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{ret.invoice_number || ret.id}</td>
                    <td className="px-6 py-4 text-sm font-medium">₹{ret.retention_amount?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{ret.retention_percentage}%</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{ret.retention_released_date ? new Date(ret.retention_released_date).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${ret.retention_status === 'released' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {ret.retention_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {ret.retention_status !== 'released' && (
                        <button
                          onClick={() => setReleaseModal(ret)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Release
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {releaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Release Retention</h2>
            <p className="text-gray-600 mb-4">Are you sure you want to release ₹{releaseModal.retention_amount?.toFixed(2)} retention?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRelease(releaseModal.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => setReleaseModal(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
