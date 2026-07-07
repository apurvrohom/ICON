import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import styles from './Auth.module.css';

interface ProjectFormState {
  name: string;
  description: string;
  motto: string;
  domain: string;
  tags: string;
  isPublic: boolean;
}

const CreateProject: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProjectFormState>({
    name: '',
    description: '',
    motto: '',
    domain: '',
    tags: '',
    isPublic: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setFormData({ ...formData, [target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };
      
      const { data } = await api.post<{ _id: string }>('/projects', submitData);
      navigate(`/project/${data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer} style={{ minHeight: 'auto', paddingTop: '2rem' }}>
      <div className={`${styles.authCard} card`} style={{ maxWidth: '600px' }}>
        <h1 className={styles.title}>Create New Project</h1>
        <p className={styles.subtitle}>Set up a new space for your idea.</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Project Name *</label>
            <input type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} required disabled={loading} />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Motto / Catchphrase</label>
            <input type="text" name="motto" className="input-field" value={formData.motto} onChange={handleChange} disabled={loading} />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Description *</label>
            <textarea name="description" className="input-field" rows={4} value={formData.description} onChange={handleChange} required disabled={loading}></textarea>
          </div>
          
          <div className={styles.row} style={{ display: 'flex', gap: '1rem' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Domain (e.g. Web3)</label>
              <input type="text" name="domain" className="input-field" value={formData.domain} onChange={handleChange} disabled={loading} />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Tags (comma separated)</label>
              <input type="text" name="tags" className="input-field" value={formData.tags} onChange={handleChange} placeholder="React, Python, AI" disabled={loading} />
            </div>
          </div>

          <div className={styles.inputGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', display: 'flex' }}>
            <input type="checkbox" name="isPublic" id="isPublic" checked={formData.isPublic} onChange={handleChange} disabled={loading} />
            <label htmlFor="isPublic" style={{ cursor: 'pointer', margin: 0 }}>Make project public (discoverable by others)</label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !user} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
