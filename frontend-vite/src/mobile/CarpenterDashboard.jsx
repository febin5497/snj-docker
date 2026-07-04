import React, { useState } from 'react'
import { Hammer2, MapPin, CheckCircle, AlertCircle, Package } from 'lucide-react'

export default function CarpenterDashboard() {
    const [tasks] = useState([
        { id: 1, task: 'Door Frame Installation - Block A', status: 'in-progress', location: 'Level 2' },
        { id: 2, task: 'Window Installation - Block B', status: 'pending', location: 'Level 1' },
        { id: 3, task: 'Scaffolding Setup', status: 'in-progress', location: 'Ground Floor' }
    ])

    const [materials] = useState([
        { id: 1, item: 'Wooden Planks (2x4)', quantity: '50 feet', status: '✓' },
        { id: 2, item: 'Nails & Screws', quantity: '5 kg', status: '✓' },
        { id: 3, item: 'Door Frames', quantity: '6 units', status: '⚠️ Low' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
            {/* Header */}
            <div className="bg-orange-700 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Carpenter</h1>
                <p className="text-orange-100 mt-1">Carpentry & Woodwork</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-orange-600 px-3 py-1 rounded-full">3 Active Tasks</div>
                    <div className="bg-yellow-500 px-3 py-1 rounded-full">1 Material Alert</div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-orange-700">3</p>
                    <p className="text-gray-600 text-sm">Active Tasks</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-green-600">4.5 hrs</p>
                    <p className="text-gray-600 text-sm">Time Worked</p>
                </div>
            </div>

            {/* Tasks */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Hammer2 size={20} className="text-orange-700" />
                    Tasks
                </h2>
                <div className="space-y-3">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{task.task}</p>
                                    <p className="text-xs text-gray-500">{task.location}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {task.status === 'in-progress' ? '🔨 Active' : 'Pending'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Materials */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Package size={20} className="text-gray-700" />
                    Materials
                </h2>
                <div className="space-y-2">
                    {materials.map(mat => (
                        <div key={mat.id} className={`p-3 rounded-lg shadow flex justify-between items-center ${
                            mat.status === '✓' ? 'bg-white' : 'bg-yellow-50'
                        }`}>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{mat.item}</p>
                                <p className="text-xs text-gray-500">{mat.quantity}</p>
                            </div>
                            <span className={mat.status === '✓' ? 'text-green-600' : 'text-orange-600'}>{mat.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-orange-700 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        🔨 Start Work
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📋 Request Materials
                    </button>
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ✓ Complete Task
                    </button>
                    <button className="bg-red-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ⚠️ Report Issue
                    </button>
                </div>
            </div>
        </div>
    )
}
