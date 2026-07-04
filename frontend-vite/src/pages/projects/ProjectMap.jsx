import { useEffect, useState, useCallback, useRef } from "react"
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import { FaMapMarkerAlt, FaSearch, FaFilter, FaPlus, FaCalendar, FaSpinner } from "react-icons/fa"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "../../styles/theme-variables.css"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const popupStyle = { color: "var(--text-primary)", fontSize: "13px" }
const popupNameStyle = { fontWeight: 700, color: "var(--text-primary)", margin: 0 }
const popupLocStyle = { color: "var(--text-secondary)", margin: "4px 0 0 0", fontSize: "12px" }
const popupBadgeStyle = { display: "inline-block", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, marginTop: "4px" }

function MapController({ projects }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (!fitted.current && projects.length > 0) {
      const bounds = L.latLngBounds()
      projects.forEach(p => {
        if (p.latitude && p.longitude) {
          bounds.extend([parseFloat(p.latitude), parseFloat(p.longitude)])
        }
      })
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
        fitted.current = true
      }
    }
  }, [map, projects])
  return null
}

function FlyToController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 13, { duration: 0.8 })
    }
  }, [map, center, zoom])
  return null
}

const STATUS_COLORS = {
  'active': { bg: 'rgba(72, 187, 120, 0.12)', color: '#48bb78' },
  'planning': { bg: 'rgba(0, 82, 204, 0.12)', color: 'var(--color-primary)' },
  'completed': { bg: 'rgba(56, 161, 105, 0.12)', color: '#38a169' },
  'on-hold': { bg: 'rgba(237, 137, 54, 0.12)', color: '#ed8936' },
  'paused': { bg: 'rgba(220, 53, 69, 0.12)', color: '#dc3545' },
}

