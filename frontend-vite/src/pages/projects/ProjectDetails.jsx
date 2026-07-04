import React, { useEffect, useState, Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import { FiUpload, FiMapPin, FiCalendar, FiDollarSign, FiFileText } from 'react-icons/fi';
import { FaTrashAlt, FaArrowLeft } from 'react-icons/fa';
import { MdCheckCircle, MdAccessTime, MdPending } from 'react-icons/md';
import '../../styles/ProjectDetails.css';
const API_URL = import.meta.env.VITE_API_URL || '';
const documentTypes = ['Agreement', 'PLAN', '3D Plan', 'Panchayat Certificate'];
const fmt = (n) => n != null ? 'Rs.' + Number(n).toLocaleString('en-IN') : '-';
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#fff3f3', border: '1px solid red', margin: 20, borderRadius: 8 }}>
          <strong>Render Error:</strong><br />
          {this.state.error.message}<br />
          <pre style={{ fontSize: 11, overflow: 'auto' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [txForm, setTxForm] = useState({ type: 'income', category: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });
  const [txError, setTxError] = useState('');
  const loadTransactions = () => {
    api.get('/api/transactions?project_id=' + id)
      .then(res => {
        // API returns { data: [...], success: true, message: "..." }
        const txs = Array.isArray(res.data?.data)
          ? res.data.data
          : res.data?.transactions || Array.isArray(res.data)
          ? res.data
          : [];
        setTransactions(Array.isArray(txs) ? txs : []);
      })
      .catch(err => {
        setTransactions([]);
      });
  };
  useEffect(() => {
    api.get('/api/projects/' + id)
      .then(res => {
        // API returns { data: {...}, success: true, message: "..." }
        const projectData = res.data?.data || res.data;
        setProject(projectData);
      })
      .catch(() => setError('Failed to load project'));
    loadTransactions();
  }, [id]);
  const handleFileUpload = async (docType, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    try {
      await api.post('/api/projects/' + id + '/upload', formData);
      const res = await api.get('/api/projects/' + id);
      setProject(res.data);
    } catch (err) {
      setUploadError('Upload failed for ' + docType + ': ' + (err.response?.data?.error || err.message));
    }
  };
  const handleDeleteFile = async (docType) => {
    if (!window.confirm('Delete ' + docType + '?')) return;
    try {
      await api.post('/api/projects/' + id + '/delete-file', { doc_type: docType });
      const res = await api.get('/api/projects/' + id);
      setProject(res.data);
    } catch (err) {
      showError('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };
  const getDocFilename = (docType) => {
    const key = docType.toLowerCase().replace(/ /g, '_').replace('3d_', 'three_d_');
    return project?.[key];
  };
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setTxError('');
    if (!txForm.category || !txForm.amount || !txForm.date) {
      return setTxError('Category, amount and date are required.');
    }
    try {
      await api.post('/api/transaction', {
        project_id: parseInt(id),
        type: txForm.type,
        category: txForm.category,
        amount: parseFloat(txForm.amount),
        date: txForm.date,
        description: txForm.description,
      });
      setTxForm({ type: 'income', category: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });
      loadTransactions();
      showError('Transaction added successfully');
    } catch (err) {
      setTxError(err.response?.data?.error || 'Failed to add transaction');
    }
  };
  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete('/api/transaction/' + txId);
      setTransactions(prev => prev.filter(t => t.id !== txId));
    } catch (err) {
      showError('Failed to delete transaction');
    }
  };
  if (!project) return <div className="project-details"><p>Loading project...</p></div>;
  const contractValue = project.rate_per_sqft && project.square_feet
    ? project.rate_per_sqft * project.square_feet : null;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const outstanding = contractValue != null ? contractValue - totalIncome : null;
  return (
    <div className="project-details main-content">
      {/* Header Section */}
      <div className="project-header">
        <button onClick={() => navigate('/projects')} className="back-btn-header" title="Back">
          <FaArrowLeft /> Back
        </button>
        <div className="header-content">
          <h1 className="project-title">{project.name}</h1>
          <div className="header-meta">
            <span className={`status-badge status-${project.status?.toLowerCase()}`}>
              {project.status}
            </span>
            <span className="client-info">{project.client || 'N/A'}</span>
          </div>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {uploadError && <div className="alert alert-error">{uploadError}</div>}
      {/* Quick Info Cards */}
      <div className="project-info-grid">
        <div className="info-card">
          <FiMapPin className="info-icon" />
          <div className="info-content">
            <div className="info-label">Location</div>
            <div className="info-value">{project.location}</div>
          </div>
        </div>
        <div className="info-card">
          <FiCalendar className="info-icon" />
          <div className="info-content">
            <div className="info-label">Start Date</div>
            <div className="info-value">{project.start_date}</div>
          </div>
        </div>
        <div className="info-card">
          <FiFileText className="info-icon" />
          <div className="info-content">
            <div className="info-label">Square Feet</div>
            <div className="info-value">{project.square_feet ? project.square_feet.toLocaleString() + ' sqft' : '-'}</div>
          </div>
        </div>
        <div className="info-card">
          <FiDollarSign className="info-icon" />
          <div className="info-content">
            <div className="info-label">Rate/Sqft</div>
            <div className="info-value">{fmt(project.rate_per_sqft)}</div>
          </div>
        </div>
      </div>
      {/* Contract Value Highlight */}
      <div className="contract-value-section">
        <div className="contract-label">Total Contract Value</div>
        <div className="contract-amount">{fmt(contractValue)}</div>
      </div>
      <div className="section-divider"></div>
      <div className="section-header">
        <h3>Financial Overview</h3>
      </div>
      <div className="cost-metrics-grid">
        <div className="metric-card income">
          <div className="metric-icon">💰</div>
          <div className="metric-label">Total Received</div>
          <div className="metric-amount">{fmt(totalIncome)}</div>
          <div className="metric-bar">
            <div className="metric-bar-fill income-fill" style={{width: totalIncome > 0 ? '100%' : '0'}}></div>
          </div>
        </div>
        <div className="metric-card expense">
          <div className="metric-icon">💸</div>
          <div className="metric-label">Total Expenses</div>
          <div className="metric-amount">{fmt(totalExpense)}</div>
          <div className="metric-bar">
            <div className="metric-bar-fill expense-fill" style={{width: Math.min(totalExpense / (totalIncome || 1) * 100, 100) + '%'}}></div>
          </div>
        </div>
        <div className="metric-card balance">
          <div className="metric-icon">⚖️</div>
          <div className="metric-label">Balance</div>
          <div className="metric-amount" style={{color: balance >= 0 ? '#22c55e' : '#ef4444'}}>
            {fmt(balance)}
          </div>
          <div className="metric-subtext">{balance >= 0 ? '✓ Positive' : '⚠ Negative'}</div>
        </div>
        {outstanding != null && (
          <div className="metric-card outstanding">
            <div className="metric-icon">📊</div>
            <div className="metric-label">Outstanding</div>
            <div className="metric-amount">{fmt(outstanding)}</div>
            <div className="metric-subtext">{((outstanding / contractValue) * 100).toFixed(1)}% remaining</div>
          </div>
        )}
      </div>
      <div className="section-divider"></div>
      <div className="section-header">
        <h3>📝 Add Transaction</h3>
      </div>
      <div className="transaction-form-card">
        {txError && <div className="form-error">{txError}</div>}
        <form onSubmit={handleAddTransaction} className="transaction-form">
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })}
                className="form-input form-select">
                <option value="income">💰 Income</option>
                <option value="expense">💸 Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <input placeholder="e.g. Labour, Material" value={txForm.category}
                onChange={e => setTxForm({ ...txForm, category: e.target.value })}
                className="form-input" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount</label>
              <input type="number" placeholder="0.00" value={txForm.amount}
                onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                className="form-input" />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={txForm.date}
                onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                className="form-input" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Notes (Optional)</label>
              <input placeholder="Add any notes about this transaction..." value={txForm.description}
                onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                className="form-input" />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            ➕ Add Transaction
          </button>
        </form>
      </div>
      {transactions.length > 0 && (
        <div className="transactions-section">
          <h4 className="section-subtitle">Transaction History</h4>
          <table className="transactions-table">
            <thead>
              <tr>
                <th>📅 Date</th>
                <th>📌 Type</th>
                <th>🏷️ Category</th>
                <th>💵 Amount</th>
                <th>📝 Note</th>
                <th>⚙️ Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className={`tx-row tx-${tx.type}`}>
                  <td className="cell-date">{tx.date}</td>
                  <td className="cell-type">
                    <span className={`type-badge type-${tx.type}`}>
                      {tx.type === 'income' ? '💰' : '💸'} {tx.type}
                    </span>
                  </td>
                  <td className="cell-category">{tx.category}</td>
                  <td className={`cell-amount ${tx.type === 'income' ? 'income' : 'expense'}`}>{fmt(tx.amount)}</td>
                  <td className="cell-note">{tx.description || '-'}</td>
                  <td className="cell-action">
                    <button onClick={() => handleDeleteTransaction(tx.id)} className="btn-delete" title="Delete transaction">
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="section-divider"></div>
      <div className="section-header">
        <h3>📁 Documents</h3>
      </div>
      <div className="documents-grid">
        {documentTypes.map((docType) => {
          const filename = getDocFilename(docType);
          const icons = {
            'Agreement': '📄',
            'PLAN': '📐',
            '3D Plan': '🎨',
            'Panchayat Certificate': '✅'
          };
          return (
            <div key={docType} className={`doc-card ${filename ? 'has-file' : 'empty'}`}>
              <div className="doc-header">
                <span className="doc-icon">{icons[docType] || '📄'}</span>
                <span className="doc-name">{docType}</span>
              </div>
              <div className="doc-actions">
                <label htmlFor={'upload-' + docType} className="btn-upload" title="Upload file">
                  <FiUpload size={16} />
                  <input
                    id={'upload-' + docType}
                    type="file"
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.glb,.gltf,.obj,.stl,.fbx,.3ds"
                    onChange={(e) => handleFileUpload(docType, e.target.files[0])}
                  />
                </label>
                {filename ? (
                  <>
                    <a href={API_URL + '/uploads/projects/' + id + '/' + filename}
                       target="_blank" rel="noreferrer" className="btn-view">
                      View
                    </a>
                    {docType === '3D Plan' && (
                      <button onClick={() => navigate('/plan-viewer?projectId=' + id)} className="btn-view" title="Open in 3D Viewer" style={{ background: 'linear-gradient(135deg, #4a90d9, #357abd)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        3D
                      </button>
                    )}
                    <button onClick={() => handleDeleteFile(docType)} className="btn-delete" title="Delete file">
                      <FaTrashAlt />
                    </button>
                  </>
                ) : (
                  <span className="doc-status">No file</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Project Phase Tracker */}
      <h3>Project Roadmap</h3>
      <div className="phase-tracker-section">
        <div className="phases-container">
          {[
            { phase: 'Planning & Design', estimated: '2025-01-01', actual: '2025-01-15', progress: 100, status: 'Completed' },
            { phase: 'Foundation Work', estimated: '2025-02-01', actual: '2025-02-10', progress: 100, status: 'Completed' },
            { phase: 'Structural Work', estimated: '2025-03-01', actual: '2025-03-05', progress: 65, status: 'In Progress' },
            { phase: 'Interior Work', estimated: '2025-05-01', actual: null, progress: 0, status: 'Not Started' },
            { phase: 'Final Inspection', estimated: '2025-06-01', actual: null, progress: 0, status: 'Not Started' },
          ].map((item, idx) => (
            <div key={idx} className="phase-item">
              <div className="phase-header">
                <h4 className="phase-name">{item.phase}</h4>
                <span className={`phase-badge phase-${item.status.toLowerCase().replace(' ', '-')}`}>
                  {item.status}
                </span>
              </div>
              <div className="phase-dates">
                <div className="date-group">
                  <span className="date-label">Est. Date:</span>
                  <span className="date-value">{item.estimated}</span>
                </div>
                {item.actual && (
                  <div className="date-group">
                    <span className="date-label">Actual:</span>
                    <span className="date-value">{item.actual}</span>
                  </div>
                )}
              </div>
              <div className="progress-container">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{item.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default function ProjectDetailsPage(props) {
  return (
    <ErrorBoundary>
      <ProjectDetails {...props} />
    </ErrorBoundary>
  );
}
