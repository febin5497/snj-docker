import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, Users, FileText, MapPin, Phone, Calendar } from 'lucide-react'

export default function SiteEngineerDashboard() {
    const [todayTasks, setTodayTasks] = useState([
        { id: 1, title: 'Foundation inspection', status: 'in-progress', priority: 'high' },
        { id: 2, title: 'Review concrete mix', status: 'pending', priority: 'medium' },
        { id: 3, title: 'Approve material delivery', status: 'pending', priority: 'high' }
    ])

    const [teamOnSite, setTeamOnSite] = useState([
        { id: 1, name: 'Raj Kumar', role: 'Foreman', status: 'on-site' },
        { id: 2, name: 'Ramesh Singh', role: 'Laborer', status: 'on-site' },
        { id: 3, name: 'Priya Sharma', role: 'Mason', status: 'on-site' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Site Engineer</h1>
                <p className="text-blue-100 mt-1">Project XYZ - Building A</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-blue-500 px-3 py-1 rounded-full">Day 45/120</div>
                    <div className="bg-green-500 px-3 py-1 rounded-full">On Track</div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-white rounded-lg p-4 shadow">
                    <div className="text-2xl font-bold text-blue-600">8</div>
                    <p className="text-gray-600 text-sm">Tasks Today</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <p className="text-gray-600 text-sm">Team On Site</p>
                </div>
            </div>

            {/* Today's Tasks */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle size={20} className="text-blue-600" />
                    Today's Tasks
                </h2>
                <div className="space-y-2">
                    {todayTasks.map(task => (
                        <div key={task.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800">{task.title}</p>
                                <p className="text-xs text-gray-500 capitalize mt-1">{task.priority} priority</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {task.status === 'in-progress' ? '⏱️ In Progress' :
                                 task.status === 'completed' ? '✓ Done' : 'Pending'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team on Site */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Users size={20} className="text-green-600" />
                    Team On Site ({teamOnSite.length})
                </h2>
                <div className="space-y-2">
                    {teamOnSite.map(member => (
                        <div key={member.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <p className="text-xs font-semibold text-green-600">On Site</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold">
                        📸 Site Photo
                    </button>
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold">
                        ✓ Mark Task Complete
                    </button>
                    <button className="bg-orange-600 text-white p-4 rounded-lg shadow font-semibold">
                        ⚠️ Report Issue
                    </button>
                    <button className="bg-purple-600 text-white p-4 rounded-lg shadow font-semibold">
                        📋 Daily Report
                    </button>
                </div>
            </div>
        </div>
    )
}
