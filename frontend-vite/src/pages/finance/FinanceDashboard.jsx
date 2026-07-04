// src/pages/FinanceDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { FaPlus, FaList, FaFileDownload } from 'react-icons/fa';
import '../../styles/Finance.css';
const COLORS = ['#48bb78', '#f56565'];
const FinanceDashboard = () => {
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    api.get('/api/finance/summary')
      .then(res => setSummary(res.data?.data || res.data))
    api.get('/api/finance/transactions')
      .then(res => {
        const grouped = res.data.reduce((acc, tx) => {
          const month = new Date(tx.date).toLocaleString('default', { month: 'short', year: 'numeric' });
          if (!acc[month]) acc[month] = { income: 0, expense: 0 };
          if (tx.type === 'income') acc[month].income += tx.amount;
          else acc[month].expense += tx.amount;
          return acc;
        }, {});
        const chartData = Object.entries(grouped).map(([month, values]) => ({
          month,
          income: values.income,
          expense: values.expense
        })).sort((a, b) => new Date(`1 ${a.month}`) - new Date(`1 ${b.month}`));
        setMonthlyData(chartData);
      })
  }, []);
  const handleDownloadReport = () => {
    window.open(`${api.defaults.baseURL || ''}/api/finance/report/download`, '_blank');
  };
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value) || '₹ 0';
  };
  return (
    <div className="page-bg">
      <div className="max-w-7xl mx-auto">
      <div className="finance-dashboard">
      {/* Finance Hero Section */}
      <div className="finance-hero">
        <h2 className="text-primary">💰 Finance Dashboard</h2>
        <p className="finance-subtitle">Monitor income, expenses, and financial metrics</p>
      </div>
      {/* Summary Stat Cards */}
      <div className="finance-summary">
        <div className="card-income">
          <h3>Total Income</h3>
          <p className="text-green">{formatCurrency(summary.total_income)}</p>
        </div>
        <div className="card-expense">
          <h3>Total Expense</h3>
          <p className="text-red">{formatCurrency(summary.total_expense)}</p>
        </div>
        <div className="card-balance">
          <h3>Balance</h3>
          <p className="text-blue">{formatCurrency(summary.balance)}</p>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="finance-actions">
        <button onClick={() => navigate('/finance/add')} className="finance-btn green">
          <FaPlus />
          Add Transaction
        </button>
        <button onClick={() => navigate('/finance/transactions')} className="finance-btn blue">
          <FaList />
          View Transactions
        </button>
        <button onClick={handleDownloadReport} className="finance-btn orange">
          <FaFileDownload />
          Download Report
        </button>
      </div>
      {/* Charts Section */}
      <div className="chart-section">
        <div className="chart-container">
          <h4>📊 Monthly Income vs Expense</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="income" fill="#48bb78" name="Income" />
              <Bar dataKey="expense" fill="#f56565" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <h4>📈 Income vs Expense Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Income', value: summary.total_income },
                  { name: 'Expense', value: summary.total_expense },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {COLORS.map((color, index) => (
                  <Cell key={index} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};
export default FinanceDashboard;