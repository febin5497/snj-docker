import { useState, createContext, useContext } from 'react'
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa'

// Create Toast Context
const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

// Toast Provider Component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now()
    const newToast = { id, message, type }

    setToasts(prev => [...prev, newToast])

    if (duration) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (message, duration) => addToast(message, 'success', duration)
  const showError = (message, duration) => addToast(message, 'error', duration)
  const showInfo = (message, duration) => addToast(message, 'info', duration)
  const showWarning = (message, duration) => addToast(message, 'warning', duration)

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Toast Container Component
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Individual Toast Component
function Toast({ toast, onClose }) {
  const getStyles = () => {
    const baseStyles = 'flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-md border animate-slide-in'
    const typeStyles = {
      success: 'bg-green-500 bg-opacity-90 border-green-400 text-white',
      error: 'bg-red-500 bg-opacity-90 border-red-400 text-white',
      info: 'bg-blue-500 bg-opacity-90 border-blue-400 text-white',
      warning: 'bg-yellow-500 bg-opacity-90 border-yellow-400 text-white'
    }
    return `${baseStyles} ${typeStyles[toast.type] || typeStyles.info}`
  }

  const getIcon = () => {
    const iconProps = { className: 'text-xl flex-shrink-0 mt-0.5' }
    const icons = {
      success: <FaCheckCircle {...iconProps} />,
      error: <FaExclamationCircle {...iconProps} />,
      info: <FaInfoCircle {...iconProps} />,
      warning: <FaExclamationCircle {...iconProps} />
    }
    return icons[toast.type] || icons.info
  }

  return (
    <div className={getStyles()}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-xl opacity-70 hover:opacity-100 transition-opacity"
      >
        <FaTimes />
      </button>
    </div>
  )
}
