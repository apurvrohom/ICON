import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiCheckSquare, FiMessageSquare, FiUser } from 'react-icons/fi';
import styles from './Kanban.module.css';

interface UserShortInfo {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
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
}

interface TaskCardProps {
  task: TaskDetails;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const getPriorityClass = () => {
    switch (task.priority) {
      case 'Low': return styles.priorityLow;
      case 'Medium': return styles.priorityMedium;
      case 'High': return styles.priorityHigh;
      default: return '';
    }
  };

  // Calculate checklist progress
  const totalChecklist = task.checklist?.length || 0;
  const completedChecklist = task.checklist?.filter(item => item.isCompleted).length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.card}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <span className={`${styles.priorityBadge} ${getPriorityClass()}`}>
          {task.priority}
        </span>
      </div>

      <h4 className={styles.taskTitle}>{task.title}</h4>

      {task.labels && task.labels.length > 0 && (
        <div className={styles.labels}>
          {task.labels.map((label) => (
            <span key={label} className={styles.labelTag}>
              {label}
            </span>
          ))}
        </div>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.stats}>
          {totalChecklist > 0 && (
            <div className={styles.statItem} title="Checklist progress">
              <FiCheckSquare size={13} />
              <span>{completedChecklist}/{totalChecklist}</span>
            </div>
          )}
          {task.comments?.length > 0 && (
            <div className={styles.statItem} title="Discussion comments">
              <FiMessageSquare size={13} />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>

        <div className={styles.assigneeAvatar} title={task.assignee ? `Assigned to ${task.assignee.name}` : 'Unassigned'}>
          {task.assignee ? (
            task.assignee.profilePicture ? (
              <img src={task.assignee.profilePicture} alt={task.assignee.name} />
            ) : (
              task.assignee.name.charAt(0).toUpperCase()
            )
          ) : (
            <FiUser size={12} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
