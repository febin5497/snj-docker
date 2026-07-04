import { useState, useEffect } from 'react';
import { FaBell, FaLock, FaPalette, FaDatabase, FaToggleOn, FaToggleOff, FaSave } from 'react-icons/fa';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import '../../styles/Settings.css';
export default function Settings() {
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    autoSave: true,
    darkMode: false,
    twoFactorAuth: false,
    dataBackup: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Load settings from backend
  useEffect(() => {
    loadSettings();
  }, []);
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/settings');
      const settingsData = res.data?.data || res.data || {};
      // Map backend response to frontend state
      setSettings({
        emailNotifications: settingsData.email_notifications ?? true,
        pushNotifications: settingsData.push_notifications ?? true,
        autoSave: settingsData.auto_save ?? true,
        darkMode: settingsData.dark_mode ?? false,
        twoFactorAuth: settingsData.two_factor_auth ?? false,
        dataBackup: settingsData.data_backup ?? true,
      });
    } catch (err) {
      // Keep default settings on error
      showError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };
  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const handleSave = async () => {
    try {
      setSaving(true);
      // Map frontend state to backend request format
      const payload = {
        email_notifications: settings.emailNotifications,
        push_notifications: settings.pushNotifications,
        auto_save: settings.autoSave,
        dark_mode: settings.darkMode,
        two_factor_auth: settings.twoFactorAuth,
        data_backup: settings.dataBackup,
      };
      const res = await api.put('/api/settings', payload);
      showSuccess(res.data?.message || 'Settings saved successfully!');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save settings');
      // Reload settings on error
      await loadSettings();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="theme-blue-white" style={{ minHeight: '100vh', padding: '20px' }}>
    <div className="settings-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Settings Header */}
      <div className="settings-header">
        <h1 className="header-blue-white">Settings</h1>
        <p>Manage your account preferences and application settings</p>
      </div>
      {/* Settings Sections */}
      <div className="settings-content">
        {/* Notifications Section */}
        <div className="settings-section">
          <div className="section-header">
            <FaBell className="section-icon" />
            <h2>Notifications</h2>
          </div>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Email Notifications</p>
                <p className="setting-description">Receive updates and alerts via email</p>
              </div>
              <button
                className={`toggle-btn ${settings.emailNotifications ? 'active' : ''}`}
                onClick={() => handleToggle('emailNotifications')}
              >
                {settings.emailNotifications ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Push Notifications</p>
                <p className="setting-description">Get real-time notifications in the app</p>
              </div>
              <button
                className={`toggle-btn ${settings.pushNotifications ? 'active' : ''}`}
                onClick={() => handleToggle('pushNotifications')}
              >
                {settings.pushNotifications ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </div>
          </div>
        </div>
        {/* Privacy & Security Section */}
        <div className="settings-section">
          <div className="section-header">
            <FaLock className="section-icon" />
            <h2>Privacy & Security</h2>
          </div>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Two-Factor Authentication</p>
                <p className="setting-description">Add an extra layer of security to your account</p>
              </div>
              <button
                className={`toggle-btn ${settings.twoFactorAuth ? 'active' : ''}`}
                onClick={() => handleToggle('twoFactorAuth')}
              >
                {settings.twoFactorAuth ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Auto Save</p>
                <p className="setting-description">Automatically save your work while editing</p>
              </div>
              <button
                className={`toggle-btn ${settings.autoSave ? 'active' : ''}`}
                onClick={() => handleToggle('autoSave')}
              >
                {settings.autoSave ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </div>
          </div>
        </div>
        {/* Appearance Section */}
        <div className="settings-section">
          <div className="section-header">
            <FaPalette className="section-icon" />
            <h2>Appearance</h2>
          </div>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Dark Mode</p>
                <p className="setting-description">Use dark color scheme for the interface</p>
              </div>
              <button
                className={`toggle-btn ${settings.darkMode ? 'active' : ''}`}
                onClick={() => handleToggle('darkMode')}
              >
                {settings.darkMode ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </div>
          </div>
        </div>
        {/* Data & Backup Section */}
        <div className="settings-section">
          <div className="section-header">
            <FaDatabase className="section-icon" />
            <h2>Data & Backup</h2>
          </div>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-title">Automatic Data Backup</p>
                <p className="setting-description">Automatically backup your data daily</p>
              </div>
              <button
                className={`toggle-btn ${settings.dataBackup ? 'active' : ''}`}
                onClick={() => handleToggle('dataBackup')}
              >
                {settings.dataBackup ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Save Button */}
      <div className="settings-footer">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving || loading}
          style={{ opacity: saving || loading ? 0.6 : 1, cursor: saving || loading ? 'not-allowed' : 'pointer' }}
        >
          <FaSave /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
    </div>
  );
}
