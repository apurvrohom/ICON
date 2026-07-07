import React, { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  useDroppable 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { FiPlus } from 'react-icons/fi';
import api from '../services/api';
import useSocketStore from '../store/useSocketStore';
import TaskCard from './TaskCard';
import TaskDetailModal from './TaskDetailModal';
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

interface KanbanBoardProps {
  projectId: string;
}

const COLUMNS: ('Todo' | 'In Progress' | 'Review' | 'Completed')[] = [
  'Todo',
  'In Progress',
  'Review',
  'Completed'
];

// Droppable list wrapper for columns
const DroppableTaskList: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={styles.taskList}>
      {children}
    </div>
  );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<TaskDetails[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const { socket, emitBoardUpdate } = useSocketStore();
  
  // Quick task creation states
  const [creatingInColumn, setCreatingInColumn] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Configure sensors with constraint so clicks still register on card elements
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get<TaskDetails[]>(`/projects/${projectId}/tasks`);
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch project tasks', error);
    }
  }, [projectId]);

  const fetchProjectDetails = useCallback(async () => {
    try {
      const { data } = await api.get<{ members: ProjectMember[] }>(`/projects/${projectId}`);
      setProjectMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch project details', error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
    fetchProjectDetails();
  }, [fetchTasks, fetchProjectDetails]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('board_updated', fetchTasks);
    
    return () => {
      socket.off('board_updated', fetchTasks);
    };
  }, [socket, fetchTasks]);

  // Handle Drag End event
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const activeTask = tasks.find(t => t._id === taskId);
    if (!activeTask) return;

    let targetStatus = over.id;
    const targetTask = tasks.find(t => t._id === over.id);
    if (targetTask) {
      targetStatus = targetTask.status;
    }

    if (!COLUMNS.includes(targetStatus)) return;

    if (activeTask.status !== targetStatus) {
      // Optimistically update locally
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: targetStatus } : t));

      try {
        const { data } = await api.put<TaskDetails>(`/projects/${projectId}/tasks/${taskId}`, {
          status: targetStatus
        });
        
        // Update state with returned data (includes activity log)
        setTasks(prev => prev.map(t => t._id === taskId ? data : t));
        emitBoardUpdate(projectId);
      } catch (error) {
        console.error('Failed to update task status on drag', error);
        // Rollback
        setTasks(prev => prev.map(t => t._id === taskId ? activeTask : t));
      }
    }
  };

  const handleAddTask = async (columnStatus: 'Todo' | 'In Progress' | 'Review' | 'Completed') => {
    if (!newTitle.trim()) {
      setCreatingInColumn(null);
      return;
    }

    try {
      const { data } = await api.post<TaskDetails>(`/projects/${projectId}/tasks`, {
        title: newTitle.trim(),
        status: columnStatus
      });
      setTasks(prev => [data, ...prev]);
      setNewTitle('');
      setCreatingInColumn(null);
      emitBoardUpdate(projectId);
    } catch (error) {
      console.error('Failed to create new task', error);
    }
  };

  const handleTaskUpdate = (updatedTask: TaskDetails) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    // If detail modal is open for this task, sync it
    if (selectedTask?._id === updatedTask._id) {
      setSelectedTask(updatedTask);
    }
    emitBoardUpdate(projectId);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
    emitBoardUpdate(projectId);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={styles.boardContainer}>
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column);
          return (
            <div key={column} className={styles.column}>
              <div className={styles.columnHeader}>
                <div className={styles.columnTitle}>
                  <span>{column}</span>
                  <span className={styles.columnCount}>{columnTasks.length}</span>
                </div>
              </div>

              <DroppableTaskList id={column}>
                <SortableContext items={columnTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                  {columnTasks.map((task) => (
                    <TaskCard 
                      key={task._id} 
                      task={task} 
                      onClick={() => setSelectedTask(task)} 
                    />
                  ))}
                </SortableContext>
              </DroppableTaskList>

              {/* Inline task creator */}
              {creatingInColumn === column ? (
                <div style={{ marginTop: '0.75rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter task title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask(column);
                      if (e.key === 'Escape') setCreatingInColumn(null);
                    }}
                    autoFocus
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleAddTask(column)}>Add</button>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setCreatingInColumn(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className={styles.addTaskBtn} onClick={() => { setCreatingInColumn(column); setNewTitle(''); }}>
                  <FiPlus /> Add Task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectMembers={projectMembers}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </DndContext>
  );
};

export default KanbanBoard;
