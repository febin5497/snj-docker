// src/components/BarFinanceChart.jsx

import React, { useEffect, useState } from 'react';
import api from '../api/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const BarFinanceChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    api.get('/api/finance/transactions')
      .then(res => {
        const grouped = {};

        res.data.forEach(tx => {
          const month = new Date(tx.date).toLocaleString('default', { month: 'short', year: 'numeric' });
          if (!grouped[month]) grouped[month] = { month, income: 0, expense: 0 };
          grouped[month][tx.type] += tx.amount;
        });

        const finalData = Object.values(grouped).sort((a, b) => {
          const [am, ay] = a.month.split(' ');
          const [bm, by] = b.month.split(' ');
          return new Date(`${am} 1, ${ay}`) - new Date(`${bm} 1, ${by}`);
        });

        setChartData(finalData);
      })
      .catch(err => {
        console.error('❌ Failed to fetch transaction chart data', err);
      });
  }, []);

  return (
    <div style={{ width: '100%', height: 350 }}>
      <h4>📊 Monthly Income vs Expense</h4>
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(val) => `₹${val}`} />
          <Legend />
          <Bar dataKey="income" fill="#28a745" name="Income" />
          <Bar dataKey="expense" fill="#dc3545" name="Expense" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarFinanceChart;
