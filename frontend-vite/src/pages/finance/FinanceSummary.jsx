// src/pages/FinanceSummary.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import "../../styles/Finance.css";
const FinanceSummary = () => {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const loadData = async () => {
      try {
        const summaryRes = await api.get("/api/finance/summary");
        setSummary(summaryRes.data?.data || summaryRes.data || null);
        const transRes = await api.get("/api/finance/transactions");
        const transactions = transRes.data?.data || transRes.data || [];
        const grouped = {};
        transactions.forEach(tx => {
          const month = tx.date.slice(0, 7); // YYYY-MM
          if (!grouped[month]) grouped[month] = { month, income: 0, expense: 0 };
          grouped[month][tx.type] = (grouped[month][tx.type] || 0) + tx.amount;
        });
        setChartData(Object.values(grouped));
      } catch (err) {
        setError(err.message || "Failed to load finance data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  return (
    <div className="main-content theme-blue-white">
      <div className="finance-header">
        <h2 style={{ color: '#0052CC' }}>💼 Finance Summary</h2>
        <div className="finance-actions">
          <button className="btn-blue-white" onClick={() => navigate("/finance/add")}>
            ➕ Add Transaction
          </button>
          <button className="btn-blue-white" onClick={() => navigate("/finance/transactions")}>
            📋 View All Transactions
          </button>
        </div>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading summary...</p>}
      {summary && (
        <div className="finance-summary-cards">
          <div className="summary-card income">💰 Total Income: ₹{summary.total_income}</div>
          <div className="summary-card expense">💸 Total Expense: ₹{summary.total_expense}</div>
          <div className="summary-card balance">🏦 Balance: ₹{summary.balance}</div>
        </div>
      )}
      <h3 style={{ color: '#0052CC' }}>📊 Monthly Cash Flow</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#28a745" />
          <Bar dataKey="expense" fill="#dc3545" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default FinanceSummary;
