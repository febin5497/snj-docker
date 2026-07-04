import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import '../../styles/AttendancePhotoApprovals.css';
import {
  FaCheck,
  FaTimes,
  FaSpinner,
  FaCamera,
  FaCalendar,
  FaUser,
  FaMapMarkerAlt,
  FaClock,
  FaShieldAlt,
  FaExclamationTriangle,
  FaImage,
  FaSyncAlt,
  FaChevronLeft,
  FaInfoCircle,
} from 'react-icons/fa';

export default function AttendancePhotoApprovals() {
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved_today: 0,
    rejected_today: 0,
    total_processed: 0,
  });

  useEffect(() => {
    setFilter('pending');
    setSelectedPhoto(null);
    setRejectionReason('');
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      setFilter('pending');
      setSelectedPhoto(null);
      setRejectionReason('');
    };
  }, []);

  useEffect(() => {
    loadPendingPhotos();
  }, [filter]);

  const loadPendingPhotos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/attendance/approvals/pending');
      const photosData =
        response.data?.data || response.data?.pending || response.data || [];
      if (Array.isArray(photosData)) {
        setPhotos(photosData);
        const today = new Date().toDateString();
        const pendingCount = photosData.filter(
          (p) => p.approval_status === 'pending'
        ).length;
        const approvedToday = photosData.filter(
          (p) =>
            p.approval_status === 'approved' &&
            new Date(p.timestamp_submitted).toDateString() === today
        ).length;
        const rejectedToday = photosData.filter(
          (p) =>
            p.approval_status === 'rejected' &&
            new Date(p.timestamp_submitted).toDateString() === today
        ).length;
        setStats({
          pending: pendingCount,
          approved_today: approvedToday,
          rejected_today: rejectedToday,
          total_processed: approvedToday + rejectedToday,
        });
      } else {
        setPhotos([]);
        setStats({ pending: 0, approved_today: 0, rejected_today: 0, total_processed: 0 });
      }
    } catch (error) {
      showError(
        'Failed to load pending photos: ' +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const approvePhoto = async (photoId) => {
    try {
      setActionLoading(true);
      const response = await api.post(
        `/api/attendance/approvals/${photoId}/approve`,
        {}
      );
      if (response.data.success) {
        showSuccess('Photo approved successfully');
        loadPendingPhotos();
        setSelectedPhoto(null);
      }
    } catch (error) {
      showError('Failed to approve photo');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectPhoto = async (photoId) => {
    if (!rejectionReason.trim()) {
      showError('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(true);
      const response = await api.post(
        `/api/attendance/approvals/${photoId}/reject`,
        { rejection_reason: rejectionReason }
      );
      if (response.data.success) {
        showSuccess('Photo rejected successfully');
        loadPendingPhotos();
        setSelectedPhoto(null);
        setRejectionReason('');
      }
    } catch (error) {
      showError('Failed to reject photo');
    } finally {
      setActionLoading(false);
    }
  };

  const getPhotoUrl = (photoId) => {
    const base = api.defaults.baseURL?.replace(/\/+$/, '') || '';
    const token = localStorage.getItem('token') || '';
    return `${base}/api/attendance/photos/${photoId}?token=${encodeURIComponent(token)}`;
  };

  const formatTime = (ts) => {
    if (!ts) return 'N/A';
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullTime = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="apa-container">
        <div className="apa-loading">
          <div className="apa-loading-spinner">
            <FaSyncAlt className="apa-spin-icon" />
          </div>
          <p className="apa-loading-text">Loading attendance photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apa-container">
      {/* Page Header */}
      <div className="apa-page-header">
        <div className="apa-header-content">
          <h1 className="apa-page-title">
            <FaCamera className="apa-title-icon" />
            Attendance Photo Approvals
          </h1>
          <p className="apa-page-subtitle">
            Review and approve staff attendance verification photos
          </p>
        </div>
        <button className="apa-refresh-btn" onClick={loadPendingPhotos} title="Refresh">
          <FaSyncAlt />
        </button>
      </div>

      {/* Stats Row */}
      <div className="apa-stats-row">
        <div className="apa-stat-card apa-stat-pending">
          <div className="apa-stat-icon-wrap">
            <FaClock />
          </div>
          <div className="apa-stat-body">
            <span className="apa-stat-value">{stats.pending}</span>
            <span className="apa-stat-label">Pending</span>
          </div>
        </div>
        <div className="apa-stat-card apa-stat-approved">
          <div className="apa-stat-icon-wrap">
            <FaCheck />
          </div>
          <div className="apa-stat-body">
            <span className="apa-stat-value">{stats.approved_today}</span>
            <span className="apa-stat-label">Approved Today</span>
          </div>
        </div>
        <div className="apa-stat-card apa-stat-rejected">
          <div className="apa-stat-icon-wrap">
            <FaTimes />
          </div>
          <div className="apa-stat-body">
            <span className="apa-stat-value">{stats.rejected_today}</span>
            <span className="apa-stat-label">Rejected Today</span>
          </div>
        </div>
        <div className="apa-stat-card apa-stat-total">
          <div className="apa-stat-icon-wrap">
            <FaInfoCircle />
          </div>
          <div className="apa-stat-body">
            <span className="apa-stat-value">{stats.total_processed}</span>
            <span className="apa-stat-label">Total Processed</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="apa-filter-bar">
        <div className="apa-filter-tabs">
          {[
            { key: 'pending', label: 'Pending', icon: FaClock },
            { key: 'approved', label: 'Approved', icon: FaCheck },
            { key: 'rejected', label: 'Rejected', icon: FaTimes },
            { key: 'all', label: 'All', icon: FaInfoCircle },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`apa-filter-tab ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="apa-empty-state">
          <div className="apa-empty-icon">
            <FaCamera />
          </div>
          <h3>No photos found</h3>
          <p>
            {filter === 'pending'
              ? 'No pending attendance photos awaiting review.'
              : `No ${filter} photos to display.`}
          </p>
        </div>
      ) : (
        <div className="apa-photo-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="apa-photo-card"
              onClick={() => {
                setSelectedPhoto(photo);
                setRejectionReason('');
              }}
            >
              <div className="apa-photo-thumb">
                <img
                  src={getPhotoUrl(photo.id)}
                  alt="Attendance"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%23e2e8f0" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23a0aec0" font-size="14" font-family="sans-serif">No Image</text></svg>';
                  }}
                />
                <span
                  className={`apa-status-chip apa-status-${photo.approval_status}`}
                >
                  {photo.approval_status}
                </span>
              </div>
              <div className="apa-photo-meta">
                <div className="apa-meta-staff">
                  <div className="apa-avatar-sm">
                    {getInitials(photo.staff_name)}
                  </div>
                  <div className="apa-meta-text">
                    <span className="apa-meta-name">
                      {photo.staff_name || 'Unknown'}
                    </span>
                    <span className="apa-meta-time">
                      <FaClock size={10} />
                      {formatTime(photo.timestamp_captured)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedPhoto && (
        <div
          className="apa-modal-overlay"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="apa-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Top Bar */}
            <div className="apa-modal-topbar">
              <button
                className="apa-modal-back"
                onClick={() => setSelectedPhoto(null)}
              >
                <FaChevronLeft /> Back
              </button>
              <span className="apa-modal-id">#{selectedPhoto.id}</span>
            </div>

            {/* Modal Photo Section */}
            <div className="apa-modal-photo">
              <img
                src={getPhotoUrl(selectedPhoto.id)}
                alt="Attendance Photo"
                onError={(e) => {
                  e.target.src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect fill="%23e2e8f0" width="600" height="400"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23a0aec0" font-size="18" font-family="sans-serif">Photo Unavailable</text></svg>';
                }}
              />
              <span
                className={`apa-modal-badge apa-status-${selectedPhoto.approval_status}`}
              >
                {selectedPhoto.approval_status === 'pending' && (
                  <FaExclamationTriangle size={11} />
                )}
                {selectedPhoto.approval_status === 'approved' && (
                  <FaCheck size={11} />
                )}
                {selectedPhoto.approval_status === 'rejected' && (
                  <FaTimes size={11} />
                )}
                {selectedPhoto.approval_status}
              </span>
            </div>

            {/* Modal Details */}
            <div className="apa-modal-details">
              {/* Staff Info */}
              <div className="apa-detail-block">
                <div className="apa-detail-header">
                  <FaUser className="apa-detail-icon" />
                  <span>Staff Information</span>
                </div>
                <div className="apa-detail-grid">
                  <div className="apa-detail-item">
                    <span className="apa-detail-key">Name</span>
                    <span className="apa-detail-val">
                      {selectedPhoto.staff_name}
                    </span>
                  </div>
                  <div className="apa-detail-item">
                    <span className="apa-detail-key">Staff ID</span>
                    <span className="apa-detail-val">
                      {selectedPhoto.staff_id}
                    </span>
                  </div>
                  <div className="apa-detail-item">
                    <span className="apa-detail-key">Role</span>
                    <span className="apa-detail-val">
                      {selectedPhoto.staff_role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamp Info */}
              <div className="apa-detail-block">
                <div className="apa-detail-header">
                  <FaClock className="apa-detail-icon" />
                  <span>Timestamp</span>
                </div>
                <div className="apa-detail-grid">
                  <div className="apa-detail-item">
                    <span className="apa-detail-key">Captured</span>
                    <span className="apa-detail-val">
                      {formatFullTime(selectedPhoto.timestamp_captured)}
                    </span>
                  </div>
                  <div className="apa-detail-item">
                    <span className="apa-detail-key">Submitted</span>
                    <span className="apa-detail-val">
                      {formatFullTime(selectedPhoto.timestamp_submitted)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="apa-detail-block">
                <div className="apa-detail-header">
                  <FaMapMarkerAlt className="apa-detail-icon" />
                  <span>Location</span>
                </div>
                {selectedPhoto.latitude || selectedPhoto.longitude ? (
                  <div className="apa-detail-grid">
                    <div className="apa-detail-item">
                      <span className="apa-detail-key">Latitude</span>
                      <span className="apa-detail-val apa-mono">
                        {selectedPhoto.latitude?.toFixed(6)}
                      </span>
                    </div>
                    <div className="apa-detail-item">
                      <span className="apa-detail-key">Longitude</span>
                      <span className="apa-detail-val apa-mono">
                        {selectedPhoto.longitude?.toFixed(6)}
                      </span>
                    </div>
                    {selectedPhoto.location_accuracy && (
                      <div className="apa-detail-item">
                        <span className="apa-detail-key">Accuracy</span>
                        <span className="apa-detail-val apa-mono">
                          {selectedPhoto.location_accuracy?.toFixed(1)}m
                        </span>
                      </div>
                    )}
                    <div className="apa-detail-item apa-map-link">
                      <a
                        href={`https://maps.google.com/?q=${selectedPhoto.latitude},${selectedPhoto.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaMapMarkerAlt /> View on Google Maps
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="apa-detail-empty">
                    No location data available
                  </div>
                )}
              </div>

              {/* Status Info */}
              {selectedPhoto.approval_status !== 'pending' && (
                <div className="apa-detail-block">
                  <div className="apa-detail-header">
                    <FaShieldAlt className="apa-detail-icon" />
                    <span>Review Details</span>
                  </div>
                  <div className="apa-detail-grid">
                    {selectedPhoto.approved_by && (
                      <div className="apa-detail-item">
                        <span className="apa-detail-key">Approved By</span>
                        <span className="apa-detail-val">
                          Staff {selectedPhoto.approved_by}
                        </span>
                      </div>
                    )}
                    {selectedPhoto.approved_at && (
                      <div className="apa-detail-item">
                        <span className="apa-detail-key">Approved At</span>
                        <span className="apa-detail-val">
                          {formatFullTime(selectedPhoto.approved_at)}
                        </span>
                      </div>
                    )}
                    {selectedPhoto.rejected_by && (
                      <div className="apa-detail-item">
                        <span className="apa-detail-key">Rejected By</span>
                        <span className="apa-detail-val">
                          Staff {selectedPhoto.rejected_by}
                        </span>
                      </div>
                    )}
                    {selectedPhoto.rejected_at && (
                      <div className="apa-detail-item">
                        <span className="apa-detail-key">Rejected At</span>
                        <span className="apa-detail-val">
                          {formatFullTime(selectedPhoto.rejected_at)}
                        </span>
                      </div>
                    )}
                    {selectedPhoto.rejection_reason && (
                      <div className="apa-detail-item apa-full-width">
                        <span className="apa-detail-key">Rejection Reason</span>
                        <span className="apa-detail-val apa-reason-text">
                          {selectedPhoto.rejection_reason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Rejection Form (only for pending) */}
            {selectedPhoto.approval_status === 'pending' && (
              <div className="apa-rejection-area">
                <label className="apa-rejection-label">
                  Rejection Reason
                  <span className="apa-rejection-hint">
                    (required if rejecting)
                  </span>
                </label>
                <textarea
                  className="apa-rejection-input"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={3}
                />
              </div>
            )}

            {/* Modal Actions */}
            {selectedPhoto.approval_status === 'pending' && (
              <div className="apa-modal-actions">
                <button
                  className="apa-btn apa-btn-reject"
                  onClick={() => rejectPhoto(selectedPhoto.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <FaSpinner className="apa-spin-icon" />
                  ) : (
                    <FaTimes />
                  )}
                  Reject
                </button>
                <button
                  className="apa-btn apa-btn-approve"
                  onClick={() => approvePhoto(selectedPhoto.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <FaSpinner className="apa-spin-icon" />
                  ) : (
                    <FaCheck />
                  )}
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
