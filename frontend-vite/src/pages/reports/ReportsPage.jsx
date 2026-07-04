import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, LineChart, PieChart, Download } from 'lucide-react';
const ReportsPage = () => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(null);
  const reports = [
    {
      id: 'profitability',
      name: 'Project Profitability',
      description: 'Revenue vs Expenses analysis by project',
      icon: BarChart,
      route: '/reports/profitability'
    },
    {
      id: 'budget-variance',
      name: 'Budget vs Actual',
      description: 'Compare budgeted amounts with actual spending',
      icon: LineChart,
      route: '/reports/budget-variance'
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow',
      description: 'Track cash inflows and outflows over time',
      icon: LineChart,
      route: '/reports/cash-flow'
    },
    {
      id: 'receivables-aging',
      name: 'Receivables Aging',
      description: 'Monitor outstanding customer payments',
      icon: PieChart,
      route: '/reports/receivables-aging'
    }
  ];
  const handleViewReport = (route) => {
    navigate(route);
  };
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen page-bg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Financial Reports</h1>
        <p className="text-muted mt-2">Generate and view comprehensive financial reports</p>
      </div>
      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map(report => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white rounded-lg border p-6 transition-shadow cursor-pointer border-default"
              onClick={() => handleViewReport(report.route)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary-gradient">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{report.name}</h3>
                  </div>
                </div>
              </div>
              <p className="text-muted mb-4">{report.description}</p>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition bg-primary">
                <Download size={16} />
                View Report
              </button>
            </div>
          );
        })}
      </div>
      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-primary">Report Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-6 border-default">
            <p className="text-sm mb-1 text-muted">Total Reports</p>
            <p className="text-3xl font-bold text-primary">4</p>
          </div>
          <div className="bg-white rounded-lg border p-6 border-default">
            <p className="text-sm mb-1 text-muted">Generated Today</p>
            <p className="text-3xl font-bold text-primary">0</p>
          </div>
          <div className="bg-white rounded-lg border p-6 border-default">
            <p className="text-sm mb-1 text-muted">This Month</p>
            <p className="text-3xl font-bold text-primary">0</p>
          </div>
          <div className="bg-white rounded-lg border p-6 border-default">
            <p className="text-sm mb-1 text-muted">Last Updated</p>
            <p className="text-lg font-semibold text-primary">-</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsPage;
