import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const ProjectProfitabilityReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  useEffect(() => {
    fetchReport();
  }, []);
  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/finance/reports/project-profitability');
      // Backend returns { success: true, data: [...projects...], message: "..." }
      const reportData = response.data?.data || response.data || [];
      setData(Array.isArray(reportData) ? reportData : []);
    } catch (error) {
      showToast('Error fetching profitability report: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="flex justify-center items-center h-64" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)' }}>Loading...</div>;
  }
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)' }}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#0052CC' }}>Project Profitability Report</h1>
      <div className="bg-white rounded-lg border p-6 mb-6" style={{ borderColor: '#e2e8f0' }}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            <Bar dataKey="profit" fill="#0052CC" name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="w-full">
          <thead style={{ backgroundColor: '#f0f5ff' }}>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#0052CC' }}>Project</th>
              <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: '#0052CC' }}>Revenue</th>
              <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: '#0052CC' }}>Expenses</th>
              <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: '#0052CC' }}>Profit</th>
              <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: '#0052CC' }}>Margin %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((project, idx) => (
              <tr key={idx} className="border-b" style={{ borderColor: '#e2e8f0', color: '#1e293b' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f5ff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td className="px-6 py-4 font-semibold">{project.name}</td>
                <td className="px-6 py-4 text-right">₹{(project.revenue || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">₹{(project.expenses || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-semibold">₹{(project.profit || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">{project.margin || 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ProjectProfitabilityReport;
