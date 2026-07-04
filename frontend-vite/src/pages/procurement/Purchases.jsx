import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import '../../styles/Purchases.css';
const Purchases = () => {
  const { showSuccess, showError } = useToast();
  const [purchases, setPurchases] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    po_number: '',
    items: [],
    tax: 0,
    notes: ''
  });
  const [currentItem, setCurrentItem] = useState({
    material_id: '',
    quantity: '',
    unit_price: '',
  });
  const loadPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/purchases/', {
        params: { page, per_page: 10, status: statusFilter || undefined }
      });
      const raw = res.data?.data; setPurchases(Array.isArray(raw) ? raw : (raw?.items || []));
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      showError('Failed to load purchases');
      setPurchases([]);
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
  const loadSuppliers = async () => {
    try {
      const res = await api.get('/api/suppliers/', { params: { per_page: 100 } });
      const raw2 = res.data?.data; setSuppliers(Array.isArray(raw2) ? raw2 : (raw2?.items || []));
    } catch (err) {
      setSuppliers([]);
    }
  };
  useEffect(() => {
    loadPurchases();
  }, [page, statusFilter]);
  useEffect(() => {
    loadMaterials();
    loadSuppliers();
  }, []);
  const addItem = () => {
    if (!currentItem.material_id || !currentItem.quantity || !currentItem.unit_price) {
      showError('Please fill all item fields');
      return;
    }
    const newItem = {
      ...currentItem,
      quantity: parseFloat(currentItem.quantity),
      unit_price: parseFloat(currentItem.unit_price),
      total: parseFloat(currentItem.quantity) * parseFloat(currentItem.unit_price),
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
    setCurrentItem({ material_id: '', quantity: '', unit_price: '' });
  };
  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      showError('Please select a supplier');
      return;
    }
    if (formData.items.length === 0) {
      showError('Please add at least one item');
      return;
    }
    try {
      const payload = {
        ...formData,
        purchase_date: new Date(formData.purchase_date).toISOString(),
        expected_delivery_date: formData.expected_delivery_date ? new Date(formData.expected_delivery_date).toISOString() : null,
        tax: parseFloat(formData.tax) || 0,
      };
      if (editingId) {
        await api.put(`/api/purchases/${editingId}`, payload);
        showSuccess('Purchase updated');
      } else {
        await api.post('/api/purchases/', payload);
        showSuccess('Purchase created');
      }
      resetForm();
      loadPurchases();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save purchase');
    }
  };
  const approvePurchase = async (id) => {
    if (window.confirm('Approve this purchase? This will update inventory and create accounting entry.')) {
      try {
        await api.post(`/api/purchases/${id}/approve`);
        showSuccess('Purchase approved. Inventory updated.');
        loadPurchases();
      } catch (err) {
        showError(err.response?.data?.error || 'Failed to approve');
      }
    }
  };
  const deletePurchase = async (id) => {
    if (window.confirm('Delete this purchase?')) {
      try {
        await api.delete(`/api/purchases/${id}`);
        showSuccess('Purchase deleted');
        loadPurchases();
      } catch (err) {
        showError(err.response?.data?.error || 'Cannot delete');
      }
    }
  };
  const resetForm = () => {
    setFormData({
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      po_number: '',
      items: [],
      tax: 0,
      notes: '',
    });
    setCurrentItem({ material_id: '', quantity: '', unit_price: '' });
    setEditingId(null);
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
          <h1 className="text-primary">Purchases</h1>
          <button className="btn btn-primary bg-primary" onClick={() => setShowForm(true)}>
            + New Purchase
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
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? (
          <div className="loading">Loading purchases...</div>
        ) : purchases.length === 0 ? (
          <div className="empty-state">No purchases found</div>
        ) : (
          <div className="purchases-table">
            <table>
              <thead>
                <tr>
                  <th className="text-primary">PO Number</th>
                  <th className="text-primary">Supplier</th>
                  <th className="text-primary">Date</th>
                  <th className="text-primary">Total</th>
                  <th className="text-primary">Status</th>
                  <th className="text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="card-bg">
                    <td>{purchase.po_number || `PO-${purchase.id}`}</td>
                    <td>{purchase.supplier_name}</td>
                    <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                    <td>₹{purchase.grand_total.toFixed(2)}</td>
                    <td>
                      <span className={`status status-${purchase.status}`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td className="actions">
                      {purchase.status === 'pending' && (
                        <>
                          <button
                            className="btn-small btn-approve"
                            onClick={() => approvePurchase(purchase.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-small btn-delete"
                            onClick={() => deletePurchase(purchase.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {purchase.status !== 'pending' && (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-small">
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-small">
              Next
            </button>
          </div>
        )}
        {showForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ borderBottom: '2px solid #0052CC' }}>
                <h2 className="text-primary">New Purchase Order</h2>
                <button className="close-btn" onClick={resetForm}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="purchase-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Supplier *</label>
                    <select
                      required
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>PO Number</label>
                    <input
                      type="text"
                      value={formData.po_number}
                      onChange={(e) => setFormData({...formData, po_number: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected Delivery</label>
                    <input
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="items-section">
                  <h3>Items</h3>
                  <div className="item-inputs">
                    <div className="form-group">
                      <label>Material</label>
                      <select
                        value={currentItem.material_id}
                        onChange={(e) => setCurrentItem({...currentItem, material_id: e.target.value})}
                      >
                        <option value="">Select Material</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Qty</label>
                      <input
                        type="number"
                        step="0.01"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label>Unit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={currentItem.unit_price}
                        onChange={(e) => setCurrentItem({...currentItem, unit_price: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <button type="button" className="btn btn-secondary" onClick={addItem}>
                      Add
                    </button>
                  </div>
                  {formData.items.length > 0 && (
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th className="text-primary">Material</th>
                          <th className="text-primary">Qty</th>
                          <th className="text-primary">Unit Price</th>
                          <th className="text-primary">Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => {
                          const material = materials.find(m => m.id == item.material_id);
                          return (
                            <tr key={idx}>
                              <td>{material?.name}</td>
                              <td>{item.quantity}</td>
                              <td>₹{item.unit_price.toFixed(2)}</td>
                              <td>₹{item.total.toFixed(2)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-small btn-delete"
                                  onClick={() => removeItem(idx)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="form-group">
                  <label>Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tax}
                    onChange={(e) => setFormData({...formData, tax: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="totals">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>₹{formData.items.reduce((sum, i) => sum + i.total, 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Tax:</span>
                    <span>₹{parseFloat(formData.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary bg-primary">
                    Create Purchase
                  </button>
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
export default Purchases;