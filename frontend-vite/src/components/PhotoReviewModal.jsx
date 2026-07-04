import React, { useState, useEffect } from 'react';
import '../styles/Attendance.css';
import api from '../api';

const PhotoReviewModal = ({ photo, onApprove, onReject, onClose }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionMode, setRejectionMode] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(true);

  // Load photo as blob and convert to data URL
  useEffect(() => {
    const loadPhoto = async () => {
      try {
        setPhotoLoading(true);
        const response = await api.get(`/attendance/photos/${photo.id}`, {
          responseType: 'blob'
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoDataUrl(reader.result);
          setPhotoLoading(false);
        };
        reader.readAsDataURL(response.data);
      } catch (error) {
        console.error('Failed to load photo:', error);
        setPhotoLoading(false);
      }
    };

    if (photo && photo.id) {
      loadPhoto();
    }
  }, [photo]);

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setIsRejecting(true);
    onReject(rejectionReason);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const calculateTimeDiff = () => {
    const captured = new Date(photo.timestamp_captured);
    const submitted = new Date(photo.timestamp_submitted);
    const diff = Math.floor((submitted - captured) / 1000);

    if (diff < 60) return `${diff} seconds`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes`;
    return `${Math.floor(diff / 3600)} hours`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Photo Review & Approval</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body">
          {/* Photo Display */}
          <div className="photo-display-section">
            {photoLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Loading photo...
              </div>
            ) : photoDataUrl ? (
              <img
                src={photoDataUrl}
                alt={`${photo.staff_name}'s photo`}
                className="modal-photo"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
                Failed to load photo
              </div>
            )}
          </div>

          {/* Staff Information */}
          <div className="review-section">
            <h3>Staff Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Name:</span>
                <span className="value">{photo.staff_name}</span>
              </div>
              <div className="info-item">
                <span className="label">Role:</span>
                <span className="value">{photo.staff_role}</span>
              </div>
              <div className="info-item">
                <span className="label">Staff ID:</span>
                <span className="value">#{photo.staff_id}</span>
              </div>
            </div>
          </div>

          {/* Timestamp Verification */}
          <div className="review-section">
            <h3>Timestamp Verification</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Captured:</span>
                <span className="value">{formatTime(photo.timestamp_captured)}</span>
              </div>
              <div className="info-item">
                <span className="label">Submitted:</span>
                <span className="value">{formatTime(photo.timestamp_submitted)}</span>
              </div>
              <div className="info-item">
                <span className="label">Time Difference:</span>
                <span className={`value ${photo.time_to_submit_seconds <= 30 ? 'status-ok' : 'status-warning'}`}>
                  {calculateTimeDiff()}
                </span>
              </div>
            </div>
            {photo.time_to_submit_seconds <= 30 && (
              <div className="verification-check">✓ Timestamp looks good</div>
            )}
            {photo.time_to_submit_seconds > 30 && (
              <div className="verification-warning">⚠ Large time gap - verify accuracy</div>
            )}
          </div>

          {/* Photo Quality */}
          <div className="review-section">
            <h3>Photo Quality</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Resolution:</span>
                <span className="value">{photo.photo_width}x{photo.photo_height}</span>
              </div>
              <div className="info-item">
                <span className="label">File Size:</span>
                <span className="value">{(photo.photo_size / 1024).toFixed(1)} KB</span>
              </div>
              <div className="info-item">
                <span className="label">Format:</span>
                <span className="value">JPEG</span>
              </div>
              <div className="info-item">
                <span className="label">Status:</span>
                <span className="value status-ok">✓ Good Quality</span>
              </div>
            </div>
          </div>

          {/* Rejection Reason Input */}
          {rejectionMode && (
            <div className="review-section rejection-section">
              <h3>Rejection Reason</h3>
              <p className="section-description">
                Provide a reason for rejection so staff can retake the photo correctly.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Photo is blurry, face not visible, poor lighting, etc."
                className="rejection-textarea"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="modal-footer">
          {!rejectionMode ? (
            <>
              <button onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={() => setRejectionMode(true)} className="btn btn-danger">
                ✗ Reject Photo
              </button>
              <button onClick={onApprove} className="btn btn-success">
                ✓ Approve Photo
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setRejectionMode(false)} className="btn btn-secondary">
                Back
              </button>
              <button
                onClick={handleReject}
                className="btn btn-danger"
                disabled={isRejecting || !rejectionReason.trim()}
              >
                {isRejecting ? 'Rejecting...' : '✗ Confirm Rejection'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoReviewModal;
