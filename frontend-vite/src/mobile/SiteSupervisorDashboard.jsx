import React, { useState } from 'react'
import { Users, AlertTriangle, ClipboardCheck, TrendingUp, MessageSquare, Clock } from 'lucide-react'

export default function SiteSupervisorDashboard() {
    const [teamPerformance] = useState([
        { id: 1, name: 'Team A', assigned: 10, completed: 9, quality: '95%' },
        { id: 2, name: 'Team B', assigned: 8, completed: 6, quality: '88%' },
        { id: 3, name: 'Team C', assigned: 12, completed: 11, quality: '92%' }
    ])

    const [qualityIssues] = useState([
        { id: 1, type: 'Concrete Quality', severity: 'high', team: 'Team A' },
        { id: 2, type: 'Safety Violation', severity: 'high', team: 'Team B' },
        { id: 3, type: 'Material Wastage', severity: 'medium', team: 'Team C' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-20">
            {/* Header */}
            <div className="bg-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Site Supervisor</h1>
                <p className="text-purple-100 mt-1">Team Management & Quality Control</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-purple-500 px-3 py-1 rounded-full">30 Workers</div>
                    <div className="bg-red-500 px-3 py-1 rounded-full">3 Issues</div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-white rounded-lg p-4 shadow border-l-4 border-blue-600">
                    <p className="text-2xl font-bold text-blue-600">30</p>
                    <p className="text-gray-600 text-sm">Total Workers</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow border-l-4 border-green-600">
                    <p className="text-2xl font-bold text-green-600">92%</p>
                    <p className="text-gray-600 text-sm">Quality Score</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow border-l-4 border-orange-600">
                    <p className="text-2xl font-bold text-orange-600">3</p>
                    <p className="text-gray-600 text-sm">Issues Today</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow border-l-4 border-purple-600">
                    <p className="text-2xl font-bold text-purple-600">87%</p>
                    <p className="text-gray-600 text-sm">Attendance Rate</p>
                </div>
            </div>

            {/* Team Performance */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    Team Performance
                </h2>
                <div className="space-y-2">
                    {teamPerformance.map(team => (
                        <div key={team.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold text-gray-800">{team.name}</p>
                                <p className="text-sm font-bold text-green-600">{team.quality}</p>
                            </div>
                            <div className="flex gap-2 text-xs text-gray-600 mb-2">
                                <span>Tasks: {team.completed}/{team.assigned}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(team.completed / team.assigned) * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quality Issues */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-600" />
                    Quality Issues
                </h2>
                <div className="space-y-2">
                    {qualityIssues.map(issue => (
                        <div key={issue.id} className={`p-4 rounded-lg shadow border-l-4 ${
                            issue.severity === 'high' ? 'bg-red-50 border-red-600' : 'bg-yellow-50 border-yellow-600'
                        }`}>
                            <p className="font-semibold text-gray-800">{issue.type}</p>
                            <p className="text-xs text-gray-600 mt-1">{issue.team}</p>
                            <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                                issue.severity === 'high' ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'
                            }`}>
                                {issue.severity.toUpperCase()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        👥 Assign Tasks
                    </button>
                    <button className="bg-red-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ⚠️ Log Issue
                    </button>
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ✓ Approve Work
                    </button>
                    <button className="bg-orange-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📊 View Report
                    </button>
                </div>
            </div>
        </div>
    )
}
