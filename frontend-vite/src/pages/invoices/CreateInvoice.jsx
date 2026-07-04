import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import '../../styles/CreateInvoice.css';
const CreateInvoice = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [projects, setProjects] = useState([]);
  const [customer, setCustomer] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, rate: 0 }]);
  const [includeGST, setIncludeGST] = useState(true);
  const [gstRate, setGstRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  // GST rates available in India
  const gstRates = [5, 12, 18, 28];
  useEffect(() => {
    setLoading(true);
    api.get('/api/projects/')
      .then(response => {
        // API returns { data: [...], success: true, message: "..." }
        const projectsData = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data?.projects)
          ? response.data.projects
          : Array.isArray(response.data)
          ? response.data
          : [];
        setProjects(projectsData);
      })
      .catch(error => {
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, []);
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = field === 'description' ? value : parseFloat(value);
    setItems(updatedItems);
  };
  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0 }]);
  };
  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };
  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  };
  const calculateGSTAmount = () => {
    if (!includeGST) return 0;
    const subtotal = calculateSubtotal();
    return (subtotal * gstRate) / 100;
  };
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const gstAmount = calculateGSTAmount();
    return subtotal + gstAmount - parseFloat(discount);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer || !email || !date || !projectId || items.length === 0) {
      showWarning("Please fill in all required fields.");
      return;
    }
    const invoiceData = {
      customer,
      email,
      date,
      project_id: projectId,
      subtotal: calculateSubtotal(),
      include_gst: includeGST,
      gst_rate: includeGST ? gstRate : 0,
      gst_amount: calculateGSTAmount(),
      discount: parseFloat(discount),
      total_amount: calculateTotal(),
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        total: item.quantity * item.rate
      }))
    };
    setLoading(true);
    api.post('/api/invoices/', invoiceData)
      .then(() => {
        showSuccess('Invoice created successfully!');
        navigate('/invoices');
      })
      .catch(error => {
        showError(error.response?.data?.message || 'Error creating invoice.');
      })
      .finally(() => setLoading(false));
  };
  const handlePrint = () => {
    window.print();
  };
  const handleEmail = () => {
    if (!email) {
      showWarning("Please enter an email address.");
      return;
    }
    const emailPayload = {
      to: email,
      subject: `Invoice for ${customer}`,
      body: `Attached is the invoice for project ID ${projectId} dated ${date}.`,
      invoice: {
        customer,
        date,
        project_id: projectId,
        subtotal: calculateSubtotal(),
        include_gst: includeGST,
        gst_rate: includeGST ? gstRate : 0,
        gst_amount: calculateGSTAmount(),
        discount: parseFloat(discount),
        total_amount: calculateTotal(),
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          total: item.quantity * item.rate
        }))
      }
    };
    api.post('/api/invoices/email', emailPayload)
      .then(() => showSuccess('Invoice email sent!'))
      .catch((error) => {
        showError('Failed to send invoice email.');
      });
  };
  return (
    <div className="invoice-container">
      <h2>Create New Invoice</h2>
      <form onSubmit={handleSubmit} className="invoice-form">
        <div className="form-row">
          <div className="form-group">
            <label>Customer:</label>
            <input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Date:</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Project:</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
              <option value="">Select Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Email (for invoice):</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              required
            />
          </div>
        </div>
        <h4>Invoice Items</h4>
        {items.map((item, index) => (
          <div key={index} className="item-row">
            <input type="text" placeholder="Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required />
            <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required />
            <input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} required />
            <span>₹{(item.quantity * item.rate).toFixed(2)}</span>
            <button type="button" onClick={() => handleRemoveItem(index)}>🗑️</button>
          </div>
        ))}
        <button type="button" onClick={handleAddItem}>+ Add Item</button>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={includeGST}
              onChange={(e) => setIncludeGST(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span style={{ cursor: 'pointer' }}>Include GST (Goods and Services Tax)</span>
          </label>
        </div>
        {includeGST && (
          <div className="form-group">
            <label>GST Rate (%):</label>
            <select value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))}>
              {gstRates.map(rate => (
                <option key={rate} value={rate}>{rate}%</option>
              ))}
            </select>
            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
              Common GST Rates: 5% (Essential goods), 12% (Processed foods), 18% (General), 28% (Luxury items)
            </small>
          </div>
        )}
        <div className="form-group">
          <label>Discount (₹):</label>
          <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </div>
        <div className="invoice-summary" style={{
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Subtotal:</span>
            <strong>₹{calculateSubtotal().toFixed(2)}</strong>
          </div>
          {includeGST && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>GST ({gstRate}%):</span>
                <strong>₹{calculateGSTAmount().toFixed(2)}</strong>
              </div>
            </>
          )}
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Discount:</span>
              <strong>-₹{parseFloat(discount).toFixed(2)}</strong>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid #ddd',
            fontSize: '16px'
          }}>
            <span>Grand Total:</span>
            <strong style={{ color: '#8b5cf6', fontSize: '18px' }}>₹{calculateTotal().toFixed(2)}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Invoice'}</button>
          <button type="button" onClick={() => setShowPreview(true)}>Preview</button>
          <button type="button" onClick={handlePrint}>Print</button>
          <button type="button" onClick={handleEmail}>Email</button>
        </div>
      </form>
      {showPreview && (
        <div className="modal" onClick={() => setShowPreview(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Invoice Preview</h3>
            <p><strong>Customer:</strong> {customer}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Date:</strong> {date}</p>
            <p><strong>Project:</strong> {projects.find(p => p.id === parseInt(projectId))?.name}</p>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.rate.toFixed(2)}</td>
                    <td>₹{(item.quantity * item.rate).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #ddd' }}>
                  <td colSpan="3"><strong>Subtotal</strong></td>
                  <td><strong>₹{calculateSubtotal().toFixed(2)}</strong></td>
                </tr>
                {includeGST && (
                  <tr>
                    <td colSpan="3"><strong>GST ({gstRate}%)</strong></td>
                    <td><strong>₹{calculateGSTAmount().toFixed(2)}</strong></td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr>
                    <td colSpan="3"><strong>Discount</strong></td>
                    <td><strong>-₹{parseFloat(discount).toFixed(2)}</strong></td>
                  </tr>
                )}
                <tr style={{ backgroundColor: '#f0e6ff', fontSize: '16px', fontWeight: 'bold' }}>
                  <td colSpan="3">Grand Total</td>
                  <td>₹{calculateTotal().toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <button className="close-btn" onClick={() => setShowPreview(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default CreateInvoice;
