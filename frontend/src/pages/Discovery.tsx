import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiUsers, FiFolder } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import styles from './Discovery.module.css';

interface ProjectData {
  _id: string;
  name: string;
  motto?: string;
  description: string;
  isPublic: boolean;
  tags: string[];
}

interface UserData {
  _id: string;
  name: string;
  username: string;
  domain?: string;
  profilePicture?: string;
}

const Discovery: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [activeTab, setActiveTab] = useState<'projects' | 'users'>('projects');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data: projData } = await api.get<ProjectData[]>('/projects');
        
        // Filter public projects that match query
        const filteredProjects = projData.filter(p => 
          p.isPublic && (p.name.toLowerCase().includes(query.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
        );
        setProjects(filteredProjects);

        // Fetch users
        const { data: userData } = await api.get<UserData[]>(`/users?search=${query}`);
        setUsers(userData);
      } catch (error) {
        console.error('Error fetching discovery results', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchResults();
  }, [query, user]);

  return (
    <div className={styles.discoveryContainer}>
      <div className={styles.header}>
        <h1>Discovery</h1>
        <p className={styles.subtitle}>Find new projects to collaborate on and people to connect with.</p>
        
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'projects' ? styles.active : ''}`} onClick={() => setActiveTab('projects')}>
            <FiFolder /> Public Projects
          </button>
          <button className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`} onClick={() => setActiveTab('users')}>
            <FiUsers /> Users
          </button>
        </div>
      </div>

      <div className={styles.resultsArea}>
        {loading ? <p>Loading results...</p> : (
          <>
            {activeTab === 'projects' && (
              <div className={styles.grid}>
                {projects.length === 0 ? <p className={styles.empty}>No projects found.</p> : projects.map(p => (
                  <div key={p._id} className="card">
                    <h3>{p.name}</h3>
                    <p className={styles.motto}>{p.motto}</p>
                    <p className={styles.desc}>{p.description}</p>
                    <div className={styles.tags}>
                      {p.tags.map((t, i) => <span key={i} className={styles.tag}>{t}</span>)}
                    </div>
                    <Link to={`/project/${p._id}`} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>View Project</Link>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className={styles.grid}>
                {users.length === 0 ? <p className={styles.empty}>No users found.</p> : users.map(u => (
                  <div key={u._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className={styles.avatar}>
                      {u.profilePicture ? <img src={u.profilePicture} alt="Profile" /> : <FiUsers size={24} />}
                    </div>
                    <div>
                      <h3 style={{ margin: 0 }}>{u.name}</h3>
                      <p style={{ color: 'var(--primary-color)', fontSize: '0.875rem' }}>@{u.username}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{u.domain}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Discovery;
