import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiBell, FiCheckCircle } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';
import useNotificationStore, { NotificationItem } from '../store/useNotificationStore';
import styles from './Navbar.module.css';

const NotificationsPanel: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const {
    requests,
    notifications,
    fetchPanelData,
    markAllRead,
    markAsRead,
    respondToRequest
  } = useNotificationStore();

  const navigate = useNavigate();

  const handleFetch = useCallback(() => {
    if (user) {
      fetchPanelData();
    }
  }, [user, fetchPanelData]);

  useEffect(() => {
    handleFetch();
    const intervalId = setInterval(handleFetch, 5000);
    return () => clearInterval(intervalId);
  }, [handleFetch]);

  const handleNotificationClick = async (item: NotificationItem) => {
    try {
      if (!item.isRead) {
        await markAsRead(item._id);
      }
      
      if (item.projectId) {
        if (item.type === 'Message') {
          navigate(`/project/${item.projectId}/workspace`);
        } else {
          navigate(`/project/${item.projectId}`);
        }
      }
    } catch (error) {
      console.error('Failed to handle notification click', error);
    }
  };

  const unreadCount = notifications.filter(item => !item.isRead).length;

  return (
    <div className={`${styles.dropdown} ${styles.notificationsDropdown}`}>
      <div className={styles.panelHeader}>
        <div>
          <h4>Notifications</h4>
          <p>{requests.length} request{requests.length === 1 ? '' : 's'} - {unreadCount} unread</p>
        </div>
        {notifications.length > 0 && (
          <button className={styles.panelIconBtn} onClick={markAllRead} title="Mark all read">
            <FiCheckCircle />
          </button>
        )}
      </div>

      <div className={styles.panelSection}>
        <h5>Requests</h5>
        {requests.length === 0 ? (
          <p className={styles.panelEmpty}>No pending requests.</p>
        ) : (
          requests.map((req) => (
            <div key={req._id} className={styles.requestItem}>
              <p>
                {req.type === 'Invite' 
                  ? `${req.sender.name} invited you to join ${req.receiverProject.name}`
                  : `${req.sender.name} wants to join ${req.receiverProject.name}`
                }
              </p>
              <div className={styles.requestActions}>
                <button className="btn btn-primary" onClick={() => respondToRequest(req._id, 'Accept')}><FiCheck /> Accept</button>
                <button className="btn btn-secondary" onClick={() => respondToRequest(req._id, 'Reject')}><FiX /> Reject</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.panelSection} style={{ marginTop: '1rem' }}>
        <h5>Updates</h5>
        {notifications.length === 0 ? (
          <p className={styles.panelEmpty}>No updates yet.</p>
        ) : (
          notifications.map((item) => (
            <div 
              key={item._id} 
              className={`${styles.notificationItem} ${!item.isRead ? styles.unreadNotification : ''}`}
              onClick={() => handleNotificationClick(item)}
              style={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
              title="Click to view"
            >
              <FiBell style={{ marginTop: '3px' }} />
              <div>
                <p style={{ margin: 0 }}>{item.content}</p>
                <span>{new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
