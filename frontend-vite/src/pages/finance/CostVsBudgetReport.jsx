import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
const CostVsBudgetReport = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  useEffect(() => {
    fetchReport();
  }, []);
  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/finance/reports/cost-vs-budget');
      // Backend returns { success: true, data: { summary: {...}, categories: [...] }, message: "..." }
      const responseData = response.data?.data || response.data || {};
      const categoriesData = Array.isArray(responseData) ? responseData : (responseData.categories || []);
      const summaryData = responseData.summary || null;
      setData(Array.isArray(categoriesData) ? categoriesData : []);
      setSummary(summaryData);
    } catch (error) {
      showToast('Error fetching budget report: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };
  const COLORS = ['#0052CC', '#ef4444', '#10b981'];
  if (loading) {
    return <div className="flex justify-center items-center h-64" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)' }}>Loading...</div>;
  }
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)' }}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#0052CC' }}>Budget vs Actual Report</h1>
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-sm" style={{ color: '#64748b' }}>Total Budget</p>
            <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>₹{(summary.total_budget || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-sm" style={{ color: '#64748b' }}>Total Spent</p>
            <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>₹{(summary.total_spent || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-sm" style={{ color: '#64748b' }}>Variance</p>
            <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{summary.variance || 0}%</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" fill="#0052CC" name="Budget" />
              <Bar dataKey="spent" fill="#ef4444" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} dataKey="spent" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Budget</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Spent</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Variance</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">% Used</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold">{row.category}</td>
                <td className="px-6 py-4 text-right">₹{(row.budget || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">₹{(row.spent || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">₹{(row.variance || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">{row.percent_used || 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CostVsBudgetReport;