export default function ProjectMap() {
  const { showError, showInfo } = useToast()
  const [projects, setProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterByStatus, setFilterByStatus] = useState("all")
  const [selectedProject, setSelectedProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const res = await api.get("/api/projects")
      const projectsData = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : []
      setProjects(projectsData)
    } catch (error) {
      showError("Failed to load projects")
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterByStatus === "all" || (p.status && p.status.toLowerCase() === filterByStatus.toLowerCase())
    return matchesSearch && matchesStatus
  })

  const defaultPosition = [20.5937, 78.9629]
  const mapCenter = selectedProject && selectedProject.latitude && selectedProject.longitude
    ? [parseFloat(selectedProject.latitude), parseFloat(selectedProject.longitude)]
    : null

  const projectCount = projects.length
  const activeProjects = projects.filter(p => p.status && p.status.toLowerCase() === "active").length
  const completedProjects = projects.filter(p => p.status && p.status.toLowerCase() === "completed").length

  const getStatusStyle = (status) => {
    if (!status) return { bg: 'rgba(0,0,0,0.06)', color: 'var(--text-tertiary)' }
    return STATUS_COLORS[status.toLowerCase()] || { bg: 'rgba(0,0,0,0.06)', color: 'var(--text-tertiary)' }
  }

  const formatDate = (d) => {
    if (!d) return null
    try { return new Date(d).toLocaleDateString('en-IN') } catch { return d }
  }

  const handleMarkerClick = useCallback((project) => {
    setSelectedProject(project)
  }, [])

  const projectsWithCoords = filteredProjects.filter(p => p.latitude && p.longitude)

  if (isLoading) {
    return (
      <div className="p-6" style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
          <FaSpinner style={{ fontSize: '40px', color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading project locations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6" style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-popup-content { margin: 10px 14px; }
        .leaflet-popup-content-wrapper { border-radius: 8px; }
      `}</style>

      <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
            <FaMapMarkerAlt /> Project Locations
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Track and manage construction project locations</p>
        </div>
        <button
          onClick={() => showInfo("Add Project Location feature coming soon!")}
          style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          <FaPlus /> Add Location
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, #2dd4bf, #059669)', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'default' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Locations</p>
              <p style={{ fontSize: '30px', fontWeight: 700, color: 'white', marginTop: '8px' }}>{projectCount}</p>
            </div>
            <FaMapMarkerAlt style={{ fontSize: '48px', color: 'rgba(255,255,255,0.4)' }} />
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #22d3ee, #2563eb)', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'default' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Projects</p>
              <p style={{ fontSize: '30px', fontWeight: 700, color: 'white', marginTop: '8px' }}>{activeProjects}</p>
            </div>
            <span style={{ fontSize: '48px', color: 'rgba(255,255,255,0.4)' }}>✓</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderLeft: '4px solid var(--color-primary)', transition: 'box-shadow 0.2s', cursor: 'default' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.15)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</p>
              <p style={{ fontSize: '30px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '8px' }}>{completedProjects}</p>
            </div>
            <span style={{ fontSize: '48px', color: 'var(--color-primary)', opacity: 0.3 }}>✓</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', marginBottom: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Search Locations</label>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search by project name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--border-light)', borderRadius: '8px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,82,204,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>
          <div style={{ width: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <FaFilter style={{ display: 'inline', marginRight: '8px' }} /> Status
            </label>
            <select
              value={filterByStatus}
              onChange={(e) => setFilterByStatus(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '8px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,82,204,0.15)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '12px' }}>Showing {filteredProjects.length} of {projects.length} locations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, background: 'linear-gradient(135deg, #0d9488, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>
            Geographic View
          </h2>
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <MapContainer
              center={defaultPosition}
              zoom={5}
              style={{ height: 400, width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController projects={projectsWithCoords} />
              <FlyToController center={mapCenter} zoom={14} />
              {projectsWithCoords.map(project => (
                <Marker
                  key={project.id}
                  position={[parseFloat(project.latitude), parseFloat(project.longitude)]}
                  eventHandlers={{ click: () => handleMarkerClick(project) }}
                >
                  <Popup>
                    <div style={popupStyle}>
                      <p style={popupNameStyle}>{project.name}</p>
                      <p style={popupLocStyle}>{project.location || "No location"}</p>
                      {project.status && (
                        <span style={{ ...popupBadgeStyle, ...getStatusStyle(project.status) }}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          {projectsWithCoords.length === 0 && filteredProjects.length > 0 && (
            <p style={{ color: '#d97706', fontSize: '13px', marginTop: '8px' }}>No coordinates available for the filtered projects</p>
          )}
        </div>

        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, background: 'linear-gradient(135deg, #0d9488, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>
            Projects List ({filteredProjects.length})
          </h2>
          <div style={{ maxHeight: '384px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredProjects.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>No projects found</p>
            ) : (
              filteredProjects.map(project => {
                const isSelected = selectedProject?.id === project.id
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-color)',
                      background: isSelected ? 'rgba(0,82,204,0.06)' : 'var(--bg-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(0,82,204,0.04)' } }}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-primary)' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{project.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <FaMapMarkerAlt style={{ color: 'var(--color-primary)' }} /> {project.location || 'N/A'}
                        </p>
                        {project.start_date && (
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <FaCalendar style={{ color: 'var(--color-primary)' }} /> {formatDate(project.start_date)}
                          </p>
                        )}
                      </div>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: getStatusStyle(project.status).bg,
                        color: getStatusStyle(project.status).color,
                        whiteSpace: 'nowrap',
                      }}>
                        {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {selectedProject && (
        <div style={{ marginTop: '24px', background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, background: 'linear-gradient(135deg, #0d9488, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>
            Project Details
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>Project Name</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{selectedProject.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>Status</p>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '999px',
                fontWeight: 600,
                background: getStatusStyle(selectedProject.status).bg,
                color: getStatusStyle(selectedProject.status).color,
              }}>
                {selectedProject.status ? selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1) : 'Unknown'}
              </span>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>Location</p>
              <p style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <FaMapMarkerAlt style={{ color: 'var(--color-primary)' }} /> {selectedProject.location || 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>Coordinates</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{selectedProject.latitude || 'N/A'}, {selectedProject.longitude || 'N/A'}</p>
            </div>
            {selectedProject.start_date && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>Start Date</p>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>{formatDate(selectedProject.start_date)}</p>
              </div>
            )}
            {selectedProject.end_date && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>End Date</p>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>{formatDate(selectedProject.end_date)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
