import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import '../../styles/Suppliers.css';
const Suppliers = () => {
  const { showSuccess, showError } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    bank_account: '',
    contact_person: '',
    contact_phone: '',
    notes: '',
    is_active: true
  });
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/suppliers/', {
        params: { page, per_page: 10, search: search || undefined }
      });
      const raw = res.data?.data; setSuppliers(Array.isArray(raw) ? raw : (raw?.items || []));
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      showError('Failed to load suppliers');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setPage(1);
    loadSuppliers();
  }, []);
  useEffect(() => {
    loadSuppliers();
  }, [page, search]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (editingId) {
        await api.put(`/api/suppliers/${editingId}`, submitData);
        showSuccess('Supplier updated successfully');
      } else {
        await api.post('/api/suppliers/', submitData);
        showSuccess('Supplier created successfully');
      }
      resetForm();
      loadSuppliers();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save supplier');
    }
  };
  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setFormData(supplier);
    setShowForm(true);
  };
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/api/suppliers/${id}`);
        showSuccess('Supplier deleted');
        loadSuppliers();
      } catch (err) {
        showError(err.response?.data?.error || 'Failed to delete supplier');
      }
    }
  };
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      tax_id: '',
      bank_account: '',
      contact_person: '',
      contact_phone: '',
      notes: '',
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
  };
  return (
    <div className="suppliers-page theme-blue-white">
      <div className="suppliers-container">
        <div className="suppliers-header">
          <h1 className="text-primary">Suppliers</h1>
          <button className="btn-blue-white" onClick={() => setShowForm(true)}>
            + Add Supplier
          </button>
        </div>
        <div className="suppliers-search">
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="search-input"
          />
        </div>
        {loading ? (
          <div className="loading">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="empty-state">No suppliers found</div>
        ) : (
          <div className="suppliers-table">
            <table>
              <thead>
                <tr className="table-header-blue-white">
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Contact Person</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="table-row-blue-white">
                    <td>{supplier.name}</td>
                    <td>{supplier.email || '-'}</td>
                    <td>{supplier.phone || '-'}</td>
                    <td>{supplier.contact_person || '-'}</td>
                    <td>
                      <span className={`status ${supplier.is_active ? 'active' : 'inactive'}`}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="btn-small btn-edit btn-secondary"
                        onClick={() => handleEdit(supplier)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-small btn-delete"
                        onClick={() => handleDelete(supplier.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="btn-small"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="btn-small"
            >
              Next
            </button>
          </div>
        )}
        {showForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                <button className="close-btn" onClick={resetForm}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="supplier-form">
                <div className="form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="2"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tax ID</label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bank Account</label>
                    <input
                      type="text"
                      value={formData.bank_account}
                      onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input
                      type="text"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    />
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
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    />
                    Active
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update' : 'Create'} Supplier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Suppliers;