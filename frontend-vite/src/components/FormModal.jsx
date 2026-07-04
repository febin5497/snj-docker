import { FaTimes, FaSpinner } from "react-icons/fa"

export default function FormModal({ isOpen, title, onClose, onSubmit, isLoading, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-0">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full sm:mx-4 mx-0 overflow-hidden max-h-[90vh] sm:max-h-none flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 min-h-10 min-w-10 flex items-center justify-center"
            aria-label="Close modal"
          >
            <FaTimes size={20} className="sm:w-6 sm:h-6 w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0 flex-wrap">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 sm:px-6 py-2 sm:py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm sm:text-base min-h-10"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="px-4 sm:px-6 py-2 sm:py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm sm:text-base min-h-10"
          >
            {isLoading && <FaSpinner className="animate-spin" />}
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
