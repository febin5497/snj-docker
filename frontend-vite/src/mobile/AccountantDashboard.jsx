import React, { useState } from 'react'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Calendar } from 'lucide-react'

export default function AccountantDashboard() {
    const [financialSummary] = useState({
        totalExpenses: '₹1,245,000',
        totalInvoiced: '₹1,800,000',
        pending: '₹555,000',
        profitMargin: '32%'
    })

    const [pendingPayments] = useState([
        { id: 1, client: 'ABC Construction', amount: '₹250,000', daysOverdue: 15, invoice: 'INV-001' },
        { id: 2, client: 'XYZ Builders', amount: '₹305,000', daysOverdue: 8, invoice: 'INV-002' }
    ])

    const [expenses] = useState([
        { category: 'Materials', amount: '₹600,000', percentage: 48 },
        { category: 'Labor', amount: '₹400,000', percentage: 32 },
        { category: 'Equipment', amount: '₹150,000', percentage: 12 },
        { category: 'Other', amount: '₹95,000', percentage: 8 }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
            {/* Header */}
            <div className="bg-green-700 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Accountant</h1>
                <p className="text-green-100 mt-1">Financial Management & Reporting</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-green-600 px-3 py-1 rounded-full">Revenue: ₹1.8L</div>
                    <div className="bg-red-500 px-3 py-1 rounded-full">Pending: ₹5.55L</div>
                </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{financialSummary.totalExpenses}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600">Total Invoiced</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{financialSummary.totalInvoiced}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600">Pending Collection</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{financialSummary.pending}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600">Profit Margin</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{financialSummary.profitMargin}</p>
                </div>
            </div>

            {/* Pending Payments */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-600" />
                    Pending Payments
                </h2>
                <div className="space-y-3">
                    {pendingPayments.map(payment => (
                        <div key={payment.id} className="bg-red-50 p-4 rounded-lg shadow border-l-4 border-red-600">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{payment.client}</p>
                                    <p className="text-xs text-gray-600">{payment.invoice}</p>
                                </div>
                                <span className="text-sm font-bold text-red-700">{payment.amount}</span>
                            </div>
                            <p className="text-xs text-red-700">⚠️ {payment.daysOverdue} days overdue</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expense Breakdown */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <DollarSign size={20} className="text-blue-600" />
                    Expense Breakdown
                </h2>
                <div className="space-y-3">
                    {expenses.map((expense, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-800">{expense.category}</span>
                                <span className="font-bold text-gray-800">{expense.amount}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${expense.percentage}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{expense.percentage}% of total</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-green-700 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📊 Financial Report
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📋 Invoice List
                    </button>
                    <button className="bg-orange-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        💰 Payment Reminder
                    </button>
                    <button className="bg-red-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📈 Budget Analysis
                    </button>
                </div>
            </div>
        </div>
    )
}
