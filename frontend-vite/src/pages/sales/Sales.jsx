import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import '../../styles/Purchases.css';
const Sales = () => {
  const { showSuccess, showError } = useToast();
  const [sales, setSales] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    items: [],
    tax: 0,
    notes: ''
  });
  const [currentItem, setCurrentItem] = useState({
    material_id: '',
    quantity: '',
    unit_price: '',
  });
  const loadSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/sales/', {
        params: { page, per_page: 10, status: statusFilter || undefined }
      });
      const raw = res.data?.data; setSales(Array.isArray(raw) ? raw : (raw?.items || []));
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      showError('Failed to load sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };
  const loadMaterials = async () => {
    try {
      const res = await api.get(`/api/materials/`);
      // Handle both array and wrapped object responses
      const materialsList = Array.isArray(res.data) ? res.data : (res.data.data || res.data || []);
      setMaterials(materialsList);
    } catch (err) {
      setMaterials([]);
    }
  };
  useEffect(() => {
    loadSales();
  }, [page, statusFilter]);
  useEffect(() => {
    loadMaterials();
  }, []);
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
    if (formData.items.length === 0) {
      showError('Add at least one item');
      return;
    }
    try {
      const payload = {
        ...formData,
        sale_date: new Date(formData.sale_date).toISOString(),
        tax: parseFloat(formData.tax) || 0,
      };
      await api.post('/api/sales/', payload);
      showSuccess('Sale created');
      resetForm();
      loadSales();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save sale');
    }
  };
  const approveSale = async (id) => {
    if (window.confirm('Approve this sale? This will decrease inventory.')) {
      try {
        await api.post(`/api/sales/${id}/approve`);
        showSuccess('Sale approved. Inventory updated.');
        loadSales();
      } catch (err) {
        showError(err.response?.data?.error || 'Failed to approve');
      }
    }
  };
  const deleteSale = async (id) => {
    if (window.confirm('Delete this sale?')) {
      try {
        await api.delete(`/api/sales/${id}`);
        showSuccess('Sale deleted');
        loadSales();
      } catch (err) {
        showError('Cannot delete');
      }
    }
  };
  const resetForm = () => {
    setFormData({
      sale_date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      items: [],
      tax: 0,
      notes: ''
    });
    setCurrentItem({ material_id: '', quantity: '', unit_price: '' });
    setShowForm(false);
  };
  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    return subtotal + parseFloat(formData.tax || 0);
  };
  return (
    <div className="page-bg">
      <div className="max-w-7xl mx-auto">
      <div className="purchases-page">
      <div className="purchases-container">
        <div className="purchases-header">
          <h1 className="text-primary">Sales</h1>
          <button className="btn btn-primary bg-primary" onClick={() => setShowForm(true)}>
            + New Sale
          </button>
        </div>
        <div className="filters">
          <select value={statusFilter} onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }} className="filter-select">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>
        {loading ? (
          <div className="loading">Loading sales...</div>
        ) : sales.length === 0 ? (
          <div className="empty-state">No sales found</div>
        ) : (
          <div className="purchases-table">
            <table>
              <thead>
                <tr>
                  <th className="text-primary">Invoice</th>
                  <th className="text-primary">Date</th>
                  <th className="text-primary">Total</th>
                  <th className="text-primary">Status</th>
                  <th className="text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="card-bg">
                    <td>{sale.invoice_number || `INV-${sale.id}`}</td>
                    <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                    <td>₹{sale.grand_total.toFixed(2)}</td>
                    <td><span className={`status status-${sale.status}`}>{sale.status}</span></td>
                    <td className="actions">
                      {sale.status === 'pending' && (
                        <>
                          <button className="btn-small btn-approve" onClick={() => approveSale(sale.id)}>
                            Approve
                          </button>
                          <button className="btn-small btn-delete" onClick={() => deleteSale(sale.id)}>
                            Delete
                          </button>
                        </>
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
              <div className="modal-header" style={{ borderBottom: '2px solid #0052CC' }}>
                <h2 className="text-primary">New Sale</h2>
                <button className="close-btn" onClick={resetForm}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="purchase-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Sale Date</label>
                    <input type="date" value={formData.sale_date} onChange={(e) => setFormData({...formData, sale_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Invoice Number</label>
                    <input type="text" value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} />
                  </div>
                </div>
                <div className="items-section">
                  <h3>Items</h3>
                  <div className="item-inputs">
                    <select value={currentItem.material_id} onChange={(e) => setCurrentItem({...currentItem, material_id: e.target.value})}>
                      <option value="">Material</option>
                      {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input type="number" step="0.01" placeholder="Qty" value={currentItem.quantity} onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})} />
                    <input type="number" step="0.01" placeholder="Price" value={currentItem.unit_price} onChange={(e) => setCurrentItem({...currentItem, unit_price: e.target.value})} />
                    <button type="button" className="btn btn-secondary" onClick={addItem}>Add</button>
                  </div>
                  {formData.items.length > 0 && (
                    <table className="items-table">
                      <thead>
                        <tr><th className="text-primary">Material</th><th className="text-primary">Qty</th><th className="text-primary">Price</th><th className="text-primary">Total</th></tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => {
                          const material = materials.find(m => m.id == item.material_id);
                          return (
                            <tr key={idx}>
                              <td>{material?.name}</td>
                              <td>{item.quantity}</td>
                              <td>₹{item.unit_price}</td>
                              <td>₹{item.total.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="form-group">
                  <label>Tax</label>
                  <input type="number" step="0.01" value={formData.tax} onChange={(e) => setFormData({...formData, tax: e.target.value})} />
                </div>
                <div className="totals">
                  <div className="total-row grand-total">
                    <span>Total:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary bg-primary">Create Sale</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
};
export default Sales;