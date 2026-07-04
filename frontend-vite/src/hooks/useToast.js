import { toast } from 'react-toastify';

/**
 * Custom hook for displaying toast notifications
 * @returns {Object} Object with showToast function
 */
export const useToast = () => {
  const showToast = (message, type = 'info', options = {}) => {
    const defaultOptions = {
      position: 'bottom-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    const finalOptions = { ...defaultOptions, ...options };

    switch (type) {
      case 'success':
        toast.success(message, finalOptions);
        break;
      case 'error':
        toast.error(message, finalOptions);
        break;
      case 'warning':
        toast.warning(message, finalOptions);
        break;
      case 'info':
      default:
        toast.info(message, finalOptions);
        break;
    }
  };

  return { showToast };
};

export default useToast;
