import React, { useState } from 'react'
import { Settings, Users, AlertTriangle, BarChart3, Database, CheckCircle } from 'lucide-react'

export default function AdminDashboard() {
    const [systemStats] = useState({
        totalUsers: 156,
        activeProjects: 12,
        systemUptime: '99.8%',
        lastBackup: 'Today at 2:30 AM'
    })

    const [systemAlerts] = useState([
        { id: 1, type: 'Database', message: 'Database usage at 78% capacity', severity: 'warning' },
        { id: 2, type: 'Users', message: '5 new user registrations pending approval', severity: 'info' },
        { id: 3, type: 'Security', message: 'SSL certificate expires in 30 days', severity: 'warning' }
    ])

    const [recentActivity] = useState([
        { action: 'User Registration', user: 'John Smith', time: '10 mins ago' },
        { action: 'Project Created', user: 'Project Manager', time: '1 hour ago' },
        { action: 'Report Generated', user: 'Admin', time: '2 hours ago' },
        { action: 'System Backup', user: 'Automated', time: '4 hours ago' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-20">
            {/* Header */}
            <div className="bg-purple-700 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">System Admin</h1>
                <p className="text-purple-100 mt-1">System Configuration & Monitoring</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-purple-600 px-3 py-1 rounded-full">{systemStats.totalUsers} Users</div>
                    <div className="bg-green-500 px-3 py-1 rounded-full">{systemStats.systemUptime} Uptime</div>
                </div>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-blue-600">{systemStats.totalUsers}</p>
                    <p className="text-gray-600 text-sm">Total Users</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-green-600">{systemStats.activeProjects}</p>
                    <p className="text-gray-600 text-sm">Active Projects</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-green-600">{systemStats.systemUptime}</p>
                    <p className="text-gray-600 text-sm">System Uptime</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm font-semibold text-purple-600">{systemStats.lastBackup}</p>
                    <p className="text-gray-600 text-sm">Last Backup</p>
                </div>
            </div>

            {/* System Alerts */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-orange-600" />
                    System Alerts
                </h2>
                <div className="space-y-2">
                    {systemAlerts.map(alert => (
                        <div key={alert.id} className={`p-3 rounded-lg shadow text-sm ${
                            alert.severity === 'warning' ? 'bg-orange-50 border-l-4 border-orange-600' : 'bg-blue-50 border-l-4 border-blue-600'
                        }`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-gray-800">{alert.type}</p>
                                    <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                                </div>
                                <button className="text-xs font-semibold px-2 py-1 rounded bg-white text-gray-700 hover:bg-gray-100">
                                    Action
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-600" />
                    Recent Activity
                </h2>
                <div className="space-y-2">
                    {recentActivity.map((activity, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg shadow text-sm border-l-4 border-purple-600">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-gray-800">{activity.action}</p>
                                    <p className="text-xs text-gray-600">By: {activity.user}</p>
                                </div>
                                <span className="text-xs text-gray-500">{activity.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Database Management */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Database size={20} className="text-gray-700" />
                    Database Status
                </h2>
                <div className="bg-white rounded-lg shadow p-4 space-y-3">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-800">Storage Usage</span>
                            <span className="text-sm font-bold text-gray-800">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-orange-600 h-3 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-semibold">
                            🔄 Run Backup
                        </button>
                        <button className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm font-semibold">
                            📊 View Logs
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Admin Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-purple-700 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        👥 Manage Users
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        🔐 Permissions
                    </button>
                    <button className="bg-orange-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ⚙️ Settings
                    </button>
                    <button className="bg-red-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📋 Audit Logs
                    </button>
                </div>
            </div>
        </div>
    )
}
