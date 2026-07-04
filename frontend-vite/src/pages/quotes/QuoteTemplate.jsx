import React, { useState, useEffect } from 'react';
import quotesAPI from '../../api/quotes';
import '../../styles/QuoteTemplate.css';
function QuoteTemplate() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    template_name: '',
    description: '',
    is_default: false,
    notes: '',
    terms_and_conditions: '',
    tax_rate: '0',
    items: []
  });
  const [newItem, setNewItem] = useState({
    material_id: '',
    description: '',
    quantity_default: '1',
    unit_of_measure: 'Unit',
    unit_price: ''
  });
  const unitMeasures = ['Unit', 'Meter', 'Sq.Ft', 'Sq.M', 'Kg', 'Liter', 'Box'];
  useEffect(() => {
    fetchTemplates();
  }, []);
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await quotesAPI.getTemplates();
      setTemplates(response.data.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const addItem = (e) => {
    e.preventDefault();
    if (!newItem.description || !newItem.unit_price) {
      alert('Please fill in description and unit price');
      return;
    }
    const item = {
      ...newItem,
      quantity_default: parseFloat(newItem.quantity_default),
      unit_price: parseFloat(newItem.unit_price)
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));
    setNewItem({
      material_id: '',
      description: '',
      quantity_default: '1',
      unit_of_measure: 'Unit',
      unit_price: ''
    });
  };
  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        tax_rate: parseFloat(formData.tax_rate)
      };
      if (editingId) {
        await quotesAPI.updateTemplate(editingId, submitData);
      } else {
        await quotesAPI.createTemplate(submitData);
      }
      setShowForm(false);
      setFormData({
        template_name: '',
        description: '',
        is_default: false,
        notes: '',
        terms_and_conditions: '',
        tax_rate: '0',
        items: []
      });
      setEditingId(null);
      fetchTemplates();
    } catch (error) {
      alert('Error saving template: ' + (error.response?.data?.error || error.message));
    }
  };
  const handleEdit = (template) => {
    setFormData({
      template_name: template.templateName,
      description: template.description,
      is_default: template.isDefault,
      notes: template.notes || '',
      terms_and_conditions: template.termsAndConditions || '',
      tax_rate: template.taxRate,
      items: template.items?.map(item => ({
        material_id: item.materialId,
        description: item.description,
        quantity_default: item.quantityDefault,
        unit_of_measure: item.unitOfMeasure,
        unit_price: item.unitPrice
      })) || []
    });
    setEditingId(template.id);
    setShowForm(true);
  };
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await quotesAPI.deleteTemplate(id);
        fetchTemplates();
      } catch (error) {
      }
    }
  };
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      template_name: '',
      description: '',
      is_default: false,
      notes: '',
      terms_and_conditions: '',
      tax_rate: '0',
      items: []
    });
    setNewItem({
      material_id: '',
      description: '',
      quantity_default: '1',
      unit_of_measure: 'Unit',
      unit_price: ''
    });
  };
  return (
    <div className="template-container">
      <div className="template-header">
        <h1>Quote Templates</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Create Template
        </button>
      </div>
      {/* Template List */}
      {!showForm ? (
        <div className="template-list">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : templates.length === 0 ? (
            <div className="empty-state">No templates found</div>
          ) : (
            <div className="templates-grid">
              {templates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-card-header">
                    <h3>{template.templateName}</h3>
                    {template.isDefault && (
                      <span className="default-badge">Default</span>
                    )}
                  </div>
                  <div className="template-card-body">
                    {template.description && (
                      <p className="description">{template.description}</p>
                    )}
                    <div className="template-info">
                      <div className="info-row">
                        <strong>Items:</strong>
                        <span>{template.itemCount || template.items?.length || 0}</span>
                      </div>
                      <div className="info-row">
                        <strong>Tax Rate:</strong>
                        <span>{(template.taxRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    {template.notes && (
                      <div className="notes">
                        <strong>Notes:</strong>
                        <p>{template.notes}</p>
                      </div>
                    )}
                    {template.items && template.items.length > 0 && (
                      <div className="items-preview">
                        <strong>Items Preview:</strong>
                        <ul>
                          {template.items.slice(0, 3).map((item, idx) => (
                            <li key={idx}>
                              {item.description} - ${item.unitPrice.toFixed(2)}
                            </li>
                          ))}
                          {template.items.length > 3 && (
                            <li>... and {template.items.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="template-card-footer">
                    <button
                      className="btn-sm btn-edit"
                      onClick={() => handleEdit(template)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-sm btn-delete"
                      onClick={() => handleDelete(template.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Template Form */
        <div className="template-form-wrapper">
          <form onSubmit={handleSubmit} className="template-form">
            <div className="form-section">
              <h2>Template Information</h2>
              <div className="form-group">
                <label htmlFor="template_name">Template Name *</label>
                <input
                  type="text"
                  id="template_name"
                  name="template_name"
                  value={formData.template_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Standard Building Materials"
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Template description"
                  rows="2"
                  className="form-control"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tax_rate">Tax Rate (%)</label>
                  <input
                    type="number"
                    id="tax_rate"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                  />
                </div>
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="form-checkbox"
                  />
                  <label htmlFor="is_default">Set as Default Template</label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Default notes for quotes using this template"
                  rows="2"
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="terms_and_conditions">Terms & Conditions</label>
                <textarea
                  id="terms_and_conditions"
                  name="terms_and_conditions"
                  value={formData.terms_and_conditions}
                  onChange={handleChange}
                  placeholder="Default terms for quotes using this template"
                  rows="3"
                  className="form-control"
                />
              </div>
            </div>
            {/* Template Items */}
            <div className="form-section">
              <h2>Template Items</h2>
              <div className="add-item-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="item_description">Description *</label>
                    <input
                      type="text"
                      id="item_description"
                      name="description"
                      value={newItem.description}
                      onChange={handleItemChange}
                      placeholder="Item description"
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="item_quantity">Qty *</label>
                    <input
                      type="number"
                      id="item_quantity"
                      name="quantity_default"
                      value={newItem.quantity_default}
                      onChange={handleItemChange}
                      placeholder="1"
                      step="0.01"
                      min="0"
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="item_uom">Unit</label>
                    <select
                      id="item_uom"
                      name="unit_of_measure"
                      value={newItem.unit_of_measure}
                      onChange={handleItemChange}
                      className="form-control"
                    >
                      {unitMeasures.map(um => (
                        <option key={um} value={um}>{um}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="item_price">Unit Price *</label>
                    <input
                      type="number"
                      id="item_price"
                      name="unit_price"
                      value={newItem.unit_price}
                      onChange={handleItemChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn-add-item"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>
              {/* Items Table */}
              {formData.items.length > 0 && (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Default Qty</th>
                      <th>Unit</th>
                      <th>Unit Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.description}</td>
                        <td>{item.quantity_default}</td>
                        <td>{item.unit_of_measure}</td>
                        <td>${item.unit_price?.toFixed(2) || '0.00'}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="btn-remove"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingId ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
export default QuoteTemplate;
