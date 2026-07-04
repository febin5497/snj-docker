import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { FaMoneyBillWave, FaDollarSign, FaChartBar, FaFileInvoiceDollar, FaDownload, FaEdit, FaTrash, FaPrint } from "react-icons/fa"
import "../../styles/Finance.css"
export default function Finance() {
    const { showInfo } = useToast()
    const [transactions, setTransactions] = useState([])
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 })
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [activeTab, setActiveTab] = useState('transactions') // transactions, balance-sheet, profit-loss
    useEffect(() => {
        loadTransactions()
        loadSummary()
    }, [])
    const loadTransactions = async () => {
        try {
            const res = await api.get(`/api/finance/transactions`)
            const raw = res.data?.data; const allTransactions = Array.isArray(raw) ? raw : (raw?.items || [])
            setTransactions(allTransactions)
        } catch (err) {
            setTransactions([])
        }
    }
    const loadSummary = async () => {
        try {
            const res = await api.get(`/api/finance/summary`)
            const data = res.data?.data || res.data || {}
            setSummary({
                income: data.total_income || 0,
                expense: data.total_expense || 0,
                balance: data.balance || 0
            })
        } catch (err) {
            setSummary({ income: 0, expense: 0, balance: 0 })
        }
    }
    const formatCurrency = (value) => {
        return '₹' + Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })
    }
    // Calculate Balance Sheet
    const calculateBalanceSheet = () => {
        return {
            assets: summary.balance > 0 ? summary.balance : 0,
            liabilities: summary.balance < 0 ? Math.abs(summary.balance) : 0,
            equity: summary.balance > 0 ? summary.balance : 0
        }
    }
    // Calculate Profit & Loss
    const calculateProfitLoss = () => {
        const profit = summary.income - summary.expense
        return {
            revenue: summary.income,
            expenses: summary.expense,
            profit: profit,
            marginPercent: summary.income > 0 ? ((profit / summary.income) * 100).toFixed(2) : 0
        }
    }
    // Download as PDF
    const downloadPDF = async (type) => {
        try {
            const element = document.getElementById(type === 'balance-sheet' ? 'balance-sheet-content' : 'profit-loss-content')
            if (!element) {
                showInfo('Content not found')
                return
            }
            // Create a new window for printing
            const printWindow = window.open('', '', 'height=600,width=800')
            printWindow.document.write('<html><head><title>' + (type === 'balance-sheet' ? 'Balance Sheet' : 'Profit & Loss') + '</title>')
            printWindow.document.write('<style>')
            printWindow.document.write('body { font-family: Arial; margin: 20px; }')
            printWindow.document.write('h1, h2 { color: #333; }')
            printWindow.document.write('table { width: 100%; border-collapse: collapse; margin: 20px 0; }')
            printWindow.document.write('td, th { padding: 10px; border-bottom: 1px solid #ddd; text-align: right; }')
            printWindow.document.write('th { background-color: #f0f0f0; font-weight: bold; }')
            printWindow.document.write('.label { text-align: left; }')
            printWindow.document.write('</style></head><body>')
            printWindow.document.write(element.innerHTML)
            printWindow.document.write('</body></html>')
            printWindow.document.close()
            setTimeout(() => {
                printWindow.print()
            }, 250)
        } catch (err) {
            showInfo('Failed to download')
        }
    }
    const [showAddForm, setShowAddForm] = useState(false)
    const [coaAccounts, setCoaAccounts] = useState([])
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        account_code: '',
        category: ''
    })
    useEffect(() => {
        const accountType = formData.type === 'income' ? 'revenue' : 'expense'
        api.get(`/api/finance/coa/by-type/${accountType}`)
            .then(res => {
                const accounts = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
                setCoaAccounts(accounts)
            })
            .catch(() => setCoaAccounts([]))
    }, [formData.type])
    const handleAddTransaction = (e) => {
        e.preventDefault()
        if (formData.description && formData.amount) {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount)
            }
            if (!payload.account_code) delete payload.account_code
            api.post('/api/finance/transaction', payload)
                .then(() => {
                    loadTransactions()
                    loadSummary()
                    setFormData({ description: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'income', account_code: '', category: '' })
                    setShowAddForm(false)
                    showInfo('Transaction added successfully!')
                })
                .catch(() => showInfo('Failed to add transaction'))
        }
    }
    const handleDeleteTransaction = (id) => {
        setTransactions(transactions.filter(t => t.id !== id))
        showInfo('Transaction deleted!')
    }
    const getFilteredTransactions = () => {
        return transactions.filter(t => {
            const matchesSearch = t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesFilter = filterType === 'all' || t.type === filterType
            return matchesSearch && matchesFilter
        })
    }
    // Sample data for charts
    const revenueExpensesData = [
        { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
        { month: 'Feb', revenue: 52000, expenses: 38000, profit: 14000 },
        { month: 'Mar', revenue: 48000, expenses: 35000, profit: 13000 },
        { month: 'Apr', revenue: 61000, expenses: 42000, profit: 19000 },
        { month: 'May', revenue: 55000, expenses: 40000, profit: 15000 },
        { month: 'Jun', revenue: 67000, expenses: 45000, profit: 22000 },
    ]
    const monthlyRevenueData = [
        { name: 'Revenue', value: 60, fill: '#667eea' },
        { name: 'Growth', value: 40, fill: '#f97316' }
    ]
    const cashFlowData = [
        { month: 'Jan', inflow: 45000, outflow: 32000 },
        { month: 'Feb', inflow: 52000, outflow: 38000 },
        { month: 'Mar', inflow: 48000, outflow: 35000 },
        { month: 'Apr', inflow: 61000, outflow: 42000 },
    ]
    const expenseBreakdown = [
        { description: 'Material Purchase', date: 'Mar 26', amount: -2700 },
        { description: 'Labor Costs', date: 'Mar 26', amount: 5000 },
        { description: 'Equipment Rental', date: 'Mar 24', amount: -1150 },
        { description: 'Client Payment', date: 'Mar 26', amount: 17700 },
        { description: 'Subcontractor Fees', date: 'Mar 26', amount: 2100 },
    ]
    const recentTransactions = transactions.slice(0, 5).map(t => ({
        description: t.description || 'Transaction',
        date: t.date || 'N/A',
        amount: t.type === 'income' ? `+$${t.amount?.toLocaleString() || 0}` : `-$${t.amount?.toLocaleString() || 0}`
    }))
    const overdueInvoices = [
        { name: 'Lincoln Tower', date: 'May 2', amount: '₹37,125' },
        { name: 'Greenfield Apartments', date: 'May 5', amount: '₹37,200' },
        { name: 'Highland Villas', date: 'May 10', amount: '₹24,500' },
    ]
    return (
        <div className="page-bg">
            <div className="max-w-7xl mx-auto">
            <div className="finance-dashboard">
            {/* Tab Navigation */}
            <div className="finance-tabs">
                <button
                    className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transactions')}
                >
                    Transactions
                </button>
                <button
                    className={`tab-button ${activeTab === 'balance-sheet' ? 'active' : ''}`}
                    onClick={() => setActiveTab('balance-sheet')}
                >
                    Balance Sheet
                </button>
                <button
                    className={`tab-button ${activeTab === 'profit-loss' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profit-loss')}
                >
                    Profit & Loss
                </button>
            </div>
            {activeTab === 'transactions' && (
            <>
            {/* KPI Cards */}
            <div className="finance-kpi-grid">
                <div className="kpi-card kpi-revenue">
                    <div className="kpi-content">
                        <p className="kpi-label">Total Revenue</p>
                        <p className="kpi-value">₹{(2e7 + 300000).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="kpi-icon">
                        <FaDollarSign />
                    </div>
                </div>
                <div className="kpi-card kpi-expenses">
                    <div className="kpi-content">
                        <p className="kpi-label">Total Expenses</p>
                        <p className="kpi-value">₹{(2e6 + 124000).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="kpi-icon">
                        <FaMoneyBillWave />
                    </div>
                </div>
                <div className="kpi-card kpi-profit">
                    <div className="kpi-content">
                        <p className="kpi-label">Profit (YTD)</p>
                        <p className="kpi-value">₹{(1e6 + 133500).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="kpi-icon">
                        <FaChartBar />
                    </div>
                </div>
                <div className="kpi-card kpi-invoices">
                    <div className="kpi-content">
                        <p className="kpi-label">Pending Invoices</p>
                        <p className="kpi-value">₹{(685000).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="kpi-icon">
                        <FaFileInvoiceDollar />
                    </div>
                </div>
            </div>
            {/* Main Charts Grid */}
            <div className="finance-charts-grid">
                {/* Revenue & Expenses Chart - Spans 2 columns */}
                <div className="chart-container revenue-expenses-chart">
                    <div className="chart-header">
                        <h2>Revenue & Expenses</h2>
                        <select className="time-filter">
                            <option>This Year</option>
                            <option>Last Year</option>
                            <option>Last Quarter</option>
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueExpensesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#667eea" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                            <Line type="monotone" dataKey="profit" stroke="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {/* Right Column */}
                <div className="finance-right-column">
                    {/* Monthly Revenue */}
                    <div className="chart-container monthly-revenue">
                        <h2>Monthly Revenue</h2>
                        <div className="revenue-donut-container">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={monthlyRevenueData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        dataKey="value"
                                        startAngle={180}
                                        endAngle={0}
                                    >
                                        {monthlyRevenueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="revenue-stats">
                                <p className="revenue-month">April</p>
                                <p className="revenue-amount">₹4,58,200</p>
                                <p className="revenue-growth">+15.6% ↑</p>
                                <p className="growth-comparison">This Month vs. Last Month</p>
                            </div>
                        </div>
                    </div>
                    {/* Recent Transactions */}
                    <div className="transactions-table">
                        <h2>Recent Transactions</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Staff / Description</th>
                                    <th>Project</th>
                                    <th>Date</th>
                                    <th>Account</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? (
                                    transactions.slice(0, 10).map((t, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <span className="staff-name">{t.staff_name || 'N/A'}</span>
                                                <div className="description-small">{t.description}</div>
                                            </td>
                                            <td>{t.project_name || 'N/A'}</td>
                                            <td>{t.date}</td>
                                            <td className="text-muted" style={{ fontSize: '0.85em' }}>{t.account_code || '-'}</td>
                                            <td className={t.type === 'income' ? 'positive' : 'negative'}>
                                                {t.type === 'income' ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">
                                            No transactions
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* Bottom Charts Grid */}
            <div className="finance-bottom-grid">
                {/* Cash Flow Chart */}
                <div className="chart-container cash-flow">
                    <div className="chart-header">
                        <h2>Cash Flow</h2>
                        <select className="time-filter">
                            <option>Last 4 Months</option>
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={cashFlowData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                            <Legend />
                            <Line type="monotone" dataKey="inflow" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 5 }} />
                            <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                {/* Expense Breakdown + Overdue Invoices */}
                <div className="expense-section">
                    {/* Expense Breakdown */}
                    <div className="expense-breakdown">
                        <h2>Expense Breakdown</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenseBreakdown.map((exp, idx) => (
                                    <tr key={idx}>
                                        <td>{exp.description}</td>
                                        <td>{exp.date}</td>
                                        <td className={exp.amount > 0 ? 'positive' : 'negative'}>
                                            {exp.amount > 0 ? '+₹' : '-₹'}{Math.abs(exp.amount).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Overdue Invoices */}
                    <div className="overdue-invoices">
                        <div className="overdue-header">
                            <h2>Overdue Invoices</h2>
                            <a href="#" className="view-all">View All {" "}→</a>
                        </div>
                        <div className="invoices-list">
                            {overdueInvoices.map((inv, idx) => (
                                <div key={idx} className="invoice-item">
                                    <div className="invoice-info">
                                        <p className="invoice-name">{inv.name}</p>
                                        <p className="invoice-date">{inv.date}</p>
                                    </div>
                                    <p className="invoice-amount">{inv.amount}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Transactions Section */}
            <div className="transactions-section">
                <div className="transactions-header">
                    <h2>All Transactions</h2>
                    <button
                        className="add-transaction-btn"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        + Add Transaction
                    </button>
                </div>
                {/* Search and Filter Bar */}
                <div className="transactions-search-filter">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-field"
                        />
                    </div>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filterType === 'income' ? 'active' : ''}`}
                            onClick={() => setFilterType('income')}
                        >
                            Income
                        </button>
                        <button
                            className={`filter-btn ${filterType === 'expense' ? 'active' : ''}`}
                            onClick={() => setFilterType('expense')}
                        >
                            Expense
                        </button>
                    </div>
                </div>
                {showAddForm && (
                    <div className="transaction-form-container">
                        <form onSubmit={handleAddTransaction} className="transaction-form">
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Enter transaction description"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value, account_code: '', category: ''})}
                                >
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Chart of Accounts</label>
                                <select
                                    value={formData.account_code}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        const selected = coaAccounts.find(a => a.account_code === val)
                                        setFormData({
                                            ...formData,
                                            account_code: val,
                                            category: selected ? (selected.category || '') : formData.category
                                        })
                                    }}
                                >
                                    <option value="">Select account (optional)</option>
                                    {coaAccounts.map(a => (
                                        <option key={a.account_code} value={a.account_code}>
                                            [{a.account_code}] {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    placeholder="Category (auto-filled from CoA)"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-submit">Add</button>
                                <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
                <div className="transactions-list-container">
                    <table className="transactions-full-table">
                        <thead>
                            <tr>
                                <th>Staff / Description</th>
                                <th>Project</th>
                                <th>Date</th>
                                <th>Account</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredTransactions().length > 0 ? (
                                getFilteredTransactions().map((t) => (
                                    <tr key={t.id}>
                                        <td>
                                            <span className="staff-name">{t.staff_name || 'N/A'}</span>
                                            <div className="description-small">{t.description}</div>
                                        </td>
                                        <td>{t.project_name || 'N/A'}</td>
                                        <td>{t.date}</td>
                                        <td className="text-muted" style={{ fontSize: '0.85em' }}>{t.account_code || '-'}</td>
                                        <td className={t.type === 'income' ? 'positive' : 'negative'}>
                                            {t.type === 'income' ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="action-cell">
                                            <button className="action-btn edit-btn" title="Edit transaction">
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="action-btn delete-btn"
                                                onClick={() => handleDeleteTransaction(t.id)}
                                                title="Delete transaction"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted" style={{ padding: '20px' }}>
                                        {transactions.length === 0 ? 'No transactions added yet' : 'No transactions found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            )}
            {activeTab === 'balance-sheet' && (
            <div className="financial-statement">
                <div className="statement-header">
                    <h2>Balance Sheet</h2>
                    <div className="statement-actions">
                        <button className="btn-print" onClick={() => window.print()}>
                            <FaPrint /> Print
                        </button>
                        <button className="btn-download" onClick={() => downloadPDF('balance-sheet')}>
                            <FaDownload /> Download
                        </button>
                    </div>
                </div>
                <div id="balance-sheet-content" className="statement-content">
                    <table className="statement-table">
                        <tbody>
                            <tr className="section-header">
                                <td colSpan="2"><strong>ASSETS</strong></td>
                            </tr>
                            <tr>
                                <td className="label">Current Assets</td>
                                <td className="amount">{formatCurrency(calculateBalanceSheet().assets)}</td>
                            </tr>
                            <tr className="section-total">
                                <td className="label"><strong>Total Assets</strong></td>
                                <td className="amount"><strong>{formatCurrency(calculateBalanceSheet().assets)}</strong></td>
                            </tr>
                            <tr className="section-header">
                                <td colSpan="2"><strong>LIABILITIES & EQUITY</strong></td>
                            </tr>
                            <tr>
                                <td className="label">Liabilities</td>
                                <td className="amount">{formatCurrency(calculateBalanceSheet().liabilities)}</td>
                            </tr>
                            <tr>
                                <td className="label">Equity</td>
                                <td className="amount">{formatCurrency(calculateBalanceSheet().equity)}</td>
                            </tr>
                            <tr className="section-total">
                                <td className="label"><strong>Total Liabilities & Equity</strong></td>
                                <td className="amount"><strong>{formatCurrency(calculateBalanceSheet().liabilities + calculateBalanceSheet().equity)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            )}
            {activeTab === 'profit-loss' && (
            <div className="financial-statement">
                <div className="statement-header">
                    <h2>Profit & Loss Statement</h2>
                    <div className="statement-actions">
                        <button className="btn-print" onClick={() => window.print()}>
                            <FaPrint /> Print
                        </button>
                        <button className="btn-download" onClick={() => downloadPDF('profit-loss')}>
                            <FaDownload /> Download
                        </button>
                    </div>
                </div>
                <div id="profit-loss-content" className="statement-content">
                    <table className="statement-table">
                        <tbody>
                            <tr className="section-header">
                                <td colSpan="2"><strong>REVENUE</strong></td>
                            </tr>
                            <tr>
                                <td className="label">Total Revenue</td>
                                <td className="amount">{formatCurrency(calculateProfitLoss().revenue)}</td>
                            </tr>
                            <tr className="section-header">
                                <td colSpan="2"><strong>EXPENSES</strong></td>
                            </tr>
                            <tr>
                                <td className="label">Total Expenses</td>
                                <td className="amount">{formatCurrency(calculateProfitLoss().expenses)}</td>
                            </tr>
                            <tr className="section-total">
                                <td className="label"><strong>Net Profit / Loss</strong></td>
                                <td className={`amount ${calculateProfitLoss().profit >= 0 ? 'positive' : 'negative'}`}>
                                    <strong>{calculateProfitLoss().profit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(calculateProfitLoss().profit))}</strong>
                                </td>
                            </tr>
                            <tr>
                                <td className="label">Profit Margin</td>
                                <td className="amount">{calculateProfitLoss().marginPercent}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            )}
            </div>
            </div>
        </div>
    )
}