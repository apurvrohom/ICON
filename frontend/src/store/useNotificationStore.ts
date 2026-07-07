import { create } from 'zustand';
import api from '../services/api';

export interface RequestItem {
  _id: string;
  sender: {
    _id: string;
    name: string;
    username: string;
  };
  receiverProject: {
    _id: string;
    name: string;
  };
  type: 'Invite' | 'Join' | 'Collab';
  status: 'Pending' | 'Accepted' | 'Rejected';
}

export interface NotificationItem {
  _id: string;
  content: string;
  type: string;
  projectId?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  requests: RequestItem[];
  notifications: NotificationItem[];
  loading: boolean;
  fetchPanelData: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  respondToRequest: (requestId: string, action: 'Accept' | 'Reject') => Promise<void>;
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  requests: [],
  notifications: [],
  loading: false,

  fetchPanelData: async () => {
    try {
      const [{ data: requestData }, { data: notificationData }] = await Promise.all([
        api.get<RequestItem[]>('/requests'),
        api.get<NotificationItem[]>('/notifications')
      ]);
      set({ requests: requestData, notifications: notificationData });
    } catch (error) {
      console.error('Error fetching notification store data', error);
    }
  },

  markAllRead: async () => {
    try {
      await api.put('/notifications/read-all', {});
      await get().fetchPanelData();
    } catch (error) {
      console.error('Failed to mark all notifications read', error);
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      await get().fetchPanelData();
    } catch (error) {
      console.error('Failed to mark notification read', error);
    }
  },

  respondToRequest: async (requestId, action) => {
    try {
      await api.put(`/requests/${requestId}`, { action });
      await get().fetchPanelData();
    } catch (error) {
      console.error(`Failed to ${action} request`, error);
    }
  }
}));

export default useNotificationStore;
