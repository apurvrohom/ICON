import React, { useState } from 'react';
import { FiUser, FiMail, FiStar, FiEdit3, FiSave, FiX } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';
import styles from './Profile.module.css';

const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const loading = useAuthStore((state) => state.loading);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    motto: user?.motto || '',
    bio: user?.bio || '',
    domain: user?.domain || '',
    skills: user?.skills?.join(', ') || '',
    interests: user?.interests?.join(', ') || ''
  });

  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const submitData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        interests: formData.interests ? formData.interests.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      await updateProfile(submitData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <div className={styles.avatarLarge}>
          {user.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" />
          ) : (
            <FiUser size={64} />
          )}
        </div>
        
        {isEditing ? (
          <div className={styles.userInfo} style={{ flex: 1 }}>
            <input type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} placeholder="Full Name" style={{ marginBottom: '0.5rem' }} />
            <p className={styles.username}>@{user.username}</p>
            <input type="text" name="motto" className="input-field" value={formData.motto} onChange={handleChange} placeholder="Motto" />
          </div>
        ) : (
          <div className={styles.userInfo}>
            <h1 className={styles.name}>{user.name}</h1>
            <p className={styles.username}>@{user.username}</p>
            <p className={styles.motto}>{user.motto || 'No motto set.'}</p>
          </div>
        )}

        <div style={{ marginLeft: 'auto', alignSelf: 'flex-start', display: 'flex', gap: '0.5rem' }}>
          {isEditing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={loading}>
                <FiX /> Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                <FiSave /> {loading ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
              <FiEdit3 /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        <div className="card">
          <h3>About</h3>
          {isEditing ? (
            <textarea name="bio" className="input-field" value={formData.bio} onChange={handleChange} rows={4} placeholder="Write a short bio..."></textarea>
          ) : (
            <p className={styles.bio}>{user.bio || 'This user has not written a bio yet.'}</p>
          )}
          
          <div className={styles.detailsList} style={{ marginTop: '1rem' }}>
            <div className={styles.detailItem}>
              <FiMail className={styles.icon} />
              <span>{user.email}</span>
            </div>
            
            <div className={styles.detailItem}>
              <FiStar className={styles.icon} />
              {isEditing ? (
                <input type="text" name="domain" className="input-field" value={formData.domain} onChange={handleChange} placeholder="Domain (e.g. AI)" />
              ) : (
                <span>Domain: {user.domain || 'Not specified'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Skills & Interests</h3>
          
          <div className={styles.tagsGroup}>
            <h4>Skills</h4>
            {isEditing ? (
              <input type="text" name="skills" className="input-field" value={formData.skills} onChange={handleChange} placeholder="Comma separated skills" />
            ) : user.skills && user.skills.length > 0 ? (
              <div className={styles.tags}>
                {user.skills.map((skill, i) => (
                  <span key={i} className={styles.tag}>{skill}</span>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No skills listed.</p>
            )}
          </div>
          
          <div className={styles.tagsGroup} style={{ marginTop: '1.5rem' }}>
            <h4>Interests</h4>
            {isEditing ? (
              <input type="text" name="interests" className="input-field" value={formData.interests} onChange={handleChange} placeholder="Comma separated interests" />
            ) : user.interests && user.interests.length > 0 ? (
              <div className={styles.tags}>
                {user.interests.map((interest, i) => (
                  <span key={i} className={styles.tag}>{interest}</span>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No interests listed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
