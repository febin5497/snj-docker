import { useEffect, useState } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import { FaFileInvoiceDollar, FaDownload, FaPlus, FaSearch, FaFilter, FaEye, FaCalendar, FaEnvelope, FaTrash } from "react-icons/fa"
export default function Invoices() {
    const { showInfo, showError, showSuccess } = useToast()
    const [invoices, setInvoices] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortBy, setSortBy] = useState("date")
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [formData, setFormData] = useState({
        customer: "",
        total_amount: "",
        date: new Date().toISOString().split('T')[0],
        project_id: "",
        items: []
    })
    const [currentItem, setCurrentItem] = useState({
        description: "",
        quantity: "",
        rate: ""
    })
    const [includeGST, setIncludeGST] = useState(true)
    const [gstRate, setGstRate] = useState(18)
    const [discount, setDiscount] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const gstRates = [5, 12, 18, 28]
    useEffect(() => {
        loadInvoices()
    }, [])
    const loadInvoices = async () => {
        try {
            const res = await api.get(`/api/invoices`)
            // Handle paginated response from BaseResourceRouter
            const allInvoices = res.data?.data || res.data?.message || res.data || []
            setInvoices(Array.isArray(allInvoices) ? allInvoices : [])
        } catch (err) {
            setInvoices([])
        }
    }
    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
    }
    const calculateGSTAmount = () => {
        if (!includeGST) return 0
        return (calculateSubtotal() * gstRate) / 100
    }
    const calculateTotalAmount = () => {
        return calculateSubtotal() + calculateGSTAmount() - parseFloat(discount || 0)
    }
    const handleCreateInvoice = async (e) => {
        e.preventDefault()
        // Validation
        if (!formData.customer || formData.items.length === 0) {
            showError("Please fill in all required fields and add at least one item")
            return
        }
        setIsSubmitting(true)
        try {
            const subtotal = calculateSubtotal()
            const gstAmount = calculateGSTAmount()
            const totalAmount = calculateTotalAmount()
            const response = await api.post("/api/invoices", {
                customer: formData.customer,
                subtotal: subtotal,
                include_gst: includeGST,
                gst_rate: includeGST ? gstRate : 0,
                gst_amount: gstAmount,
                discount: parseFloat(discount || 0),
                total_amount: totalAmount,
                date: formData.date,
                project_id: formData.project_id || null,
                items: formData.items
            })
            // Add new invoice to list
            setInvoices([response.data?.data, ...invoices])
            // Reset form
            setFormData({
                customer: "",
                total_amount: "",
                date: new Date().toISOString().split('T')[0],
                project_id: "",
                items: []
            })
            setCurrentItem({ description: "", quantity: "", rate: "" })
            setIncludeGST(true)
            setGstRate(18)
            setDiscount(0)
            setShowCreateModal(false)
            showSuccess("Invoice created successfully!")
        } catch (err) {
            showError(err.response?.data?.error || err.response?.data?.details || "Failed to create invoice")
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleAddItem = () => {
        if (!currentItem.description || !currentItem.quantity || !currentItem.rate) {
            showError("Please fill in all item fields")
            return
        }
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...currentItem, quantity: parseInt(currentItem.quantity), rate: parseFloat(currentItem.rate) }],
            total_amount: (parseFloat(prev.total_amount) || 0) + (parseInt(currentItem.quantity) * parseFloat(currentItem.rate))
        }))
        setCurrentItem({ description: "", quantity: "", rate: "" })
        showInfo("Item added to invoice")
    }
    const handleRemoveItem = (index) => {
        const removedItem = formData.items[index]
        const removedTotal = removedItem.quantity * removedItem.rate
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
            total_amount: Math.max(0, (parseFloat(prev.total_amount) || 0) - removedTotal)
        }))
        showInfo("Item removed")
    }
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }
    const handleDownloadInvoice = async (invoiceId) => {
        try {
            const response = await api.get(`/api/invoices/${invoiceId}/download`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `invoice-${invoiceId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
            showSuccess('Invoice downloaded successfully!')
        } catch (err) {
            showError('Failed to download invoice')
        }
    }
    const handleSendEmail = async (invoiceId) => {
        try {
            await api.post(`/api/invoices/${invoiceId}/send-email`)
            showSuccess('Invoice sent via email!')
        } catch (err) {
            showError('Failed to send invoice via email')
        }
    }
    const handleDeleteInvoice = async (invoiceId) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await api.delete(`/api/invoices/${invoiceId}`)
                setInvoices(invoices.filter(i => i.id !== invoiceId))
                showSuccess('Invoice deleted successfully!')
            } catch (err) {
                showError('Failed to delete invoice')
            }
        }
    }
    // Filter and search invoices
    const filteredInvoices = invoices.filter(i => {
        const matchesSearch =
            i?.id?.toString().includes(searchTerm.toLowerCase()) ||
            (i?.customer && i.customer.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesStatus = statusFilter === "all"
        return matchesSearch && matchesStatus
    }).sort((a, b) => {
        if (sortBy === "date") {
            return new Date(b.date || 0) - new Date(a.date || 0)
        } else if (sortBy === "amount") {
            return (b.total_amount || 0) - (a.total_amount || 0)
        }
        return a.id - b.id
    })
    const getStatusColor = (status) => {
        if (!status) return 'bg-white/10 text-secondary'
        const colors = {
            'draft': 'bg-yellow-500/15 text-yellow-400',
            'sent': 'bg-primary/15 text-accent',
            'paid': 'bg-success/15 text-success',
            'overdue': 'bg-danger/15 text-danger',
            'pending': 'bg-primary/15 text-accent'
        }
        return colors[status.toLowerCase()] || 'bg-white/10 text-secondary'
    }
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value || 0)
    }
    const totalAmount = filteredInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
    const paidAmount = 0  // Status tracking not implemented yet
    const pendingAmount = totalAmount  // All invoices are pending until status tracking added
    return (
        <div className="page-bg">
            <div className="max-w-7xl mx-auto">
            {/* Header with Action Button */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-primary">
                        <FaFileInvoiceDollar /> Invoices
                    </h1>
                    <p className="text-secondary mt-1 text-sm">Manage all invoices</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all shadow-lg bg-primary cursor-pointer"
                >
                    <FaPlus /> Create Invoice
                </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card-bg rounded-lg shadow-lg p-4 border-l-4 transform hover:shadow-xl transition-shadow border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-secondary text-xs font-semibold uppercase">Total Amount</p>
                            <p className="text-2xl font-bold text-accent mt-1">{formatCurrency(totalAmount)}</p>
                        </div>
                        <div className="text-4xl opacity-30 text-primary">
                            <FaFileInvoiceDollar />
                        </div>
                    </div>
                </div>
                <div className="rounded-lg shadow-lg p-4 transform hover:scale-105 transition-transform" style={{background: 'linear-gradient(135deg, #00B894, #006266)'}}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-200 text-xs font-semibold uppercase">Paid Amount</p>
                            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(paidAmount)}</p>
                        </div>
                        <div className="text-4xl text-green-200 opacity-50">
                            ✓
                        </div>
                    </div>
                </div>
                <div className="card-bg rounded-lg shadow-lg p-4 border-l-4 transform hover:shadow-xl transition-shadow border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-secondary text-xs font-semibold uppercase">Pending Amount</p>
                            <p className="text-2xl font-bold text-accent mt-1">{formatCurrency(pendingAmount)}</p>
                        </div>
                        <div className="text-4xl opacity-30 text-primary">
                            ⏳
                        </div>
                    </div>
                </div>
            </div>
            {/* Filter and Search Section */}
            <div className="card-bg rounded-lg shadow-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-3 items-end">
                    {/* Search Bar */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-secondary mb-2">Search Invoices</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-3 text-muted" />
                            <input
                                type="text"
                                placeholder="Search by invoice ID or client name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border-default rounded-lg focus:outline-none focus:ring-2 transition-all"
                            />
                        </div>
                    </div>
                    {/* Status Filter */}
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-semibold text-secondary mb-2">
                            <FaFilter className="inline mr-2" /> Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border-default rounded-lg focus:outline-none focus:ring-2 transition-all"
                        >
                            <option value="all">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                    {/* Sort By */}
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-semibold text-secondary mb-2">
                            <FaCalendar className="inline mr-2" /> Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-2 border-default rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="date">Latest First</option>
                            <option value="amount">Highest Amount</option>
                            <option value="id">Invoice ID</option>
                        </select>
                    </div>
                </div>
                <p className="text-sm text-muted mt-3">Showing {filteredInvoices.length} of {invoices.length} invoices</p>
            </div>
            {/* Invoices Table */}
            <div className="card-bg rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-bold mb-3 text-primary">
                    Invoice List ({filteredInvoices.length})
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-primary-gradient border-b-2 border-primary">
                                <th className="text-left py-2 px-3 font-semibold text-sm text-primary">Invoice ID</th>
                                <th className="text-left py-2 px-3 font-semibold text-sm text-primary">Customer</th>
                                <th className="text-center py-2 px-3 font-semibold text-sm text-primary">Date</th>
                                <th className="text-right py-2 px-3 font-semibold text-sm text-primary">Amount</th>
                                <th className="text-center py-2 px-3 font-semibold text-sm text-primary">Items</th>
                                <th className="text-center py-2 px-3 font-semibold text-sm text-primary">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-muted">
                                        No invoices found
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-default text-sm hover:bg-white/5 transition-colors">
                                        <td className="py-2 px-3">
                                            <div className="font-bold text-primary text-xs">#{invoice.id}</div>
                                        </td>
                                        <td className="py-2 px-3">
                                            <span className="font-medium text-primary text-xs">{invoice.customer || 'N/A'}</span>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <span className="text-xs text-secondary">
                                                {invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN') : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                            <span className="font-bold text-primary text-xs">{formatCurrency(invoice.total_amount)}</span>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <span className="text-xs text-secondary">{invoice.items?.length || 0} items</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex gap-2 justify-center flex-wrap">
                                                <button
                                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-danger/20 transition-colors font-semibold text-xs text-danger"
                                                    title="Delete"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Create Invoice Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="card-solid rounded-lg shadow-2xl w-full max-w-4xl h-auto max-h-[85vh]">
                        <div className="p-6 text-white bg-primary">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <FaFileInvoiceDollar /> Create New Invoice
                            </h2>
                        </div>
                        <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Customer Name */}
                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">
                                    Customer Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="customer"
                                    placeholder="Customer/Client Name"
                                    value={formData.customer}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border-default rounded-lg focus:outline-none focus:ring-2 transition-all"
                                />
                            </div>
                            {/* Invoice Date */}
                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">
                                    Invoice Date <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border-default rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            {/* Project ID */}
                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">Project ID (Optional)</label>
                                <input
                                    type="number"
                                    name="project_id"
                                    placeholder="Project ID"
                                    value={formData.project_id}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border-default rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            {/* GST Section */}
                            <div className="border-t pt-4">
                                <div className="mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeGST}
                                            onChange={(e) => setIncludeGST(e.target.checked)}
                                            className="w-[18px] h-[18px] cursor-pointer"
                                        />
                                        <span className="font-semibold text-secondary">Include GST (Goods and Services Tax)</span>
                                    </label>
                                </div>
                                {includeGST && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-semibold text-secondary mb-2">GST Rate (%)</label>
                                        <select
                                            value={gstRate}
                                            onChange={(e) => setGstRate(parseFloat(e.target.value))}
                                            className="w-full px-4 py-2 border-default rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        >
                                            {gstRates.map(rate => (
                                                <option key={rate} value={rate}>{rate}% GST</option>
                                            ))}
                                        </select>
                                        <small className="block mt-1 text-muted">
                                            5% (Essential), 12% (Processed), 18% (General), 28% (Luxury)
                                        </small>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-secondary mb-2">Discount (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2 border-default rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            {/* Line Items Section */}
                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-secondary mb-3">Invoice Items <span className="text-danger">*</span></h3>
                                {/* Add Item Form */}
                                <div className="space-y-2 mb-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={currentItem.description}
                                            onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                                            className="px-3 py-2 border-default rounded text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={currentItem.quantity}
                                            onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                                            className="px-3 py-2 border-default rounded text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Rate"
                                            value={currentItem.rate}
                                            onChange={(e) => setCurrentItem({...currentItem, rate: e.target.value})}
                                            className="px-3 py-2 border-default rounded text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="w-full px-3 py-2 bg-primary text-white rounded text-sm font-semibold hover:bg-primary/80"
                                    >
                                        Add Item
                                    </button>
                                </div>
                                {/* Items List */}
                                {formData.items.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-muted grid grid-cols-4 gap-2 mb-2">
                                            <div>Description</div>
                                            <div className="text-right">Qty × Rate</div>
                                            <div className="text-right">Total</div>
                                            <div>Action</div>
                                        </div>
                                        {formData.items.map((item, idx) => (
                                            <div key={idx} className="text-xs grid grid-cols-4 gap-2 items-center p-2 bg-white/5 rounded">
                                                <div>{item.description}</div>
                                                <div className="text-right">{item.quantity} × {item.rate}</div>
                                                <div className="text-right font-semibold">{formatCurrency(item.quantity * item.rate)}</div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="px-2 py-1 rounded hover:bg-danger/20 text-danger"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Total Amount Display with GST Breakdown */}
                                <div className="mt-3 pt-3 border-t">
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between text-secondary">
                                            <span>Subtotal:</span>
                                            <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                                        </div>
                                        {includeGST && (
                                            <div className="flex justify-between text-secondary">
                                                <span>GST ({gstRate}%):</span>
                                                <span className="font-semibold">{formatCurrency(calculateGSTAmount())}</span>
                                            </div>
                                        )}
                                        {discount > 0 && (
                                            <div className="flex justify-between text-secondary">
                                                <span>Discount:</span>
                                                <span className="font-semibold">-{formatCurrency(discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t pt-1 mt-1 text-base font-bold text-primary">
                                            <span>Grand Total:</span>
                                            <span>{formatCurrency(calculateTotalAmount())}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Buttons */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-2 px-4 text-white font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary"
                                >
                                    {isSubmitting ? "Creating..." : "Create Invoice"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false)
                                        setFormData({customer: "", total_amount: "", date: new Date().toISOString().split('T')[0], project_id: "", items: []})
                                        setCurrentItem({description: "", quantity: "", rate: ""})
                                        setIncludeGST(true)
                                        setGstRate(18)
                                        setDiscount(0)
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 py-2 px-4 bg-white/10 text-secondary font-semibold rounded-lg hover:bg-white/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    )
}
