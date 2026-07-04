import React, { useState } from 'react'
import { Clock, Briefcase, DollarSign, CheckCircle, AlertCircle, MapPin } from 'lucide-react'

export default function LaborerDashboard() {
    const [todaySchedule] = useState([
        { id: 1, time: '08:00 AM - 12:30 PM', task: 'Site Excavation - Area A', status: 'completed' },
        { id: 2, time: '01:30 PM - 05:00 PM', task: 'Material Loading', status: 'in-progress' }
    ])

    const [attendanceRecord] = useState({
        present: 18,
        absent: 2,
        late: 1,
        totalDays: 21
    })

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
            {/* Header */}
            <div className="bg-green-600 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">My Dashboard</h1>
                <p className="text-green-100 mt-1">Daily Work Schedule</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-green-500 px-3 py-1 rounded-full">Present Today</div>
                    <div className="bg-blue-500 px-3 py-1 rounded-full">8 hours/day</div>
                </div>
            </div>

            {/* Punch Status */}
            <div className="p-4">
                <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-5xl font-bold text-green-600 mb-2">08:15</div>
                    <p className="text-gray-600 mb-4">Punch In Time</p>
                    <div className="flex gap-3">
                        <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold">
                            ✓ Punch Out
                        </button>
                        <button className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold">
                            📸 Proof
                        </button>
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock size={20} className="text-blue-600" />
                    Today's Schedule
                </h2>
                <div className="space-y-3">
                    {todaySchedule.map(item => (
                        <div key={item.id} className={`p-4 rounded-lg shadow border-l-4 ${
                            item.status === 'completed' ? 'bg-green-50 border-green-600' : 'bg-blue-50 border-blue-600'
                        }`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.task}</p>
                                    <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                        <Clock size={14} />
                                        {item.time}
                                    </p>
                                </div>
                                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                                    item.status === 'completed' ? 'bg-green-200 text-green-700' : 'bg-blue-200 text-blue-700'
                                }`}>
                                    {item.status === 'completed' ? '✓ Done' : '⏱️ Active'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Attendance Summary */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle size={20} className="text-purple-600" />
                    Attendance This Month
                </h2>
                <div className="grid grid-cols-4 gap-2">
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <p className="text-2xl font-bold text-green-600">{attendanceRecord.present}</p>
                        <p className="text-xs text-gray-600">Present</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <p className="text-2xl font-bold text-red-600">{attendanceRecord.absent}</p>
                        <p className="text-xs text-gray-600">Absent</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <p className="text-2xl font-bold text-yellow-600">{attendanceRecord.late}</p>
                        <p className="text-xs text-gray-600">Late</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <p className="text-2xl font-bold text-blue-600">{Math.round((attendanceRecord.present / attendanceRecord.totalDays) * 100)}%</p>
                        <p className="text-xs text-gray-600">Rate</p>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Quick Info</h3>
                    <div className="space-y-2 text-sm">
                        <p className="flex justify-between text-gray-600">
                            <span>Supervisor:</span>
                            <span className="font-semibold">Raj Kumar</span>
                        </p>
                        <p className="flex justify-between text-gray-600">
                            <span>Site Location:</span>
                            <span className="font-semibold">Building A</span>
                        </p>
                        <p className="flex justify-between text-gray-600">
                            <span>Daily Wage:</span>
                            <span className="font-semibold">₹500</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ☎️ Contact Supervisor
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📞 Call Helpline
                    </button>
                </div>
            </div>
        </div>
    )
}
