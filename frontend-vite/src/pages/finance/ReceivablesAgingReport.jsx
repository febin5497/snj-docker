import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
const ReceivablesAgingReport = () => {
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
      const response = await api.get('/api/finance/reports/receivables-aging');
      // Backend returns { success: true, data: { summary: {...}, aging_buckets: [...] }, message: "..." }
      const responseData = response.data?.data || response.data || {};
      const bucketsData = responseData.aging_buckets || [];
      const summaryData = responseData.summary || null;
      setData(Array.isArray(bucketsData) ? bucketsData : []);
      setSummary(summaryData);
    } catch (error) {
      showToast('Error fetching receivables aging report: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };
  const COLORS = ['#10b981', '#fbbf24', '#f87171', '#ef4444'];
  if (loading) {
    return <div className="flex justify-center items-center h-64" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)' }}>Loading...</div>;
  }
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)' }}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#0052CC' }}>Receivables Aging Report</h1>
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-sm" style={{ color: '#64748b' }}>Total Receivables</p>
            <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>₹{(summary.total || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-sm" style={{ color: '#64748b' }}>Current (0-30)</p>
            <p className="text-2xl font-bold" style={{ color: '#10b981' }}>₹{(summary.current || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-sm" style={{ color: '#64748b' }}>Overdue (31-90)</p>
            <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>₹{(summary.thirty_plus || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-sm" style={{ color: '#64748b' }}>Long Overdue (90+)</p>
            <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>₹{(summary.ninety_plus || 0).toLocaleString()}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#0052CC" name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e2e8f0' }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} dataKey="amount" nameKey="bucket" cx="50%" cy="50%" outerRadius={80} label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Aging Bucket</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Number of Invoices</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Total Amount</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold">{row.bucket}</td>
                <td className="px-6 py-4 text-right">{row.invoice_count || 0}</td>
                <td className="px-6 py-4 text-right">₹{(row.amount || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">{row.percent || 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ReceivablesAgingReport;
