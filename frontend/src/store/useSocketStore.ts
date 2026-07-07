import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import useNotificationStore from './useNotificationStore';

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  joinProjectRoom: (projectId: string) => void;
  leaveProjectRoom: (projectId: string) => void;
  emitBoardUpdate: (projectId: string) => void;
  emitTyping: (projectId: string, isTyping: boolean) => void;
}

const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: (token) => {
    // If socket already connected, do nothing
    if (get().socket) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Global socket connected:', newSocket.id);
    });

    // Listen for live notifications
    newSocket.on('notification_received', (notification) => {
      console.log('Real-time notification received:', notification);
      
      // Access useNotificationStore state and add it
      const { fetchPanelData } = useNotificationStore.getState();
      fetchPanelData(); // Refresh notifications and requests
      
      // Play a premium sound or display a toast
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (err) {}
    });

    newSocket.on('user_online', (data: { userId: string }) => {
      set((state) => ({
        onlineUsers: [...new Set([...state.onlineUsers, data.userId])]
      }));
    });

    newSocket.on('user_offline', (data: { userId: string }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.filter(id => id !== data.userId)
      }));
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const s = get().socket;
    if (s) {
      s.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },

  joinProjectRoom: (projectId) => {
    const s = get().socket;
    if (s) {
      s.emit('join_project', projectId);
    }
  },

  leaveProjectRoom: (projectId) => {
    // Socket.io automatically leaves rooms on disconnect, but we can emit a leave event if we need custom tracking
  },

  emitBoardUpdate: (projectId) => {
    const s = get().socket;
    if (s) {
      s.emit('board_update', { projectId });
    }
  },

  emitTyping: (projectId, isTyping) => {
    const s = get().socket;
    if (s) {
      s.emit('typing', { projectId, isTyping });
    }
  }
}));

export default useSocketStore;
