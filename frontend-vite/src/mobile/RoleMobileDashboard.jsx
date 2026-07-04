import React, { useState, useEffect } from 'react'
import SiteEngineerDashboard from './SiteEngineerDashboard'
import SiteSupervisorDashboard from './SiteSupervisorDashboard'
import ForemanDashboard from './ForemanDashboard'
import LaborerDashboard from './LaborerDashboard'
import ElectricianDashboard from './ElectricianDashboard'
import PlumberDashboard from './PlumberDashboard'
import MasonDashboard from './MasonDashboard'
import CarpenterDashboard from './CarpenterDashboard'
import DriverDashboard from './DriverDashboard'
import EquipmentOperatorDashboard from './EquipmentOperatorDashboard'
import ProjectManagerDashboard from './ProjectManagerDashboard'
import AccountantDashboard from './AccountantDashboard'
import AdminDashboard from './AdminDashboard'

const dashboardMap = {
    'Site Engineer': SiteEngineerDashboard,
    'Site Supervisor': SiteSupervisorDashboard,
    'Foreman': ForemanDashboard,
    'Laborer': LaborerDashboard,
    'Electrician': ElectricianDashboard,
    'Plumber': PlumberDashboard,
    'Mason': MasonDashboard,
    'Carpenter': CarpenterDashboard,
    'Driver': DriverDashboard,
    'Equipment Operator': EquipmentOperatorDashboard,
    'Project Manager': ProjectManagerDashboard,
    'Accountant': AccountantDashboard,
    'Admin': AdminDashboard
}

export default function RoleMobileDashboard() {
    const [userRole, setUserRole] = useState('Site Engineer')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get user's role from localStorage or API
        const storedRole = localStorage.getItem('userRole')
        if (storedRole && dashboardMap[storedRole]) {
            setUserRole(storedRole)
        }
        setLoading(false)
    }, [])

    const DashboardComponent = dashboardMap[userRole] || SiteEngineerDashboard

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-4 text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    return <DashboardComponent />
}
