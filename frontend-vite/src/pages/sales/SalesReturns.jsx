import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import '../../styles/Purchases.css';
const SalesReturns = () => {
  const { showSuccess, showError } = useToast();
  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    sale_id: '',
    reason: '',
    notes: '',
    items: [],
  });
  const [currentItem, setCurrentItem] = useState({
    material_id: '',
    quantity: '',
    unit_price: '',
  });
  const loadReturns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/sales-returns/', { params: { page, per_page: 10 } });
      const raw = res.data?.data; setReturns(Array.isArray(raw) ? raw : (raw?.items || []));
    } catch (err) {
      showError('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };
  const loadSales = async () => {
    try {
      const res = await api.get('/api/sales/', { params: { status: 'approved', per_page: 100 } });
      const raw2 = res.data?.data; setSales(Array.isArray(raw2) ? raw2 : (raw2?.items || []));
    } catch (err) {
    }
  };
  useEffect(() => {
    loadReturns();
    loadSales();
  }, [page]);
  const addItem = () => {
    if (!currentItem.material_id || !currentItem.quantity || !currentItem.unit_price) {
      showError('Fill all item fields');
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, {
        ...currentItem,
        quantity: parseFloat(currentItem.quantity),
        unit_price: parseFloat(currentItem.unit_price),
        total: parseFloat(currentItem.quantity) * parseFloat(currentItem.unit_price),
      }],
    });
    setCurrentItem({ material_id: '', quantity: '', unit_price: '' });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sale_id || formData.items.length === 0 || !formData.reason) {
      showError('Fill all required fields');
      return;
    }
    try {
      await api.post('/api/sales-returns/', formData);
      showSuccess('Return created');
      resetForm();
      loadReturns();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create return');
    }
  };
  const approveReturn = async (id) => {
    if (window.confirm('Approve this return? Inventory will be restored.')) {
      try {
        await api.post(`/api/sales-returns/${id}/approve`);
        showSuccess('Return approved. Inventory restored.');
        loadReturns();
      } catch (err) {
        showError('Failed to approve');
      }
    }
  };
  const resetForm = () => {
    setFormData({ sale_id: '', reason: '', notes: '', items: [] });
    setCurrentItem({ material_id: '', quantity: '', unit_price: '' });
    setShowForm(false);
  };
  return (
    <div className="purchases-page theme-blue-white" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)', minHeight: '100vh' }}>
      <div className="purchases-container">
        <div className="purchases-header">
          <h1 style={{ color: '#0052CC' }}>Sales Returns</h1>
          <button className="btn btn-primary btn-blue-white" onClick={() => setShowForm(true)}>
            + New Return
          </button>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : returns.length === 0 ? (
          <div className="empty-state">No returns found</div>
        ) : (
          <div className="purchases-table">
            <table>
              <thead>
                <tr className="table-header-blue-white">
                  <th>Sale ID</th>
                  <th>Return Date</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((ret) => (
                  <tr key={ret.id} className="table-row-blue-white">
                    <td>INV-{ret.sale_id}</td>
                    <td>{new Date(ret.return_date).toLocaleDateString()}</td>
                    <td>₹{ret.total_amount.toFixed(2)}</td>
                    <td>{ret.reason.substring(0, 30)}...</td>
                    <td><span className={`status status-${ret.status}`}>{ret.status}</span></td>
                    <td>
                      {ret.status === 'pending' && (
                        <button className="btn-small btn-approve" onClick={() => approveReturn(ret.id)}>
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>New Sales Return</h2>
                <button className="close-btn" onClick={resetForm}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="purchase-form">
                <div className="form-group">
                  <label>Sale *</label>
                  <select required value={formData.sale_id} onChange={(e) => setFormData({...formData, sale_id: e.target.value})}>
                    <option value="">Select Sale</option>
                    {sales.map((s) => <option key={s.id} value={s.id}>INV-{s.id} (₹{s.grand_total})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Return Reason *</label>
                  <textarea required rows="2" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
                </div>
                <div className="items-section">
                  <h3>Return Items</h3>
                  <div className="item-inputs">
                    <input type="number" step="0.01" placeholder="Material ID" value={currentItem.material_id} onChange={(e) => setCurrentItem({...currentItem, material_id: e.target.value})} />
                    <input type="number" step="0.01" placeholder="Qty" value={currentItem.quantity} onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})} />
                    <input type="number" step="0.01" placeholder="Unit Price" value={currentItem.unit_price} onChange={(e) => setCurrentItem({...currentItem, unit_price: e.target.value})} />
                    <button type="button" className="btn btn-secondary" onClick={addItem}>Add</button>
                  </div>
                  {formData.items.length > 0 && (
                    <table className="items-table">
                      <thead>
                        <tr><th>Material ID</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.material_id}</td>
                            <td>{item.quantity}</td>
                            <td>₹{item.unit_price}</td>
                            <td>₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Return</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SalesReturns;
