import { Link, useLocation } from "react-router-dom"
import { FaHome, FaProjectDiagram, FaUsers, FaTruck, FaCubes, FaMoneyBillWave, FaFileAlt, FaFileInvoiceDollar, FaMap, FaCamera, FaClock, FaChartBar, FaTimes, FaFileExcel, FaTools, FaFileContract, FaCameraRetro, FaBox, FaReceipt, FaShoppingCart, FaExchangeAlt, FaDollarSign, FaCog, FaListAlt, FaShieldAlt, FaClipboardList, FaChevronDown, FaCheckCircle } from "react-icons/fa"
import { useState, useEffect } from "react"
import "../styles/Sidebar.css"

export default function Sidebar({ isOpen, onClose }){

  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [expandedSections, setExpandedSections] = useState({
    2: true,  // Human Resources - for Attendance (Staff)
    4: true,  // Store & Inventory - for Store module
    5: true,  // Sales & Quotations - for Estimates module
    7: true   // Location & Media - for Map, Site Photos, 3D Plan Viewer
  })

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile && onClose) {
      onClose()
    }
  }, [location, isMobile, onClose])

  const menuSections = [
    {
      title: "Main",
      items: [
        {name:"Dashboard",path:"/dashboard", icon: <FaHome />},
      ]
    },
    {
      title: "Projects",
      items: [
        {name:"Projects",path:"/projects", icon: <FaProjectDiagram />},
        {name:"Project Planner",path:"/planner", icon: <FaClock />},
        {name:"Project Progress",path:"/progress", icon: <FaChartBar />},
        {name:"Project Cost",path:"/project-cost", icon: <FaMoneyBillWave />},
      ]
    },
    {
      title: "Human Resources",
      items: [
        {name:"Staff",path:"/staff", icon: <FaUsers />},
        {name:"Staff Expenses",path:"/staff/expenses", icon: <FaDollarSign />},
        {name:"Attendance (Staff)",path:"/attendance/unified", icon: <FaCameraRetro />},
        {name:"Attendance (Management)",path:"/attendance/report", icon: <FaFileExcel />},
        {name:"Attendance Approvals",path:"/attendance/approvals", icon: <FaChartBar />},
      ]
    },
    {
      title: "Operations",
      items: [
        {name:"Vehicles",path:"/vehicles", icon: <FaTruck />},
        {name:"Vehicle Allocation",path:"/vehicles/allocation", icon: <FaTruck />},
        {name:"Materials",path:"/materials", icon: <FaCubes />},
        {name:"Material Usage",path:"/material-usage", icon: <FaChartBar />},
        {name:"Equipment",path:"/equipment", icon: <FaTools />},
      ]
    },
    {
      title: "Store & Inventory",
      items: [
        {name:"Store",path:"/store", icon: <FaBox />},
        {name:"Suppliers",path:"/suppliers", icon: <FaTruck />},
        {name:"Purchase Indents",path:"/indents", icon: <FaClipboardList />},
        {name:"Purchases",path:"/purchases", icon: <FaShoppingCart />},
        {name:"Purchase Returns",path:"/purchase-returns", icon: <FaExchangeAlt />},
        {name:"GRN (Goods Receipt)",path:"/grn", icon: <FaBox />},
      ]
    },
    {
      title: "Sales & Quotations",
      items: [
        {name:"Sales",path:"/sales", icon: <FaDollarSign />},
        {name:"Sales Returns",path:"/sales-returns", icon: <FaExchangeAlt />},
        {name:"Quotations",path:"/quotes", icon: <FaFileContract />},
        {name:"Quote Templates",path:"/quote-templates", icon: <FaFileAlt />},
        {name:"Estimates",path:"/estimates", icon: <FaReceipt />},
      ]
    },
    {
      title: "Finance & Documents",
      items: [
        {name:"Finance Dashboard",path:"/finance", icon: <FaMoneyBillWave />},
        {name:"Pending Approvals",path:"/finance/pending-approvals", icon: <FaCheckCircle />},
        {name:"Expense Approvals",path:"/finance/approvals", icon: <FaCheckCircle />},
        {name:"Invoices",path:"/invoices", icon: <FaFileInvoiceDollar />},
        {name:"Budgets",path:"/budgets", icon: <FaDollarSign />},
        {name:"Documents",path:"/documents", icon: <FaFileAlt />},
      ]
    },
    {
      title: "Reports & Analytics",
      items: [
        {name:"Reports",path:"/reports", icon: <FaChartBar />},
      ]
    },
    {
      title: "Location & Media",
      items: [
        {name:"Project Map",path:"/map", icon: <FaMap />},
        {name:"Site Photos",path:"/site-photos", icon: <FaCamera />},
        {name:"3D Plan Viewer",path:"/plan-viewer", icon: <FaProjectDiagram />}
      ]
    },
    {
      title: "Administration",
      items: [
        {name:"Users",path:"/admin/users", icon: <FaUsers />},
        {name:"Roles",path:"/admin/roles", icon: <FaShieldAlt />},
        {name:"Activity Logs",path:"/admin/activity-logs", icon: <FaClipboardList />},
        {name:"Company Settings",path:"/admin/company-settings", icon: <FaCog />},
      ]
    }
  ]

  const isActive = (path) => location.pathname === path

  const toggleSection = (idx) => {
    setExpandedSections(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  return(
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar ${isMobile && isOpen ? 'mobile-open' : ''} ${isMobile ? 'mobile' : ''}`}
        data-mobile={isMobile}
      >

      <div className="sidebar-header">

        <div className="sidebar-logo">
          <FaProjectDiagram size={24} />
        </div>

        <h1 className="sidebar-title">
          BuildERP
        </h1>

        {isMobile && (
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <FaTimes size={20} />
          </button>
        )}

      </div>

      {/* Scrollable menu */}

      <nav className="sidebar-nav">

        {menuSections.map((section, idx) => (

          <div key={idx} className="menu-section">

            <button
              className="section-title-btn"
              onClick={() => toggleSection(idx)}
            >
              <h3 className="section-title">{section.title}</h3>
              <FaChevronDown className={`section-chevron ${expandedSections[idx] ? 'expanded' : ''}`} />
            </button>

            {expandedSections[idx] && (
              <div className="section-items">

                {section.items.map((item, i) => (

                  <Link
                  key={i}
                  to={item.path}
                  className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                  >

                    <span className="link-icon">{item.icon}</span>
                    <span className="link-text">{item.name}</span>

                  </Link>

                ))}

              </div>
            )}

          </div>

        ))}

      </nav>

      </div>

    </>

  )

}