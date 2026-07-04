/**
 * Frontend Error Handler Utility
 * Manages error parsing, retry logic, and logging
 */

/**
 * Parse error response from API
 */
export const parseErrorResponse = (error) => {
  if (error.response?.data?.error) {
    return {
      code: error.response.data.error.code || 'UNKNOWN',
      message: error.response.data.error.message || 'An error occurred',
      details: error.response.data.error.details || {},
      timestamp: error.response.data.error.timestamp,
      requestId: error.response.data.error.request_id,
      status: error.response.status
    }
  }

  if (error.message) {
    return {
      code: 'NETWORK_ERROR',
      message: error.message,
      details: {},
      status: 0
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: {},
    status: null
  }
}

/**
 * Check if error is transient (should retry)
 */
const isTransientError = (error) => {
  const parsed = parseErrorResponse(error)
  const status = parsed.status

  // Network errors are transient
  if (status === 0) return true

  // 5xx and 429 are transient
  if (status >= 500 || status === 429) return true

  // 408 Request Timeout
  if (status === 408) return true

  return false
}

/**
 * Check if should retry the request
 * Called from API interceptor with current retry count and max retries
 */
export const shouldRetry = (error, currentAttempt = 0, maxAttempts = 3) => {
  if (!isTransientError(error)) return false
  if (currentAttempt >= maxAttempts) return false
  return true
}

/**
 * Get retry delay using exponential backoff
 * 1000ms (1s), 2000ms (2s), 4000ms (4s), etc.
 */
export const getRetryDelay = (attemptNumber) => {
  return Math.pow(2, attemptNumber) * 1000
}

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
  const parsed = parseErrorResponse(error)

  const errorMessages = {
    'AUTH_001': 'Invalid email or password',
    'AUTH_002': 'Your session has expired, please login again',
    'AUTH_003': 'Your account is inactive',
    'VAL_001': 'Please check your input and try again',
    'VAL_002': 'Some required fields are missing',
    'PERM_001': 'You don\'t have permission to perform this action',
    'RES_001': 'The requested resource was not found',
    'CONF_001': 'This resource already exists',
    'NETWORK_ERROR': 'Network connection failed, please check your internet',
    'UNKNOWN_ERROR': 'Something went wrong, please try again'
  }

  return errorMessages[parsed.code] || parsed.message || 'An error occurred'
}

/**
 * Format error for display in UI
 */
export const formatErrorForDisplay = (error) => {
  const parsed = parseErrorResponse(error)
  return {
    code: parsed.code,
    message: getErrorMessage(error),
    details: parsed.details,
    requestId: parsed.requestId,
    isRetryable: isTransientError(error)
  }
}

/**
 * Log error to backend for monitoring
 * This sends frontend errors to the backend for analysis and monitoring
 */
export const logErrorToBackend = async (error, context = '', additionalInfo = {}) => {
  try {
    const parsed = parseErrorResponse(error)
    
    const errorLog = {
      code: parsed.code,
      message: parsed.message,
      details: parsed.details,
      context,
      additionalInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      requestId: parsed.requestId
    }

    // Send to backend for monitoring (don't block on failure)
    try {
      await fetch('/api/client-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog)
      }).catch(() => {
        // Silently fail - don't let logging errors break the app
        console.debug('Failed to send error log to backend')
      })
    } catch (fetchError) {
      // Silently fail
      console.debug('Error logging disabled or unavailable')
    }
  } catch (logError) {
    console.error('Failed to log error to backend:', logError)
  }
}
