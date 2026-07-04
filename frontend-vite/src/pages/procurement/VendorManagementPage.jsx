import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import { PlusIcon } from 'lucide-react';
const VendorManagementPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  useEffect(() => {
    fetchVendors();
  }, []);
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/suppliers');
      setVendors(response.data?.data || []);
    } catch (error) {
      showToast('Error fetching vendors', 'error');
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#0052CC' }}>Vendor Management</h1>
        <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition" style={{ backgroundColor: '#0052CC' }} onMouseEnter={(e) => e.target.style.opacity = '0.85'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
          <PlusIcon size={20} />
          New Vendor
        </button>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="w-full">
          <thead style={{ backgroundColor: '#f0f5ff' }}>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#0052CC' }}>Vendor Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#0052CC' }}>Contact</th>
              <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#0052CC' }}>GSTIN</th>
              <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: '#0052CC' }}>Credit Limit</th>
              <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: '#0052CC' }}>Performance Score</th>
              <th className="px-6 py-3 text-center text-sm font-semibold" style={{ color: '#0052CC' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center" style={{ color: '#64748b' }}>
                  No vendors found
                </td>
              </tr>
            ) : (
              vendors.map(vendor => (
                <tr key={vendor.id} className="border-b" style={{ borderColor: '#e2e8f0', color: '#1e293b' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f5ff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="px-6 py-4 font-semibold">{vendor.name}</td>
                  <td className="px-6 py-4">{vendor.contact_person || '-'}</td>
                  <td className="px-6 py-4 font-mono text-sm">{vendor.gstin || '-'}</td>
                  <td className="px-6 py-4 text-right">₹{(vendor.credit_limit || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">{vendor.performance_score || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#f0fdf4', color: '#10b981' }}>
                      Active
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default VendorManagementPage;
