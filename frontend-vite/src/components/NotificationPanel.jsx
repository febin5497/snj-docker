import React, { useState, useEffect } from 'react';
import { FaBell, FaTrash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import notificationAPI from '../api/notifications';
import '../styles/NotificationPanel.css';

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(10, 0, false);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Initial load and polling
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'attendance':
        return 'bg-blue-50 border-blue-200';
      case 'project':
        return 'bg-purple-50 border-purple-200';
      case 'staff':
        return 'bg-green-50 border-green-200';
      case 'system':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'attendance':
        return '📋';
      case 'project':
        return '📊';
      case 'staff':
        return '👥';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="notification-panel-container">
      {/* Bell Icon Button */}
      <button
        className="notification-bell-button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Notification Panel Dropdown */}
      {isOpen && (
        <div className="notification-panel-dropdown">
          <div className="notification-panel-header">
            <h3>Notifications</h3>
            <div className="notification-panel-actions">
              {notifications.length > 0 && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={handleMarkAllAsRead}
                >
                  Mark All Read
                </button>
              )}
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsOpen(false)}
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          <div className="notification-panel-content">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length > 0 ? (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${getNotificationColor(
                      notification.type
                    )} ${notification.isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="notification-actions">
                      {!notification.isRead && (
                        <button
                          className="notification-action-btn read-btn"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <FaCheckCircle size={14} />
                        </button>
                      )}
                      <button
                        className="notification-action-btn delete-btn"
                        onClick={() => handleDelete(notification.id)}
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notification-empty">
                <FaBell size={32} />
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
