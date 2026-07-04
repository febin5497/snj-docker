import React, { useState } from 'react'
import { BarChart3, AlertTriangle, Users, TrendingUp, Calendar, MapPin } from 'lucide-react'

export default function ProjectManagerDashboard() {
    const [projects] = useState([
        { id: 1, name: 'Building A - Phase 1', progress: 65, status: 'on-track', budget: '₹500L', spent: '₹325L' },
        { id: 2, name: 'Building B - Foundation', progress: 40, status: 'delayed', budget: '₹300L', spent: '₹180L' },
        { id: 3, name: 'Building C - Planning', progress: 10, status: 'on-track', budget: '₹400L', spent: '₹40L' }
    ])

    const [risks] = useState([
        { issue: 'Material Shortage - Cement', severity: 'high', impact: 'Day 5-7 delay' },
        { issue: 'Weather Delay Expected', severity: 'medium', impact: 'Day 2-3 delay' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
            {/* Header */}
            <div className="bg-slate-700 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Project Manager</h1>
                <p className="text-slate-100 mt-1">Projects & Timeline Management</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-slate-600 px-3 py-1 rounded-full">3 Projects</div>
                    <div className="bg-red-500 px-3 py-1 rounded-full">1 At Risk</div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-blue-600">45%</p>
                    <p className="text-gray-600 text-sm">Avg Progress</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-orange-600">₹545L</p>
                    <p className="text-gray-600 text-sm">Total Spent</p>
                </div>
            </div>

            {/* Projects Overview */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <BarChart3 size={20} className="text-slate-700" />
                    Active Projects
                </h2>
                <div className="space-y-3">
                    {projects.map(project => (
                        <div key={project.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{project.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{project.budget}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                    project.status === 'on-track' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {project.status === 'on-track' ? '✓ On Track' : '⚠️ Delayed'}
                                </span>
                            </div>
                            <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Progress</span>
                                    <span className="font-semibold">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600">Spent: {project.spent}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Risk Register */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-600" />
                    Risk Register
                </h2>
                <div className="space-y-2">
                    {risks.map((risk, idx) => (
                        <div key={idx} className={`p-3 rounded-lg shadow text-sm ${
                            risk.severity === 'high' ? 'bg-red-50 border-l-4 border-red-600' : 'bg-yellow-50 border-l-4 border-yellow-600'
                        }`}>
                            <p className="font-semibold text-gray-800">{risk.issue}</p>
                            <p className="text-xs text-gray-600 mt-1">Impact: {risk.impact}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-slate-700 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📊 View Timeline
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📋 Budget Report
                    </button>
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        👥 Team Status
                    </button>
                    <button className="bg-orange-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ⚠️ Risk Assessment
                    </button>
                </div>
            </div>
        </div>
    )
}
