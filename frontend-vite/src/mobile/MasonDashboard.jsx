import React, { useState } from 'react'
import { Hammer, MapPin, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react'

export default function MasonDashboard() {
    const [dailyQuota] = useState({ target: 100, completed: 75, unit: 'sq. feet' })
    const [tasks] = useState([
        { id: 1, task: 'Brick Laying - Wall A', progress: 80, area: 'Level 2', status: 'in-progress' },
        { id: 2, task: 'Plastering - Block B', progress: 0, area: 'Level 1', status: 'pending' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-20">
            {/* Header */}
            <div className="bg-amber-700 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Mason</h1>
                <p className="text-amber-100 mt-1">Masonry & Construction</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-amber-600 px-3 py-1 rounded-full">75/100 sq.ft</div>
                    <div className="bg-green-500 px-3 py-1 rounded-full">75% Complete</div>
                </div>
            </div>

            {/* Daily Progress */}
            <div className="p-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Today's Quota</h2>
                    <div className="text-center mb-4">
                        <p className="text-4xl font-bold text-amber-700">{dailyQuota.completed}</p>
                        <p className="text-gray-600 text-sm">out of {dailyQuota.target} {dailyQuota.unit}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="bg-amber-700 h-4 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-2">75% Complete</p>
                </div>
            </div>

            {/* Active Tasks */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Hammer size={20} className="text-amber-700" />
                    Active Tasks
                </h2>
                <div className="space-y-3">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{task.task}</p>
                                    <p className="text-xs text-gray-500">{task.area}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {task.status === 'in-progress' ? '🔨 Active' : 'Pending'}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-amber-700 h-2 rounded-full" style={{ width: `${task.progress}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-amber-700 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        🔨 Start Work
                    </button>
                    <button className="bg-red-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ⚠️ Report Issue
                    </button>
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ✓ Mark Complete
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📊 Daily Report
                    </button>
                </div>
            </div>
        </div>
    )
}
