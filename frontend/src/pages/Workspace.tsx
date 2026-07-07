import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiMessageSquare, FiFileText, FiUpload, FiSend, FiPlus, FiX, FiCheckSquare } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';
import useSocketStore from '../store/useSocketStore';
import api from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import styles from './Workspace.module.css';

interface CreatorShortInfo {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface NoteItem {
  _id: string;
  title: string;
  content: string;
  createdBy: CreatorShortInfo;
  updatedAt: string;
}

interface ResourceItem {
  _id: string;
  name: string;
  url: string;
  type: string;
  uploadedBy: CreatorShortInfo;
  createdAt: string;
}

interface WorkspaceData {
  _id: string;
  project: string;
  notes: NoteItem[];
  resources: ResourceItem[];
}

interface MessageItem {
  _id?: string;
  chatId: string;
  chatModel: string;
  sender: CreatorShortInfo;
  content: string;
  createdAt?: string;
}

const Workspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { socket, joinProjectRoom } = useSocketStore();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'files' | 'chat' | 'board'>('notes'); 
  
  // Chat state
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatError, setChatError] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const typingTimeoutRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Note state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // File state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    if (!user || !id) return;

    try {
      const { data } = await api.get<WorkspaceData>(`/projects/${id}/workspace`);
      setWorkspace(data);
    } catch (error) {
      console.error('Error fetching workspace', error);
    }
  }, [id, user]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !id) return;

      try {
        const { data } = await api.get<MessageItem[]>(`/projects/${id}/messages?limit=30`);
        setMessages(data);
        if (data.length < 30) {
          setHasMoreMessages(false);
        } else {
          setHasMoreMessages(true);
        }
      } catch (error) {
        console.error('Error fetching chat history', error);
      }
    };

    fetchMessages();
  }, [id, user]);

  const loadMoreMessages = async () => {
    if (messages.length === 0 || !id) return;
    const oldestMessage = messages[0];
    try {
      const { data } = await api.get<MessageItem[]>(`/projects/${id}/messages?limit=30&before=${oldestMessage.createdAt}`);
      if (data.length < 30) {
        setHasMoreMessages(false);
      }
      setMessages((prev) => [...data, ...prev]);
    } catch (error) {
      console.error('Error loading older messages', error);
    }
  };

  useEffect(() => {
    if (!socket || !id) return;
    
    joinProjectRoom(id);

    const handleReceiveMessage = (message: MessageItem) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleChatError = (error: { message: string }) => {
      setChatError(error.message || 'Chat connection issue');
    };

    const handleUserTyping = (data: { name: string; isTyping: boolean }) => {
      setTypingUser(data.isTyping ? data.name : null);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('chat_error', handleChatError);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('chat_error', handleChatError);
      socket.off('user_typing', handleUserTyping);
    };
  }, [id, socket, joinProjectRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!socket || !id) return;

    socket.emit('typing', { projectId: id, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { projectId: id, isTyping: false });
    }, 2000);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { projectId: id, isTyping: false });

    socket.emit('send_message', {
      projectId: id,
      content: newMessage
    });
    setNewMessage('');
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    try {
      await api.post(`/projects/${id}/workspace/notes`, {
        title: noteTitle, content: noteContent
      });
      setNoteTitle('');
      setNoteContent('');
      setShowNoteForm(false);
      fetchWorkspace(); // refresh notes
    } catch (error) {
      console.error('Failed to add note', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      // Upload file to server
      const { data: uploadData } = await api.post<{ name: string; url: string; type: string }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Save resource link to workspace
      await api.post(`/projects/${id}/workspace/resources`, {
        name: uploadData.name,
        url: uploadData.url,
        type: uploadData.type
      });

      fetchWorkspace(); // refresh resources
    } catch (error) {
      console.error('Failed to upload file', error);
      alert('Upload failed. Ensure backend is running and limit is 10MB.');
    } finally {
      setUploading(false);
    }
  };

  if (!workspace) return <div>Loading workspace...</div>;
  if (!user) return <div>Please log in to view this workspace.</div>;

  return (
    <div className={styles.workspaceContainer}>
      <div className={styles.sidebar}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'notes' ? styles.active : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <FiFileText /> Notes
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'files' ? styles.active : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FiUpload /> Files
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <FiMessageSquare /> Chat
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'board' ? styles.active : ''}`}
          onClick={() => setActiveTab('board')}
        >
          <FiCheckSquare /> Board
        </button>
      </div>

      <div className={styles.mainContent}>
        {activeTab === 'notes' && (
          <div className={`${styles.contentCard} card`} style={{ overflowY: 'auto' }}>
            <div className={styles.contentHeader}>
              <h2>Shared Notes</h2>
              <button className="btn btn-primary" onClick={() => setShowNoteForm(!showNoteForm)}>
                {showNoteForm ? <FiX /> : <FiPlus />} {showNoteForm ? 'Cancel' : 'New Note'}
              </button>
            </div>
            
            {showNoteForm && (
              <form onSubmit={handleAddNote} style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <input type="text" className="input-field" placeholder="Note Title" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} required style={{ marginBottom: '1rem' }} />
                <textarea className="input-field" placeholder="Note Content" value={noteContent} onChange={e => setNoteContent(e.target.value)} rows={4} style={{ marginBottom: '1rem' }}></textarea>
                <button type="submit" className="btn btn-primary">Save Note</button>
              </form>
            )}

            <div className={styles.notesList}>
              {workspace.notes.length === 0 && !showNoteForm ? (
                <p className={styles.emptyText}>No notes found. Create one!</p>
              ) : (
                workspace.notes.map(note => (
                  <div key={note._id} className={styles.noteItem}>
                    <h3>{note.title}</h3>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
                    <small>By {note.createdBy?.name || 'Unknown'}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className={`${styles.contentCard} card`}>
            <div className={styles.contentHeader}>
              <h2>Resources & Files</h2>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <FiUpload /> {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
            <div className={styles.filesList}>
              {workspace.resources.length === 0 ? (
                <p className={styles.emptyText}>No files uploaded yet.</p>
              ) : (
                workspace.resources.map(res => (
                  <div key={res._id} className={styles.fileItem}>
                    <a href={res.url} target="_blank" rel="noreferrer">{res.name}</a>
                    <small>{res.type}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className={`${styles.contentCard} card`} style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div className={styles.chatHeader}>
              <h2>Project Chat</h2>
              <span>{messages.length} saved messages</span>
            </div>
            <div className={styles.chatBody}>
              {chatError && <div className={styles.chatError}>{chatError}</div>}
              {hasMoreMessages && messages.length > 0 && (
                <button 
                  onClick={loadMoreMessages} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', marginBottom: '1rem' }}
                >
                  Load older messages
                </button>
              )}
              {messages.length === 0 && (
                <p className={styles.emptyText}>No messages yet. Start the discussion.</p>
              )}
              {messages.map((msg, index) => (
                <div key={msg._id || index} className={`${styles.message} ${msg.sender?._id === user._id ? styles.myMessage : ''}`}>
                  <span className={styles.msgSender}>{msg.sender?.name || msg.sender?.username || 'Unknown'}</span>
                  <div className={styles.msgContent}>{msg.content}</div>
                  <span className={styles.msgTime}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}
              {typingUser && (
                <div style={{ padding: '0.5rem 1rem', fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {typingUser} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className={styles.chatInputContainer}>
              <input 
                type="text" 
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="input-field"
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                <FiSend />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'board' && (
          <KanbanBoard projectId={id as string} />
        )}
      </div>
    </div>
  );
};

export default Workspace;
