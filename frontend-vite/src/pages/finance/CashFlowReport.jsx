import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const CashFlowReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  useEffect(() => {
    fetchReport();
  }, []);
  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/finance/reports/cash-flow');
      // Backend returns { success: true, data: [...daily flows...], message: "..." }
      const reportData = response.data?.data || response.data || [];
      setData(Array.isArray(reportData) ? reportData : []);
    } catch (error) {
      showToast('Error fetching cash flow report: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="flex justify-center items-center h-64" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)' }}>Loading...</div>;
  }
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)' }}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#0052CC' }}>Cash Flow Report</h1>
      <div className="bg-white rounded-lg border p-6 mb-6" style={{ borderColor: '#e2e8f0' }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="inflow" stroke="#10b981" name="Cash Inflow" />
            <Line type="monotone" dataKey="outflow" stroke="#ef4444" name="Cash Outflow" />
            <Line type="monotone" dataKey="balance" stroke="#0052CC" name="Balance" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="w-full">
          <thead style={{ backgroundColor: '#f0f5ff' }}>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#0052CC' }}>Date</th>
              <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: '#0052CC' }}>Inflow</th>
              <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: '#0052CC' }}>Outflow</th>
              <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: '#0052CC' }}>Net Flow</th>
              <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: '#0052CC' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b" style={{ borderColor: '#e2e8f0', color: '#1e293b' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f5ff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td className="px-6 py-4">{row.date}</td>
                <td className="px-6 py-4 text-right font-semibold" style={{ color: '#10b981' }}>₹{(row.inflow || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-semibold" style={{ color: '#ef4444' }}>₹{(row.outflow || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-semibold">₹{((row.inflow || 0) - (row.outflow || 0)).toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-bold" style={{ color: '#0052CC' }}>₹{(row.balance || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CashFlowReport;
