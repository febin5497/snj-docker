// src/pages/TransactionList.jsx
import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../styles/Finance.css';
const TransactionList = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ type: '', project_id: '', start: '', end: '', search: '' });
  const [reportType, setReportType] = useState('default');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  useEffect(() => {
    fetchTransactions();
    api.get('/api/projects/').then(res => {
      // API returns { data: [...], success: true, message: "..." }
      const projectsData = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.projects)
        ? res.data.projects
        : Array.isArray(res.data)
        ? res.data
        : [];
      setProjects(projectsData);
    }).catch(() => setProjects([]));
  }, []);
  const fetchTransactions = () => {
    api.get('/api/finance/transactions')
      .then(res => {
        setTransactions(res.data);
        setFiltered(res.data);
      })
      .catch(() => toast.error("Failed to fetch transactions"));
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await api.delete(`/api/finance/transaction/${id}`);
      toast.success("Transaction deleted");
      fetchTransactions();
    } catch {
      toast.error("Failed to delete transaction");
    }
  };
  const handleFilter = () => {
    let temp = [...transactions];
    if (filters.type) temp = temp.filter(t => t.type === filters.type);
    if (filters.project_id) temp = temp.filter(t => t.project_id?.toString() === filters.project_id);
    if (filters.start) temp = temp.filter(t => t.date >= filters.start);
    if (filters.end) temp = temp.filter(t => t.date <= filters.end);
    if (filters.search) temp = temp.filter(t => (t.category + t.description).toLowerCase().includes(filters.search.toLowerCase()));
    setFiltered(temp);
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setFilters({ type: '', project_id: '', start: '', end: '', search: '' });
    setFiltered(transactions);
    setCurrentPage(1);
  };
  const handleDownload = () => {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.project_id) params.append("project_id", filters.project_id);
    if (filters.start) params.append("start", filters.start);
    if (filters.end) params.append("end", filters.end);
    if (reportType !== 'default') params.append("mode", reportType);
    api({
      url: `/finance/report/download?${params.toString()}`,
      method: 'GET',
      responseType: 'blob'
    }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Finance_Report_${reportType}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }).catch(() => toast.error("Download failed"));
  };
  const handlePDFExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text("Unizion Construction Pvt Ltd", 14, 20);
    doc.setFontSize(12);
    doc.text(`Finance Report - ${reportType.replace('_', ' ').toUpperCase()}`, 14, 28);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 34);
    const rows = currentItems.map(tx => [
      tx.date,
      tx.type.toUpperCase(),
      tx.category,
      `₹${tx.amount.toFixed(2)}`,
      tx.description,
      tx.project_id || "-"
    ]);
    autoTable(doc, {
      startY: 40,
      head: [["Date", "Type", "Category", "Amount", "Description", "Project"]],
      body: rows,
    });
    doc.save(`Finance_Report_${reportType}.pdf`);
  };
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };
  const bulkDelete = async () => {
    if (!window.confirm("Delete selected transactions?")) return;
    for (const id of selectedIds) {
      await api.delete(`/api/finance/transaction/${id}`);
    }
    toast.success("Selected transactions deleted");
    setSelectedIds([]);
    fetchTransactions();
  };
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  return (
    <div style={{background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)', minHeight: '100vh', padding: '24px'}}>
      <div className="max-w-7xl mx-auto">
      <div className="main-content">
      <div className="finance-header">
        <h2 style={{color: '#0052CC'}}>💰 Transactions</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={reportType} onChange={e => setReportType(e.target.value)}>
            <option value="default">Default Report</option>
            <option value="date_range">Date Range</option>
            <option value="project">Project-wise</option>
            <option value="type">Type-wise</option>
            <option value="category">Category-wise</option>
            <option value="monthly">Monthly Cash Flow</option>
            <option value="pl">Profit / Loss</option>
          </select>
          <button className="download-btn" onClick={handleDownload}><FaDownload /> Excel</button>
          <button className="download-btn" onClick={handlePDFExport}><FaDownload /> PDF</button>
          <button className="download-btn" onClick={bulkDelete}>🗑️ Bulk Delete</button>
        </div>
      </div>
      <div className="finance-form">
        <input type="text" placeholder="Search by category or description" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        <select name="type" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select name="project_id" value={filters.project_id} onChange={e => setFilters({ ...filters, project_id: e.target.value })}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="date" value={filters.start} onChange={e => setFilters({ ...filters, start: e.target.value })} />
        <input type="date" value={filters.end} onChange={e => setFilters({ ...filters, end: e.target.value })} />
        <button type="button" onClick={handleFilter} className="btn-spacing">Apply Filters</button>
        <button type="button" onClick={clearFilters}>Clear</button>
      </div>
      <div className="transaction-table-wrapper">
        <table className="transaction-table centered-table">
          <thead>
            <tr style={{backgroundColor: '#f0f5ff'}}>
              <th style={{color: '#0052CC'}}>Select</th>
              <th style={{color: '#0052CC'}}>Date</th>
              <th style={{color: '#0052CC'}}>Type</th>
              <th style={{color: '#0052CC'}}>Category</th>
              <th style={{color: '#0052CC'}}>Amount</th>
              <th style={{color: '#0052CC'}}>Description</th>
              <th style={{color: '#0052CC'}}>Project</th>
              <th style={{color: '#0052CC'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(tx => (
              <tr key={tx.id} style={{backgroundColor: 'white'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f5ff'} onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}>
                <td><input type="checkbox" checked={selectedIds.includes(tx.id)} onChange={() => toggleSelect(tx.id)} /></td>
                <td>{tx.date}</td>
                <td className={tx.type}>{tx.type.toUpperCase()}</td>
                <td>{tx.category}</td>
                <td>₹{parseFloat(tx.amount).toFixed(2)}</td>
                <td>{tx.description}</td>
                <td>
                  {tx.project_id ? (
                    <span
                      className="project-link"
                      onClick={() => navigate(`/projects/${tx.project_id}`)}
                      title="View Project Details"
                      style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {tx.project_id}
                    </span>
                  ) : '-'}
                </td>
                <td className="actions">
                  <button onClick={() => navigate(`/finance/edit/${tx.id}`)} className="edit-btn" title="Edit">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(tx.id)} className="delete-btn" title="Delete">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          {[...Array(totalPages).keys()].map(p => (
            <button
              key={p + 1}
              className={p + 1 === currentPage ? 'active' : ''}
              onClick={() => setCurrentPage(p + 1)}
            >
              {p + 1}
            </button>
          ))}
        </div>
      )}
      </div>
      </div>
    </div>
  );
};
export default TransactionList;