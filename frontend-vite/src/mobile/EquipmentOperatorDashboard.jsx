import React, { useState } from 'react'
import { Wind, AlertTriangle, Gauge, MapPin, Clock, CheckCircle } from 'lucide-react'

export default function EquipmentOperatorDashboard() {
    const [equipmentList] = useState([
        { id: 1, name: 'Excavator XL-200', location: 'Site A', hours: 245, status: 'active', nextMaintenance: '50 hours' },
        { id: 2, name: 'Bulldozer D8', location: 'Site B', hours: 180, status: 'idle', nextMaintenance: '120 hours' },
        { id: 3, name: 'Crane 50T', location: 'Site A', hours: 90, status: 'active', nextMaintenance: '160 hours' }
    ])

    const [maintenanceAlerts] = useState([
        { equipment: 'Excavator XL-200', issue: 'Oil Change Due', priority: 'high' },
        { equipment: 'Crane 50T', issue: 'Safety Inspection', priority: 'medium' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-20">
            {/* Header */}
            <div className="bg-indigo-600 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Equipment Operator</h1>
                <p className="text-indigo-100 mt-1">Equipment Management & Maintenance</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-indigo-500 px-3 py-1 rounded-full">3 Equipment</div>
                    <div className="bg-orange-500 px-3 py-1 rounded-full">2 Maintenance Due</div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-indigo-600">3</p>
                    <p className="text-gray-600 text-sm">Equipment Assigned</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-2xl font-bold text-orange-600">2</p>
                    <p className="text-gray-600 text-sm">Maintenance Alerts</p>
                </div>
            </div>

            {/* Equipment List */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Wind size={20} className="text-indigo-600" />
                    My Equipment
                </h2>
                <div className="space-y-3">
                    {equipmentList.map(equipment => (
                        <div key={equipment.id} className={`p-4 rounded-lg shadow ${
                            equipment.status === 'active' ? 'border-l-4 border-green-600 bg-white' : 'bg-gray-50'
                        }`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{equipment.name}</p>
                                    <p className="text-xs text-gray-500">{equipment.location}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                    equipment.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {equipment.status === 'active' ? '✓ Active' : 'Idle'}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Hours: {equipment.hours}</span>
                                <span>Next Maintenance: {equipment.nextMaintenance}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Maintenance Alerts */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-600" />
                    Maintenance Alerts
                </h2>
                <div className="space-y-2">
                    {maintenanceAlerts.map((alert, idx) => (
                        <div key={idx} className={`p-4 rounded-lg shadow ${
                            alert.priority === 'high' ? 'bg-red-50 border-l-4 border-red-600' : 'bg-yellow-50 border-l-4 border-yellow-600'
                        }`}>
                            <p className="font-semibold text-gray-800 text-sm">{alert.equipment}</p>
                            <p className="text-xs text-gray-600 mt-1">{alert.issue}</p>
                            <button className={`mt-2 text-xs font-semibold px-3 py-1 rounded ${
                                alert.priority === 'high' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                            }`}>
                                Schedule Maintenance
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-indigo-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        🚜 Start Equipment
                    </button>
                    <button className="bg-orange-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        🔧 Report Maintenance
                    </button>
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ✓ Complete Task
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📊 Usage Report
                    </button>
                </div>
            </div>
        </div>
    )
}
