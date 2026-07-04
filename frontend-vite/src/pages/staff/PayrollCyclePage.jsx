import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import FormModal from '../../components/FormModal';
import { PlusIcon, CalculatorIcon } from 'lucide-react';
const PayrollCyclePage = () => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    start_date: '',
    end_date: ''
  });
  useEffect(() => { fetchCycles(); }, []);
  const fetchCycles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/payroll/cycles');
      const raw = response.data?.data; setCycles(Array.isArray(raw) ? raw : (raw?.items || []));
    } catch (error) { showToast('Error fetching cycles', 'error'); }
    finally { setLoading(false); }
  };
  const handleSubmit = async () => {
    try {
      await api.post('/api/payroll/cycles', formData);
      showToast('Payroll cycle created successfully', 'success');
      setShowModal(false); fetchCycles();
    } catch (error) { showToast(error.response?.data?.message || 'Error creating cycle', 'error'); }
  };
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  if (loading) { return <div className="flex justify-center items-center h-64">Loading...</div>; }
  return (
    <div className="page-bg max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Payroll Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-white rounded-lg transition">
          <PlusIcon size={20} /> New Cycle
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card"><p className="text-secondary text-sm mb-1">Total Cycles</p><p className="text-2xl font-bold">{cycles.length}</p></div>
        <div className="stat-card border-primary"><p className="text-primary text-sm mb-1">Draft</p><p className="text-2xl font-bold text-primary">{cycles.filter(c => c.status === 'draft').length}</p></div>
        <div className="stat-card" style={{borderLeftColor: 'var(--color-success)'}}><p className="text-success text-sm mb-1">Approved</p><p className="text-2xl font-bold text-success">{cycles.filter(c => c.status === 'approved').length}</p></div>
        <div className="stat-card" style={{borderLeftColor: 'var(--color-info)'}}><p className="text-info text-sm mb-1">Paid</p><p className="text-2xl font-bold text-info">{cycles.filter(c => c.status === 'paid').length}</p></div>
      </div>
      <div className="card-bg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Period</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Start Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">End Date</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cycles.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center text-muted">No payroll cycles created yet</td></tr>
            ) : cycles.map(cycle => (
              <tr key={cycle.id} className="border-b">
                <td className="px-6 py-4 font-semibold">{months[cycle.month - 1]?.label} {cycle.year}</td>
                <td className="px-6 py-4">{cycle.start_date ? new Date(cycle.start_date).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4">{cycle.end_date ? new Date(cycle.end_date).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium badge-${cycle.status}`}>
                    {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {cycle.status === 'draft' && <button className="p-2 rounded transition text-primary"><CalculatorIcon size={18} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FormModal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Payroll Cycle" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Month *</label>
              <select className="w-full px-3 py-2 border rounded" value={formData.month} onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Year *</label>
              <input type="number" className="w-full px-3 py-2 border rounded" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" className="w-full px-3 py-2 border rounded" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" className="w-full px-3 py-2 border rounded" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} /></div>
          </div>
        </div>
      </FormModal>
    </div>
  );
};
export default PayrollCyclePage;
