import React, { useState } from 'react'
import { Briefcase, Users, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react'

export default function ForemanDashboard() {
    const [workItems] = useState([
        { id: 1, task: 'Excavation - Area A', assigned: 5, progress: 75, status: 'in-progress' },
        { id: 2, task: 'Formwork - Level 2', assigned: 8, progress: 45, status: 'in-progress' },
        { id: 3, task: 'Concrete Pouring', assigned: 12, progress: 0, status: 'pending' }
    ])

    const [safetyChecks] = useState([
        { id: 1, item: 'Helmet & PPE Usage', status: '✓', timestamp: '10:30 AM' },
        { id: 2, item: 'Safety Barriers', status: '✓', timestamp: '10:45 AM' },
        { id: 3, item: 'Equipment Inspection', status: '✗', timestamp: 'Pending' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
            {/* Header */}
            <div className="bg-orange-600 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Foreman</h1>
                <p className="text-orange-100 mt-1">Work Execution & Safety</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-orange-500 px-3 py-1 rounded-full">15 Workers</div>
                    <div className="bg-yellow-500 px-3 py-1 rounded-full">3 Active Tasks</div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-orange-600">15</p>
                    <p className="text-gray-600 text-sm">Team Members</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-green-600">100%</p>
                    <p className="text-gray-600 text-sm">Safety Compliant</p>
                </div>
            </div>

            {/* Work Items */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Briefcase size={20} className="text-orange-600" />
                    Work in Progress
                </h2>
                <div className="space-y-3">
                    {workItems.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.task}</p>
                                    <p className="text-xs text-gray-500">{item.assigned} workers assigned</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    item.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {item.status === 'in-progress' ? '⏱️ Active' : item.status === 'completed' ? '✓ Done' : 'Pending'}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-orange-600 h-3 rounded-full" style={{ width: `${item.progress}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{item.progress}% Complete</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Safety Checks */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-600" />
                    Daily Safety Checks
                </h2>
                <div className="space-y-2">
                    {safetyChecks.map(check => (
                        <div key={check.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                    check.status === '✓' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {check.status}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm">{check.item}</p>
                                    <p className="text-xs text-gray-500">{check.timestamp}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-orange-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        🔧 Start Work
                    </button>
                    <button className="bg-red-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ⚠️ Report Delay
                    </button>
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ✓ Complete Task
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        👥 Team Status
                    </button>
                </div>
            </div>
        </div>
    )
}
