import React, { useState } from 'react'
import { Zap, AlertTriangle, CheckCircle, Tool, MapPin, Clock } from 'lucide-react'

export default function ElectricianDashboard() {
    const [workOrders] = useState([
        { id: 1, task: 'Main Panel Installation', area: 'Level 1', status: 'in-progress', priority: 'high' },
        { id: 2, task: 'Wiring - Block A', area: 'Level 2', status: 'pending', priority: 'medium' },
        { id: 3, task: 'Testing & Commissioning', area: 'Ground Floor', status: 'pending', priority: 'high' }
    ])

    const [safetyAlerts] = useState([
        { id: 1, alert: 'High Voltage Warning', location: 'Transformer Room', status: 'active' },
        { id: 2, alert: 'Grounding Check Required', location: 'Block B', status: 'pending' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white pb-20">
            {/* Header */}
            <div className="bg-yellow-600 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Electrician</h1>
                <p className="text-yellow-100 mt-1">Electrical Works & Safety</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-yellow-500 px-3 py-1 rounded-full">3 Active Orders</div>
                    <div className="bg-red-500 px-3 py-1 rounded-full">Safety Check Required</div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-yellow-600">3</p>
                    <p className="text-gray-600 text-sm">Work Orders Today</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-green-600">95%</p>
                    <p className="text-gray-600 text-sm">Safety Compliance</p>
                </div>
            </div>

            {/* Work Orders */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Zap size={20} className="text-yellow-600" />
                    Work Orders
                </h2>
                <div className="space-y-3">
                    {workOrders.map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-600">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{order.task}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin size={14} />
                                        {order.area}
                                    </p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                    order.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {order.priority.toUpperCase()}
                                </span>
                            </div>
                            <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                                order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                                {order.status === 'in-progress' ? '⚡ In Progress' : 'Pending'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety Alerts */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-600" />
                    Safety Alerts
                </h2>
                <div className="space-y-2">
                    {safetyAlerts.map(alert => (
                        <div key={alert.id} className="bg-red-50 p-4 rounded-lg shadow border-l-4 border-red-600">
                            <p className="font-semibold text-gray-800 text-sm">{alert.alert}</p>
                            <p className="text-xs text-gray-600 mt-1">{alert.location}</p>
                            <div className="mt-2">
                                <button className="text-xs font-semibold bg-red-600 text-white px-3 py-1 rounded">
                                    ✓ Acknowledge
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tools Checklist */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Tool size={20} className="text-gray-700" />
                    Safety Equipment
                </h2>
                <div className="space-y-2">
                    {[
                        { item: 'Safety Harness', status: true },
                        { item: 'Insulated Gloves', status: true },
                        { item: 'Testing Equipment', status: true },
                        { item: 'Safety Goggles', status: false }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg shadow flex justify-between items-center">
                            <p className="text-gray-800">{item.item}</p>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                item.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {item.status ? '✓' : '✗'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-yellow-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ⚡ Start Work
                    </button>
                    <button className="bg-red-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ⚠️ Safety Issue
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ✓ Complete Task
                    </button>
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📋 Test Report
                    </button>
                </div>
            </div>
        </div>
    )
}
