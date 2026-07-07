import React, { useState } from 'react';
import { FiX, FiCheckSquare, FiPlus, FiTrash2, FiMessageSquare, FiActivity, FiUser, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import styles from './Kanban.module.css';

interface UserShortInfo {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface ProjectMember {
  user: UserShortInfo;
  role: string;
}

interface TaskComment {
  _id: string;
  user: UserShortInfo;
  content: string;
  createdAt: string;
}

interface TaskChecklistItem {
  _id: string;
  text: string;
  isCompleted: boolean;
}

interface TaskActivity {
  _id: string;
  action: string;
  user: UserShortInfo;
  createdAt: string;
}

interface TaskDetails {
  _id: string;
  project: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  labels: string[];
  dueDate?: string;
  assignee?: UserShortInfo;
  comments: TaskComment[];
  checklist: TaskChecklistItem[];
  activityHistory: TaskActivity[];
}

interface TaskDetailModalProps {
  task: TaskDetails;
  projectMembers: ProjectMember[];
  onClose: () => void;
  onUpdate: (updatedTask: TaskDetails) => void;
  onDelete: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  projectMembers,
  onClose,
  onUpdate,
  onDelete
}) => {
  const currentUser = useAuthStore((state) => state.user);
  
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assignee?._id || '');
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.substring(0, 10) : '');
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>(task.labels || []);
  
  // Checklist input
  const [newChecklistText, setNewChecklistText] = useState('');
  
  // Comment input
  const [commentText, setCommentText] = useState('');

  const [saving, setSaving] = useState(false);

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const { data } = await api.put<TaskDetails>(`/projects/${task.project}/tasks/${task._id}`, {
        title,
        description,
        status,
        priority,
        assignee: assigneeId || null,
        dueDate: dueDate || null,
        labels
      });
      onUpdate(data);
    } catch (error) {
      console.error('Failed to update task details', error);
      alert('Failed to save task updates');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const { data } = await api.post<TaskDetails>(`/projects/${task.project}/tasks/${task._id}/comments`, {
        content: commentText
      });
      setCommentText('');
      onUpdate(data);
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    try {
      const { data } = await api.post<TaskDetails>(`/projects/${task.project}/tasks/${task._id}/checklist`, {
        text: newChecklistText
      });
      setNewChecklistText('');
      onUpdate(data);
    } catch (error) {
      console.error('Failed to add checklist item', error);
    }
  };

  const handleToggleChecklist = async (itemId: string, isCompleted: boolean) => {
    try {
      const { data } = await api.put<TaskDetails>(`/projects/${task.project}/tasks/${task._id}/checklist/${itemId}`, {
        isCompleted
      });
      onUpdate(data);
    } catch (error) {
      console.error('Failed to toggle checklist item', error);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      const { data } = await api.delete<TaskDetails>(`/projects/${task.project}/tasks/${task._id}/checklist/${itemId}`);
      onUpdate(data);
    } catch (error) {
      console.error('Failed to delete checklist item', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/projects/${task.project}/tasks/${task._id}`);
      onDelete(task._id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task', error);
      alert('Failed to delete task');
    }
  };

  const handleAddLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      const updatedLabels = [...labels, labelInput.trim()];
      setLabels(updatedLabels);
      setLabelInput('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    const updatedLabels = labels.filter(l => l !== labelToRemove);
    setLabels(updatedLabels);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleSection}>
            <input 
              type="text" 
              className={styles.modalTitleInput} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveDetails}
              title="Click to rename task"
            />
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              in list <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{task.status}</span>
            </p>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          
          {/* Main Column */}
          <div className={styles.mainColumn}>
            
            {/* Description */}
            <div>
              <h3 className={styles.sectionTitle}>Description</h3>
              <textarea
                className="input-field"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveDetails}
                placeholder="Add a detailed description for this task..."
                style={{ width: '100%' }}
              />
            </div>

            {/* Checklist */}
            <div>
              <h3 className={styles.sectionTitle}>
                <FiCheckSquare /> Checklist
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {task.checklist.map((item) => (
                  <div key={item._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={item.isCompleted} 
                        onChange={(e) => handleToggleChecklist(item._id, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ textDecoration: item.isCompleted ? 'line-through' : 'none', color: item.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {item.text}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteChecklistItem(item._id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}
                      title="Delete item"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Add checklist item..." 
                  value={newChecklistText} 
                  onChange={(e) => setNewChecklistText(e.target.value)} 
                />
                <button type="submit" className="btn btn-secondary">
                  <FiPlus /> Add
                </button>
              </form>
            </div>

            {/* Comments */}
            <div>
              <h3 className={styles.sectionTitle}>
                <FiMessageSquare /> Discussion
              </h3>
              
              <form onSubmit={handleAddComment} className={styles.commentInputGroup}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Comment</button>
              </form>

              <div className={styles.commentsSection}>
                {task.comments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No comments yet. Start the discussion!</p>
                ) : (
                  task.comments.map((comment) => (
                    <div key={comment._id} className={styles.commentItem}>
                      <div className={styles.assigneeAvatar} style={{ flexShrink: 0 }}>
                        {comment.user.profilePicture ? (
                          <img src={comment.user.profilePicture} alt="Avatar" />
                        ) : (
                          comment.user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span className={styles.commentUser}>{comment.user.name}</span>
                          <span className={styles.commentTime}>
                            {new Date(comment.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className={styles.commentContent}>{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Side Column */}
          <div className={styles.sideColumn}>
            <h3 className={styles.sectionTitle}>Task Metadata</h3>

            {/* Status */}
            <div className={styles.metaItem}>
              <label>Status</label>
              <select 
                className="input-field" 
                value={status} 
                onChange={(e) => { setStatus(e.target.value as any); setTimeout(handleSaveDetails, 100); }}
                style={{ width: '100%' }}
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div className={styles.metaItem}>
              <label>Priority</label>
              <select 
                className="input-field" 
                value={priority} 
                onChange={(e) => { setPriority(e.target.value as any); setTimeout(handleSaveDetails, 100); }}
                style={{ width: '100%' }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Assignee */}
            <div className={styles.metaItem}>
              <label>Assignee</label>
              <select 
                className="input-field" 
                value={assigneeId} 
                onChange={(e) => { setAssigneeId(e.target.value); setTimeout(handleSaveDetails, 100); }}
                style={{ width: '100%' }}
              >
                <option value="">Unassigned</option>
                {projectMembers.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.name} (@{m.user.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className={styles.metaItem}>
              <label>
                <FiCalendar /> Due Date
              </label>
              <input 
                type="date" 
                className="input-field"
                value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); setTimeout(handleSaveDetails, 100); }}
                style={{ width: '100%' }}
              />
            </div>

            {/* Labels */}
            <div className={styles.metaItem}>
              <label>Labels</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                {labels.map((l) => (
                  <span key={l} className={styles.labelTag} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {l}
                    <FiX 
                      size={10} 
                      onClick={() => { handleRemoveLabel(l); setTimeout(handleSaveDetails, 100); }} 
                      style={{ cursor: 'pointer' }}
                    />
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="New label..." 
                  value={labelInput} 
                  onChange={(e) => setLabelInput(e.target.value)} 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                />
                <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => { handleAddLabel(); setTimeout(handleSaveDetails, 100); }}>
                  +
                </button>
              </div>
            </div>

            {/* Task Action Activity History */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <FiActivity /> History
              </label>
              <div className={styles.activityList}>
                {task.activityHistory.map((act) => (
                  <div key={act._id} className={styles.activityItem}>
                    {act.action}
                    <span>{new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <button 
              className="btn btn-secondary" 
              style={{ color: 'var(--danger-color)', border: '1px solid var(--danger-color)', background: 'transparent', width: '100%', marginTop: '1rem' }}
              onClick={handleDeleteTask}
            >
              <FiTrash2 /> Delete Task
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TaskDetailModal;
