import React, { useState } from 'react'
import { Droplets, AlertTriangle, CheckCircle, Tool, MapPin, Clock } from 'lucide-react'

export default function PlumberDashboard() {
    const [workOrders] = useState([
        { id: 1, task: 'Main Water Line Installation', area: 'Level 1', status: 'in-progress' },
        { id: 2, task: 'Bathroom Fixtures - Block A', area: 'Level 2', status: 'pending' },
        { id: 3, task: 'Drainage System', area: 'Ground Floor', status: 'pending' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Plumber</h1>
                <p className="text-blue-100 mt-1">Plumbing & Water Systems</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-blue-500 px-3 py-1 rounded-full">3 Active Tasks</div>
                    <div className="bg-green-500 px-3 py-1 rounded-full">No Blockages</div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-blue-600">3</p>
                    <p className="text-gray-600 text-sm">Active Tasks</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-green-600">2.5 hrs</p>
                    <p className="text-gray-600 text-sm">Time Worked</p>
                </div>
            </div>

            {/* Work Orders */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Droplets size={20} className="text-blue-600" />
                    Work Orders
                </h2>
                <div className="space-y-3">
                    {workOrders.map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{order.task}</p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <MapPin size={14} />
                                        {order.area}
                                    </p>
                                </div>
                            </div>
                            <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                                order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                                {order.status === 'in-progress' ? '💧 In Progress' : 'Pending'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Materials Used Today */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Materials Used Today</h2>
                <div className="space-y-2">
                    {[
                        { item: 'PVC Pipes (1/2")', quantity: '20 feet', status: '✓' },
                        { item: 'Elbow Joints', quantity: '8 units', status: '✓' },
                        { item: 'Sealant Tape', quantity: '2 rolls', status: '✓' }
                    ].map((mat, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg shadow flex justify-between items-center">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{mat.item}</p>
                                <p className="text-xs text-gray-500">{mat.quantity}</p>
                            </div>
                            <span className="text-green-600 font-bold">{mat.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        💧 Start Work
                    </button>
                    <button className="bg-red-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        🚨 Report Issue
                    </button>
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ✓ Complete Task
                    </button>
                    <button className="bg-orange-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📋 Request Materials
                    </button>
                </div>
            </div>
        </div>
    )
}
