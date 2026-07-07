import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiFolder, FiUsers, FiCompass, FiCheckSquare, FiMessageSquare } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import styles from './Dashboard.module.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface ProjectMember {
  user: any;
  role: string;
}

interface ProjectData {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  tags?: string[];
  creator: any;
  members?: ProjectMember[];
}

interface TaskData {
  _id: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
}

const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const getUserId = (value: any): string => {
    return value?._id || value || '';
  };

  const isUserProject = (project: ProjectData) => {
    const creatorId = getUserId(project.creator);
    const isCreator = creatorId === user?._id;
    const isMember = project.members?.some(member => getUserId(member.user) === user?._id);
    return isCreator || isMember;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch all projects
        const { data: projectData } = await api.get<ProjectData[]>('/projects');
        setProjects(projectData);
        
        const myProjects = projectData.filter(isUserProject);

        // 2. Fetch tasks for all my projects in parallel
        if (myProjects.length > 0) {
          const taskPromises = myProjects.map(p => 
            api.get<TaskData[]>(`/projects/${p._id}/tasks`).catch(() => ({ data: [] as TaskData[] }))
          );
          const taskResponses = await Promise.all(taskPromises);
          const allTasks = taskResponses.flatMap(res => res.data);
          setTasks(allTasks);
        }

        // 3. Fetch pending requests
        const { data: requestData } = await api.get<any[]>('/requests');
        setPendingRequestsCount(requestData.length);

      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboardData();
  }, [user]);

  const myProjects = projects.filter(isUserProject);
  const discoverProjects = projects.filter(project => project.isPublic && !isUserProject(project));

  // Compute Aggregations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusCounts = {
    Todo: tasks.filter(t => t.status === 'Todo').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    Review: tasks.filter(t => t.status === 'Review').length,
    Completed: completedTasks,
  };

  const priorityCounts = {
    Low: tasks.filter(t => t.priority === 'Low').length,
    Medium: tasks.filter(t => t.priority === 'Medium').length,
    High: tasks.filter(t => t.priority === 'High').length,
  };

  // Chart configs
  const statusChartData = {
    labels: ['Todo', 'In Progress', 'Review', 'Completed'],
    datasets: [{
      data: [statusCounts.Todo, statusCounts['In Progress'], statusCounts.Review, statusCounts.Completed],
      backgroundColor: ['#64748b', '#6366f1', '#f59e0b', '#10b981'],
      borderWidth: 1,
      borderColor: 'var(--border-color)'
    }]
  };

  const priorityChartData = {
    labels: ['Low Priority', 'Medium Priority', 'High Priority'],
    datasets: [{
      label: 'Tasks Count',
      data: [priorityCounts.Low, priorityCounts.Medium, priorityCounts.High],
      backgroundColor: ['rgba(16, 185, 129, 0.65)', 'rgba(245, 158, 11, 0.65)', 'rgba(239, 68, 68, 0.65)'],
      borderColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-secondary)',
          font: { family: 'Outfit, sans-serif' }
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        ticks: { color: 'var(--text-muted)' },
        grid: { color: 'var(--border-color)' }
      },
      x: {
        ticks: { color: 'var(--text-muted)' },
        grid: { display: false }
      }
    }
  };

  const ProjectCard: React.FC<{ project: ProjectData; actionLabel?: string }> = ({ project, actionLabel = 'Open' }) => (
    <div className={`${styles.projectCard} card`}>
      <div className={styles.projectHeader}>
        <h3 className={styles.projectName}>{project.name}</h3>
        <span className={styles.badge}>{project.isPublic ? 'Public' : 'Private'}</span>
      </div>
      <p className={styles.projectDesc}>{project.description}</p>
      
      {project.tags && project.tags.length > 0 && (
        <div className={styles.tags}>
          {project.tags.map((tag, i) => (
            <span key={i} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
      
      <div className={styles.projectFooter}>
        <div className={styles.members}>
          <FiUsers /> {project.members?.length || 1} Members
        </div>
        <Link to={`/project/${project._id}`} className="btn btn-secondary">{actionLabel}</Link>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {user?.name.split(' ')[0]}!</h1>
          <p className={styles.subtitle}>Manage your workspaces and track task completion analytics.</p>
        </div>
        <Link to="/project/new" className="btn btn-primary">
          <FiPlus /> New Project
        </Link>
      </div>

      {/* Stats Cards Section */}
      <div className={styles.statsGrid}>
        <div className="card">
          <div className={styles.statIcon}><FiFolder /></div>
          <h3>{myProjects.length}</h3>
          <p>My Workspaces</p>
        </div>
        <div className="card">
          <div className={styles.statIcon} style={{ background: '#f59e0b' }}><FiCheckSquare /></div>
          <h3>{totalTasks}</h3>
          <p>Active Tasks ({completionRate}% done)</p>
        </div>
        <div className="card">
          <div className={styles.statIcon} style={{ background: '#10b981' }}><FiMessageSquare /></div>
          <h3>{pendingRequestsCount}</h3>
          <p>Pending Join/Invite Requests</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      {myProjects.length > 0 && totalTasks > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Task Analytics</h2>
          <div className={styles.analyticsGrid}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Task Progress Breakdown</h3>
              <div className={styles.chartWrapper}>
                <Doughnut data={statusChartData} options={chartOptions} />
              </div>
            </div>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Task Priority Weights</h3>
              <div className={styles.chartWrapper}>
                <Bar data={priorityChartData} options={barChartOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Projects list */}
      <h2 className={styles.sectionTitle}>Your Workspaces</h2>
      
      {loading ? (
        <p>Loading workspaces...</p>
      ) : myProjects.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiFolder /></div>
          <h3>No projects yet</h3>
          <p>Create a new project to start collaborating with your team.</p>
          <Link to="/project/new" className="btn btn-primary"><FiPlus /> Create Project</Link>
        </div>
      ) : (
        <div className={styles.projectGrid}>
          {myProjects.map(project => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      {/* Discovery list */}
      <div className={styles.sectionHeader} style={{ marginTop: '3rem' }}>
        <h2 className={styles.sectionTitle}>Discover Projects</h2>
        <Link to="/discovery" className="btn btn-secondary">
          <FiCompass /> Browse All
        </Link>
      </div>

      {!loading && (
        discoverProjects.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FiCompass /></div>
            <h3>No public projects to discover</h3>
            <p>New public projects from other users will appear here.</p>
          </div>
        ) : (
          <div className={styles.projectGrid}>
            {discoverProjects.slice(0, 6).map(project => (
              <ProjectCard key={project._id} project={project} actionLabel="View" />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Dashboard;
