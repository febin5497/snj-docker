import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaMobileAlt, FaTruck, FaTools, FaReceipt, FaArrowRight } from 'react-icons/fa';
import '../../styles/MobileDashboard.css';
export default function MobileDashboard() {
  const navigate = useNavigate();
  const mobileModules = [
    {
      title: 'Driver Dashboard',
      icon: <FaTruck />,
      description: 'Real-time vehicle tracking, fuel logs, maintenance schedules, and certificate expiry alerts',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      features: [
        '🚗 Vehicle Status Tracking',
        '⛽ Fuel Management',
        '🔧 Maintenance Logs',
        '📋 Certificate Tracking',
        '🚨 Expiry Alerts'
      ]
    },
    {
      title: 'Engineer Dashboard',
      icon: <FaTools />,
      description: 'Expense entry, project assignment, photo capture, and offline support',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      features: [
        '💰 Expense Entry',
        '📸 Photo Capture',
        '📍 Project Assignment',
        '📊 Expense History',
        '🔌 Offline Support'
      ]
    },
    {
      title: 'Staff Dashboard',
      icon: <FaReceipt />,
      description: 'Attendance punch-in/out, task management, and document access',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      features: [
        '⏱️ Punch In/Out',
        '✓ Task Tracking',
        '📄 Document Access',
        '📝 Attendance History',
        '🔔 Notifications'
      ]
    }
  ];
  return (
    <div className="mobile-dashboard-container theme-blue-white">
      <div className="mobile-header">
        <button className="back-btn btn-blue-white" onClick={() => navigate('/')}>
          <FaChevronLeft /> Back
        </button>
        <h1 style={{ color: '#0052CC' }}><FaMobileAlt /> Mobile Dashboards</h1>
      </div>
      <div className="mobile-intro">
        <p>Access powerful mobile dashboards built with React Native for real-time field operations:</p>
      </div>
      <div className="mobile-modules-grid">
        {mobileModules.map((module, i) => (
          <div key={i} className="mobile-module-card" style={{ background: module.gradient }}>
            <div className="module-header-top">
              <div className="module-icon-large">{module.icon}</div>
            </div>
            <div className="module-content">
              <h2>{module.title}</h2>
              <p className="module-desc">{module.description}</p>
              <div className="features-list">
                <h4>Features:</h4>
                <ul>
                  {module.features.map((feature, j) => (
                    <li key={j}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="module-footer">
              <button className="view-more-btn">
                View Details <FaArrowRight />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mobile-specs">
        <h2 style={{ color: '#0052CC' }}>Mobile App Specifications</h2>
        <div className="specs-grid">
          <div className="spec-card">
            <h3>Framework</h3>
            <p>React Native</p>
            <small>Cross-platform (iOS & Android)</small>
          </div>
          <div className="spec-card">
            <h3>Real-time Sync</h3>
            <p>Always Connected</p>
            <small>Auto-sync when online</small>
          </div>
          <div className="spec-card">
            <h3>Offline Support</h3>
            <p>Full Functionality</p>
            <small>Works without internet</small>
          </div>
          <div className="spec-card">
            <h3>Security</h3>
            <p>JWT Authentication</p>
            <small>Secure data transmission</small>
          </div>
          <div className="spec-card">
            <h3>Battery Optimized</h3>
            <p>Efficient Code</p>
            <small>Minimal battery drain</small>
          </div>
          <div className="spec-card">
            <h3>User-Friendly</h3>
            <p>Intuitive UI</p>
            <small>Easy to learn and use</small>
          </div>
        </div>
      </div>
      <div className="deployment-guide">
        <h2 style={{ color: '#0052CC' }}>Getting Started</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Clone Repository</h3>
            <p>Get the React Native codebase from your development repository</p>
            <code>git clone &lt;mobile-repo-url&gt;</code>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Install Dependencies</h3>
            <p>Install all required packages and dependencies</p>
            <code>npm install</code>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Configure API</h3>
            <p>Set up the backend API endpoint in your config</p>
            <code>API_URL=http://localhost:5000</code>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Run on Device</h3>
            <p>Run the app on iOS or Android simulator/device</p>
            <code>npm run ios / npm run android</code>
          </div>
        </div>
      </div>
      <div className="features-highlight">
        <h2 style={{ color: '#0052CC' }}>Key Features</h2>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">📍</span>
            <h3>Location Tracking</h3>
            <p>Real-time GPS tracking for vehicles and staff</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📸</span>
            <h3>Photo Capture</h3>
            <p>Capture and upload photos directly from mobile</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔔</span>
            <h3>Push Notifications</h3>
            <p>Instant alerts and notifications for important updates</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💾</span>
            <h3>Local Storage</h3>
            <p>Store data locally for offline access</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <h3>Fast Performance</h3>
            <p>Optimized for speed and responsiveness</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <h3>Secure Access</h3>
            <p>Role-based access control and encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
}
