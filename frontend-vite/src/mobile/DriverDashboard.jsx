import React, { useState } from 'react'
import { Truck, AlertTriangle, MapPin, Fuel, Clock, CheckCircle } from 'lucide-react'

export default function DriverDashboard() {
    const [vehicle] = useState({
        plateNo: 'MH-01-AB-1234',
        type: 'Tipper Truck',
        currentLocation: 'Site A - Main Gate',
        fuelLevel: 75,
        mileage: '45,230 km',
        status: 'Active'
    })

    const [deliveries] = useState([
        { id: 1, material: 'Cement Bags', quantity: '50 bags', destination: 'Site A', status: 'in-transit', eta: '30 mins' },
        { id: 2, material: 'Steel Rods', quantity: '2 tons', destination: 'Site B', status: 'pending', eta: '2 hours' }
    ])

    const [certificateStatus] = useState([
        { name: 'Insurance', expiryDays: 45, status: 'ok' },
        { name: 'RC', expiryDays: 120, status: 'ok' },
        { name: 'Fitness', expiryDays: 15, status: 'warning' },
        { name: 'Permit', expiryDays: 5, status: 'danger' }
    ])

    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pb-20">
            {/* Header */}
            <div className="bg-red-600 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold">Driver</h1>
                <p className="text-red-100 mt-1">Vehicle & Delivery Management</p>
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="bg-red-500 px-3 py-1 rounded-full">{vehicle.plateNo}</div>
                    <div className="bg-green-500 px-3 py-1 rounded-full">On Duty</div>
                </div>
            </div>

            {/* Vehicle Status */}
            <div className="p-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Vehicle Status</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-700">Type:</span>
                            <span className="font-semibold">{vehicle.type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700">Location:</span>
                            <span className="font-semibold text-blue-600">{vehicle.currentLocation}</span>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-700">Fuel Level:</span>
                                <span className="font-semibold">{vehicle.fuelLevel}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-green-600 h-3 rounded-full" style={{ width: `${vehicle.fuelLevel}%` }}></div>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700">Mileage:</span>
                            <span className="font-semibold">{vehicle.mileage}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deliveries */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Truck size={20} className="text-red-600" />
                    Deliveries
                </h2>
                <div className="space-y-3">
                    {deliveries.map(delivery => (
                        <div key={delivery.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{delivery.material}</p>
                                    <p className="text-xs text-gray-500">{delivery.quantity}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                    delivery.status === 'in-transit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {delivery.status === 'in-transit' ? '🚚 In Transit' : 'Pending'}
                                </span>
                            </div>
                            <div className="text-xs text-gray-600 flex justify-between">
                                <span>{delivery.destination}</span>
                                <span>ETA: {delivery.eta}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Certificate Status */}
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-orange-600" />
                    Document Status
                </h2>
                <div className="space-y-2">
                    {certificateStatus.map((cert, idx) => (
                        <div key={idx} className={`p-3 rounded-lg shadow flex justify-between items-center ${
                            cert.status === 'ok' ? 'bg-green-50' :
                            cert.status === 'warning' ? 'bg-yellow-50' :
                            'bg-red-50'
                        }`}>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">{cert.name}</p>
                                <p className="text-xs text-gray-600">{cert.expiryDays} days remaining</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${
                                cert.status === 'ok' ? 'bg-green-600' :
                                cert.status === 'warning' ? 'bg-yellow-600' :
                                'bg-red-600'
                            }`}></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-red-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        🚚 Start Trip
                    </button>
                    <button className="bg-green-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ✓ Complete Delivery
                    </button>
                    <button className="bg-orange-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        ⛽ Fuel Request
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg shadow font-semibold text-sm">
                        📊 Trip Report
                    </button>
                </div>
            </div>
        </div>
    )
}
