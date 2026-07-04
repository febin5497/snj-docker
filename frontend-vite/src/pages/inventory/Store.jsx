import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaChevronLeft, FaBoxes, FaWarehouse, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import '../../styles/Store.css';
export default function Store() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: 'Unit',
    minStock: 10,
    maxStock: 100,
    unitPrice: 0,
    supplier: ''
  });
  useEffect(() => {
    loadItems();
  }, []);
  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/materials');
      const raw = res.data?.data; const materialsData = Array.isArray(raw) ? raw : (raw?.items || []);
      // Transform materials data to store items format
      const storeItems = materialsData.map(material => ({
        id: material.id,
        name: material.name,
        category: material.category || 'Materials',
        quantity: material.quantity || 0,
        unit: material.unit || 'Unit',
        minStock: material.min_stock || 10,
        maxStock: material.max_stock || 100,
        unitPrice: material.unit_price || 0,
        supplier: material.supplier || 'Not specified',
        status: (material.quantity || 0) <= (material.min_stock || 10) ? 'Critical' :
                (material.quantity || 0) <= (material.min_stock || 10) * 1.5 ? 'Low Stock' : 'In Stock'
      }));
      setItems(storeItems);
    } catch (err) {
      showError('Failed to load store items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  const handleAddItem = async () => {
    if (!formData.name || !formData.category) {
      showError('Please fill in all fields');
      return;
    }
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        min_stock: formData.minStock,
        max_stock: formData.maxStock,
        unit_price: formData.unitPrice,
        supplier: formData.supplier
      };
      const res = await api.post('/api/materials', payload);
      showSuccess('Item added successfully');
      setShowForm(false);
      setFormData({ name: '', category: '', quantity: 0, unit: 'Unit', minStock: 10, maxStock: 100, unitPrice: 0, supplier: '' });
      await loadItems();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add item');
    }
  };
  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/api/materials/${id}`);
      showSuccess('Item deleted');
      await loadItems();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete item');
    }
  };
  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'In Stock': return '#43e97b';
      case 'Low Stock': return '#ffa502';
      case 'Critical': return '#f5576c';
      default: return '#64748b';
    }
  };
  const totalStockValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const lowStockItems = items.filter(item => item.status !== 'In Stock').length;
  return (
    <div className="store-container theme-blue-white" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)', minHeight: '100vh' }}>
      <div className="store-header">
        <div className="store-title-section">
          <button className="back-btn" onClick={() => navigate('/')}>
            <FaChevronLeft /> Back
          </button>
          <div>
            <h1 style={{ color: '#0052CC' }}><FaWarehouse /> Store Management</h1>
            <p className="store-subtitle">Manage inventory and stock levels</p>
          </div>
        </div>
        <button className="add-item-btn btn-blue-white" onClick={() => setShowForm(!showForm)} style={{ background: '#0052CC', color: 'white' }}>
          <FaPlus /> New Item
        </button>
      </div>
      {/* Stats Cards */}
      <div className="store-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <FaBoxes />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Items</p>
            <p className="stat-value">{items.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <FaWarehouse />
          </div>
          <div className="stat-content">
            <p className="stat-label">Stock Value</p>
            <p className="stat-value">₹{(totalStockValue / 100000).toFixed(1)}L</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ffa502 0%, #ffb633 100%)' }}>
            <FaExclamationTriangle />
          </div>
          <div className="stat-content">
            <p className="stat-label">Low/Critical</p>
            <p className="stat-value">{lowStockItems}</p>
          </div>
        </div>
      </div>
      {/* Add Item Form */}
      {showForm && (
        <div className="store-form-card">
          <h3>Add New Item</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Item Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="">Select Category</option>
              <option value="Materials">Materials</option>
              <option value="Tools">Tools</option>
              <option value="Finishing">Finishing</option>
              <option value="Safety">Safety Equipment</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
            />
            <select
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            >
              <option>Unit</option>
              <option>Bags</option>
              <option>Tons</option>
              <option>Boxes</option>
              <option>Cans</option>
              <option>Meters</option>
              <option>Cubic Meters</option>
            </select>
            <input
              type="number"
              placeholder="Min Stock"
              value={formData.minStock}
              onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value)})}
            />
            <input
              type="number"
              placeholder="Max Stock"
              value={formData.maxStock}
              onChange={(e) => setFormData({...formData, maxStock: parseInt(e.target.value)})}
            />
            <input
              type="number"
              placeholder="Unit Price"
              value={formData.unitPrice}
              onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value)})}
            />
            <input
              type="text"
              placeholder="Supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button className="btn-submit" onClick={handleAddItem}>Add Item</button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {/* Items Table */}
      {loading ? (
        <div className="loading">Loading store items...</div>
      ) : (
        <div className="store-table-container">
          <table className="store-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Qty</th>
                <th>Min/Max</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="item-name">{item.name}</td>
                  <td>{item.category}</td>
                  <td className="quantity">{item.quantity} {item.unit}</td>
                  <td className="min-max">{item.minStock}/{item.maxStock}</td>
                  <td>₹{item.unitPrice.toLocaleString()}</td>
                  <td className="stock-value">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                  <td className="supplier">{item.supplier}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{backgroundColor: getStatusBadgeColor(item.status)}}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button className="btn-edit" title="Edit">Edit</button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
