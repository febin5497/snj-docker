import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBriefcase, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import api from '../../api/api';
import '../../styles/Profile.css';
export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    role: '',
    company: '',
    joinDate: ''
  });
  const [loading, setLoading] = useState(true);
  // Fetch current user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get current user from localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = userData.role || 'staff';
        // Fetch staff record if user is staff
        if (userRole === 'staff') {
          const response = await api.get('/api/staff/me');
          const staff = response.data?.data || response.data;
          setProfile({
            firstName: staff.name || userData.username || '',
            lastName: userRole.charAt(0).toUpperCase() + userRole.slice(1),
            email: staff.email || '',
            phone: staff.phone || '',
            location: '',
            role: staff.role || userRole,
            company: 'Construction Co',
            joinDate: staff.joining_date || ''
          });
        } else {
          // For admin/other roles
          setProfile({
            firstName: userData.username || 'User',
            lastName: userRole.charAt(0).toUpperCase() + userRole.slice(1),
            email: userData.email || '',
            phone: '',
            location: '',
            role: userRole,
            company: 'Construction Co',
            joinDate: ''
          });
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);
  const [formData, setFormData] = useState(profile);
  const handleEdit = () => {
    setIsEditing(true);
    setFormData(profile);
  };
  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
  };
  const handleCancel = () => {
    setIsEditing(false);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  if (loading) {
    return <div className="profile-container"><p>Loading profile...</p></div>;
  }
  return (
    <div className="theme-blue-white" style={{ minHeight: '100vh', padding: '20px' }}>
    <div className="profile-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-large">
          {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
        </div>
        <div className="profile-header-info">
          <h1 className="profile-name header-blue-white" style={{ borderBottom: 'none', paddingBottom: '0' }}>{profile.firstName} {profile.lastName}</h1>
          <p className="profile-role">{profile.role}</p>
          <p className="profile-company">{profile.company}</p>
        </div>
        {!isEditing && (
          <button className="edit-btn" onClick={handleEdit}>
            <FaEdit /> Edit Profile
          </button>
        )}
      </div>
      {/* Profile Content */}
      {!isEditing ? (
        <div className="profile-content">
          <div className="profile-section">
            <h2 className="section-title">Personal Information</h2>
            <div className="profile-grid">
              <div className="profile-item">
                <div className="profile-item-icon">
                  <FaUser />
                </div>
                <div className="profile-item-content">
                  <p className="item-label">Full Name</p>
                  <p className="item-value">{profile.firstName} {profile.lastName}</p>
                </div>
              </div>
              <div className="profile-item">
                <div className="profile-item-icon">
                  <FaEnvelope />
                </div>
                <div className="profile-item-content">
                  <p className="item-label">Email Address</p>
                  <p className="item-value">{profile.email}</p>
                </div>
              </div>
              <div className="profile-item">
                <div className="profile-item-icon">
                  <FaPhone />
                </div>
                <div className="profile-item-content">
                  <p className="item-label">Phone Number</p>
                  <p className="item-value">{profile.phone}</p>
                </div>
              </div>
              <div className="profile-item">
                <div className="profile-item-icon">
                  <FaMapMarkerAlt />
                </div>
                <div className="profile-item-content">
                  <p className="item-label">Location</p>
                  <p className="item-value">{profile.location}</p>
                </div>
              </div>
              <div className="profile-item">
                <div className="profile-item-icon">
                  <FaBriefcase />
                </div>
                <div className="profile-item-content">
                  <p className="item-label">Position</p>
                  <p className="item-value">{profile.role}</p>
                </div>
              </div>
              <div className="profile-item">
                <div className="profile-item-icon">
                  <FaBriefcase />
                </div>
                <div className="profile-item-content">
                  <p className="item-label">Member Since</p>
                  <p className="item-value">{profile.joinDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="profile-edit">
          <div className="profile-section">
            <h2 className="section-title">Edit Profile</h2>
            <div className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-input"
                    disabled
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-save" onClick={handleSave}>
                  <FaSave /> Save Changes
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
