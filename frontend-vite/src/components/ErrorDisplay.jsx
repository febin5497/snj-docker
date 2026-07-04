import React, { useState, useEffect } from 'react'
import './ErrorDisplay.css'

const ErrorDisplay = ({
  error,
  type = 'error', // 'error', 'warning', 'info', 'success'
  onDismiss,
  autoClose = true,
  autoCloseDuration = 5000,
  showRequestId = false,
  onRetry
}) => {
  const [isVisible, setIsVisible] = useState(!!error)

  useEffect(() => {
    setIsVisible(!!error)

    if (autoClose && error) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss && onDismiss()
      }, autoCloseDuration)

      return () => clearTimeout(timer)
    }
  }, [error, autoClose, autoCloseDuration, onDismiss])

  const handleClose = () => {
    setIsVisible(false)
    onDismiss && onDismiss()
  }

  if (!isVisible || !error) {
    return null
  }

  const errorMessage = error.message || error.toString()
  const errorCode = error.code || error.error?.code || 'UNKNOWN'
  const errorDetails = error.details || error.error?.details || {}
  const requestId = error.request_id || error.requestId

  const typeConfig = {
    error: { icon: '❌', bgColor: '#ffebee', borderColor: '#e74c3c', textColor: '#c0392b' },
    warning: { icon: '⚠️', bgColor: '#fff3e0', borderColor: '#f39c12', textColor: '#d68910' },
    info: { icon: 'ℹ️', bgColor: '#e3f2fd', borderColor: '#3498db', textColor: '#2980b9' },
    success: { icon: '✓', bgColor: '#e8f5e9', borderColor: '#27ae60', textColor: '#229954' }
  }

  const config = typeConfig[type] || typeConfig.error

  return (
    <div
      className={`error-display error-display-${type}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.textColor
      }}
    >
      <div className="error-display-content">
        <div className="error-display-icon">{config.icon}</div>

        <div className="error-display-message-wrapper">
          <div className="error-display-code">{errorCode}</div>
          <div className="error-display-message">{errorMessage}</div>

          {Object.keys(errorDetails).length > 0 && (
            <div className="error-display-details">
              {Object.entries(errorDetails).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {JSON.stringify(value)}
                </p>
              ))}
            </div>
          )}

          {showRequestId && requestId && (
            <div className="error-display-request-id">
              Request ID: <code>{requestId}</code>
            </div>
          )}
        </div>

        <div className="error-display-actions">
          {onRetry && (
            <button
              className="error-display-btn error-display-btn-retry"
              onClick={onRetry}
              style={{ color: config.textColor, borderColor: config.textColor }}
            >
              ↻ Retry
            </button>
          )}

          <button
            className="error-display-btn error-display-btn-close"
            onClick={handleClose}
            style={{ color: config.textColor }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorDisplay
