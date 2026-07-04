import React from 'react'
import './ErrorBoundary.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Log to backend
    this.logErrorToBackend(error, errorInfo)
  }

  logErrorToBackend = async (error, errorInfo) => {
    try {
      const errorLog = {
        code: 'REACT_ERROR',
        message: error.toString(),
        component: errorInfo.componentStack,
        stack: error.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }

      // TODO: Send to /api/client-logs when endpoint is ready
      console.log('React error logged:', errorLog)
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <div className="error-boundary-icon">⚠️</div>
            
            <h1>Oops! Something went wrong</h1>
            
            <p className="error-boundary-message">
              We're sorry for the inconvenience. An unexpected error occurred while using the application.
            </p>

            {this.state.error && (
              <div className="error-boundary-code">
                Error: {this.state.error.toString()}
              </div>
            )}

            <div className="error-boundary-actions">
              <button 
                className="btn btn-primary"
                onClick={this.handleReset}
              >
                ↻ Try Again
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={this.handleGoHome}
              >
                🏠 Go to Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <>
                <button 
                  className="btn-details"
                  onClick={this.toggleDetails}
                >
                  {this.state.showDetails ? '▼' : '▶'} Details
                </button>

                {this.state.showDetails && (
                  <details className="error-boundary-details">
                    <summary>Error Stack Trace (Development Only)</summary>
                    <pre className="error-stack">
                      {this.state.error && this.state.error.stack}
                    </pre>
                    <pre className="error-component">
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
