import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../../styles/Finance.css';
const EditTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: '',
    type: '',
    category: '',
    amount: '',
    description: '',
    project_id: ''
  });
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    // Fetch all projects for dropdown
    api.get('/api/projects/')
      .then(res => {
        // API returns { data: [...], success: true, message: "..." }
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
    // Load current transaction
    api.get('/api/finance/transactions')
      .then(res => {
        const tx = res.data.find(t => t.id === parseInt(id));
        if (tx) {
          setForm({
            ...tx,
            project_id: tx.project_id || ''
          });
        } else {
          toast.error("❌ Transaction not found");
        }
      })
      .catch(err => {
        toast.error("❌ Could not load transaction");
      });
  }, [id]);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/finance/transaction/${id}`, form);
      toast.success("✅ Transaction updated");
      navigate('/finance/transactions');
    } catch (err) {
      toast.error("❌ Update failed");
    }
  };
  return (
    <div className="main-content theme-blue-white" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)', minHeight: '100vh', padding: '24px' }}>
      <h2 style={{ color: '#0052CC' }}>✏️ Edit Transaction</h2>
      <form onSubmit={handleSubmit} className="project-form improved-form card-blue-white" style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />
        <select name="type" value={form.type} onChange={handleChange} required>
          <option value="">Select Type</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          required
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
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <div className="form-actions">
          <button type="submit"><FaSave /> Save</button>
          <button type="button" className="cancel-btn" onClick={() => navigate('/finance/transactions')}><FaTimes /> Cancel</button>
        </div>
      </form>
    </div>
  );
};
export default EditTransaction;
