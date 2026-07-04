import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSave, FaTimes } from 'react-icons/fa';
import '../../styles/Finance.css';
const AddTransaction = () => {
  const [form, setForm] = useState({
    date: '',
    type: 'income',
    category: '',
    account_code: '',
    amount: '',
    description: '',
    project_id: ''
  });
  const [projects, setProjects] = useState([]);
  const [coaAccounts, setCoaAccounts] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    api.get('/api/projects/')
      .then(res => {
        const projectsData = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.projects)
          ? res.data.projects
          : Array.isArray(res.data)
          ? res.data
          : [];
        setProjects(projectsData);
      })
      .catch(() => {
        toast.error("❌ Failed to load projects");
        setProjects([]);
      });
  }, []);
  useEffect(() => {
    const accountType = form.type === 'income' ? 'revenue' : 'expense';
    api.get(`/api/finance/coa/by-type/${accountType}`)
      .then(res => {
        const accounts = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setCoaAccounts(accounts);
      })
      .catch(() => setCoaAccounts([]));
  }, [form.type]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    if (name === 'account_code') {
      const selected = coaAccounts.find(a => a.account_code === value);
      if (selected) {
        updated.category = selected.category || '';
      }
    }
    setForm(updated);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.account_code) delete payload.account_code;
    api.post('/api/finance/transaction', payload)
      .then(() => {
        toast.success("✅ Transaction added");
        navigate('/finance/transactions');
      })
      .catch(() => toast.error("❌ Failed to add transaction"));
  };
  return (
    <div className="main-content theme-blue-white" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)', minHeight: '100vh', padding: '24px' }}>
      <h2 style={{ color: '#0052CC' }}>➕ Add Transaction</h2>
      <form className="project-form improved-form card-blue-white" onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select name="account_code" value={form.account_code} onChange={handleChange}>
          <option value="">Select Chart of Accounts (optional)</option>
          {coaAccounts.map(a => (
            <option key={a.account_code} value={a.account_code}>
              [{a.account_code}] {a.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="category"
          placeholder="Category (auto-filled from CoA)"
          value={form.category}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          step="0.01"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <select
          name="project_id"
          value={form.project_id}
          onChange={handleChange}
        >
          <option value="">Select Project (optional)</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="form-actions">
          <button type="submit">
            <FaSave /> Save
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/finance/transactions')}
          >
            <FaTimes /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
export default AddTransaction;
