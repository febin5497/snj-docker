import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaFilePdf, FaChevronLeft, FaCheck, FaClock, FaTimesCircle } from 'react-icons/fa';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import '../../styles/Estimates.css';
export default function Estimates() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    projectName: '',
    description: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    taxRate: 18,
    notes: ''
  });
  useEffect(() => {
    loadEstimates();
  }, []);
  const loadEstimates = async () => {
    try {
      setLoading(true);
      // Mock data
      setEstimates([
        { id: 1, estimateNo: 'EST-2026-001', clientName: 'ABC Construction', projectName: 'Residential Building A', totalAmount: 1250000, status: 'Accepted', createdDate: '2026-03-15', validUntil: '2026-04-15', items: 3 },
        { id: 2, estimateNo: 'EST-2026-002', clientName: 'XYZ Development', projectName: 'Commercial Complex', totalAmount: 2850000, status: 'Pending', createdDate: '2026-03-20', validUntil: '2026-04-20', items: 5 },
        { id: 3, estimateNo: 'EST-2026-003', clientName: 'Tech Park Ltd', projectName: 'Office Tower', totalAmount: 5200000, status: 'Accepted', createdDate: '2026-03-18', validUntil: '2026-04-18', items: 8 },
        { id: 4, estimateNo: 'EST-2026-004', clientName: 'Retail Corp', projectName: 'Shopping Mall', totalAmount: 3400000, status: 'Rejected', createdDate: '2026-03-10', validUntil: '2026-04-10', items: 6 },
        { id: 5, estimateNo: 'EST-2026-005', clientName: 'Property Group', projectName: 'Residential Complex', totalAmount: 4100000, status: 'Pending', createdDate: '2026-03-22', validUntil: '2026-04-22', items: 7 },
      ]);
    } catch (err) {
      showError('Failed to load estimates');
    } finally {
      setLoading(false);
    }
  };
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };
  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };
  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };
  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * (formData.taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  };
  const handleCreateEstimate = () => {
    if (!formData.clientName || !formData.projectName || formData.items.length === 0) {
      showError('Please fill in all required fields');
      return;
    }
    const { total } = calculateTotal();
    const newEstimate = {
      id: estimates.length + 1,
      estimateNo: `EST-2026-${String(estimates.length + 1).padStart(3, '0')}`,
      clientName: formData.clientName,
      projectName: formData.projectName,
      totalAmount: total,
      status: 'Pending',
      createdDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: formData.items.length
    };
    setEstimates([newEstimate, ...estimates]);
    showSuccess('Estimate created successfully');
    setShowForm(false);
    setFormData({
      clientName: '',
      projectName: '',
      description: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      taxRate: 18,
      notes: ''
    });
  };
  const handleDeleteEstimate = (id) => {
    if (!window.confirm('Are you sure?')) return;
    setEstimates(estimates.filter(e => e.id !== id));
    showSuccess('Estimate deleted');
  };
  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'Accepted': return '#43e97b';
      case 'Pending': return '#ffa502';
      case 'Rejected': return '#f5576c';
      default: return '#64748b';
    }
  };
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Accepted': return <FaCheck />;
      case 'Pending': return <FaClock />;
      case 'Rejected': return <FaTimesCircle />;
      default: return null;
    }
  };
  const { subtotal, tax, total } = calculateTotal();
  return (
    <div className="theme-blue-white" style={{ minHeight: '100vh' }}>
    <div className="estimates-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="estimates-header">
        <div className="estimates-title-section">
          <button className="back-btn" onClick={() => navigate('/')}>
            <FaChevronLeft /> Back
          </button>
          <h1 className="header-blue-white">Estimates & Quotes</h1>
        </div>
        <button className="create-estimate-btn" onClick={() => setShowForm(!showForm)}>
          <FaPlus /> New Estimate
        </button>
      </div>
      {/* Summary Stats */}
      <div className="estimates-summary">
        <div className="summary-card">
          <p className="summary-label">Total Estimates</p>
          <p className="summary-value">{estimates.length}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">Accepted</p>
          <p className="summary-value" style={{ color: '#43e97b' }}>{estimates.filter(e => e.status === 'Accepted').length}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">Pending</p>
          <p className="summary-value" style={{ color: '#ffa502' }}>{estimates.filter(e => e.status === 'Pending').length}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">Total Value</p>
          <p className="summary-value">₹{(estimates.reduce((sum, e) => sum + e.totalAmount, 0) / 100000).toFixed(1)}L</p>
        </div>
      </div>
      {/* Create Form */}
      {showForm && (
        <div className="estimate-form-card">
          <h3>Create New Estimate</h3>
          <div className="form-section">
            <h4>Client Information</h4>
            <div className="form-row">
              <input
                type="text"
                placeholder="Client Name"
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              />
              <input
                type="text"
                placeholder="Project Name"
                value={formData.projectName}
                onChange={(e) => setFormData({...formData, projectName: e.target.value})}
              />
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
            ></textarea>
          </div>
          <div className="form-section">
            <div className="section-header">
              <h4>Estimate Items</h4>
              <button className="btn-add-item" onClick={addItem}>+ Add Item</button>
            </div>
            <div className="items-table">
              <div className="items-header">
                <div>Description</div>
                <div>Qty</div>
                <div>Unit Price</div>
                <div>Amount</div>
                <div></div>
              </div>
              {formData.items.map((item, i) => (
                <div key={i} className="item-row">
                  <input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value))}
                  />
                  <input
                    type="number"
                    placeholder="Unit Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value))}
                  />
                  <div className="amount">₹{(item.quantity * item.unitPrice).toLocaleString()}</div>
                  <button
                    className="btn-remove"
                    onClick={() => removeItem(i)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="form-section">
            <div className="calculations">
              <div className="calc-row">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="calc-row">
                <span>Tax ({formData.taxRate}%):</span>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({...formData, taxRate: parseFloat(e.target.value)})}
                  style={{ width: '60px' }}
                />
                <span>₹{tax.toLocaleString()}</span>
              </div>
              <div className="calc-row total">
                <span>Total:</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
            <textarea
              placeholder="Notes & Terms"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
            ></textarea>
          </div>
          <div className="form-actions">
            <button className="btn-submit" onClick={handleCreateEstimate}>Create Estimate</button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {/* Estimates List */}
      {loading ? (
        <div className="loading">Loading estimates...</div>
      ) : (
        <div className="estimates-table-container">
          <table className="estimates-table">
            <thead>
              <tr className="table-header-blue-white">
                <th>Estimate #</th>
                <th>Client</th>
                <th>Project</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Created</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map(est => (
                <tr key={est.id}>
                  <td className="estimate-no">{est.estimateNo}</td>
                  <td>{est.clientName}</td>
                  <td className="project-name">{est.projectName}</td>
                  <td className="items-count">{est.items}</td>
                  <td className="amount">₹{est.totalAmount.toLocaleString()}</td>
                  <td className="date">{new Date(est.createdDate).toLocaleDateString()}</td>
                  <td className="date">{new Date(est.validUntil).toLocaleDateString()}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{backgroundColor: getStatusBadgeColor(est.status)}}
                    >
                      {getStatusIcon(est.status)} {est.status}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button className="btn-pdf" title="View PDF">
                      <FaFilePdf />
                    </button>
                    <button className="btn-edit" title="Edit">
                      <FaEdit />
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteEstimate(est.id)}
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
    </div>
  );
}
