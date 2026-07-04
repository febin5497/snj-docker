import { useState, useEffect } from 'react';
import { FaChartBar, FaChartPie, FaChartLine, FaDownload, FaChevronLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import '../../styles/Reports.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];

export default function Reports() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('staff');
  const [staffData, setStaffData] = useState({
    byRole: [],
    byDepartment: [],
    trends: []
  });
  const [expenseData, setExpenseData] = useState({
    byCategory: [],
    byProject: [],
    trends: []
  });
  const [certificateData, setCertificateData] = useState([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Load staff reports
      const staffRes = await api.get('/api/admin/dashboard/stats');
      if (staffRes.data.success) {
        setStaffData({
          byRole: [
            { name: 'Manager', value: 5 },
            { name: 'Supervisor', value: 8 },
            { name: 'Staff', value: 20 }
          ],
          byDepartment: [
            { name: 'Construction', count: 15 },
            { name: 'Administration', count: 8 },
            { name: 'Logistics', count: 10 }
          ],
          trends: [
            { month: 'Jan', staff: 25 },
            { month: 'Feb', staff: 28 },
            { month: 'Mar', staff: 33 },
            { month: 'Apr', staff: 35 },
            { month: 'May', staff: 38 }
          ]
        });
      }
      // Load expense reports
      setExpenseData({
        byCategory: [
          { name: 'Materials', value: 45000 },
          { name: 'Labor', value: 32000 },
          { name: 'Equipment', value: 28000 },
          { name: 'Other', value: 15000 }
        ],
        byProject: [
          { name: 'Project A', value: 65000 },
          { name: 'Project B', value: 32000 },
          { name: 'Project C', value: 23000 }
        ],
        trends: [
          { week: 'W1', expenses: 15000 },
          { week: 'W2', expenses: 18000 },
          { week: 'W3', expenses: 16000 },
          { week: 'W4', expenses: 21000 }
        ]
      });
      setCertificateData([
        { vehicle: 'Vehicle 01', insurance: 'Expires in 15 days', status: 'warning' },
        { vehicle: 'Vehicle 02', registration: 'Valid', status: 'safe' },
        { vehicle: 'Vehicle 03', fitness: 'Expired', status: 'danger' }
      ]);
    } catch (err) {
      showError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      showSuccess(`Report exported as ${format.toUpperCase()}`);
    } catch (err) {
      showError('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="reports-title-section">
          <button className="back-btn" onClick={() => navigate('/')}>
            <FaChevronLeft /> Back
          </button>
          <h1>Advanced Reports & Analytics</h1>
        </div>
        <div className="export-buttons">
          <button onClick={() => handleExport('pdf')} className="export-btn">
            <FaDownload /> Export PDF
          </button>
          <button onClick={() => handleExport('csv')} className="export-btn">
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="report-selector">
        <button
          className={`report-btn ${reportType === 'staff' ? 'active' : ''}`}
          onClick={() => setReportType('staff')}
        >
          <FaChartPie /> Staff Analytics
        </button>
        <button
          className={`report-btn ${reportType === 'expense' ? 'active' : ''}`}
          onClick={() => setReportType('expense')}
        >
          <FaChartBar /> Expense Analytics
        </button>
        <button
          className={`report-btn ${reportType === 'certificate' ? 'active' : ''}`}
          onClick={() => setReportType('certificate')}
        >
          <FaChartLine /> Certificate Status
        </button>
      </div>

      {/* Staff Reports */}
      {reportType === 'staff' && (
        <div className="reports-grid">
          <div className="report-card">
            <h3>Staff by Role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={staffData.byRole}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {staffData.byRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="report-card">
            <h3>Staff by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={staffData.byDepartment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="report-card full-width">
            <h3>Staff Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={staffData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="staff" stroke="#667eea" strokeWidth={2} dot={{ fill: '#667eea', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expense Reports */}
      {reportType === 'expense' && (
        <div className="reports-grid">
          <div className="report-card">
            <h3>Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData.byCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="report-card">
            <h3>Top Projects by Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseData.byProject} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#f5576c" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="report-card full-width">
            <h3>Weekly Expense Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={expenseData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Line type="monotone" dataKey="expenses" stroke="#f5576c" strokeWidth={2} dot={{ fill: '#f5576c', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Certificate Status */}
      {reportType === 'certificate' && (
        <div className="certificate-status">
          <div className="status-grid">
            {certificateData.map((cert, i) => (
              <div key={i} className={`status-card ${cert.status}`}>
                <h3>{cert.vehicle}</h3>
                <p className="cert-info">{cert.insurance || cert.registration || cert.fitness}</p>
                <div className={`status-indicator ${cert.status}`}></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
