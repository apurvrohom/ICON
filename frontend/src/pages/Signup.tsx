import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import styles from './Auth.module.css';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    domain: '',
    skills: ''
  });
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Password strength states
  const [strength, setStrength] = useState(0);
  const [checks, setChecks] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
  });

  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();

  useEffect(() => {
    const checksObj = {
      length: formData.password.length >= 8,
      lower: /[a-z]/.test(formData.password),
      upper: /[A-Z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
      special: /[^a-zA-Z0-9]/.test(formData.password),
    };
    setChecks(checksObj);

    // Calculate score (0 to 5)
    const score = Object.values(checksObj).filter(Boolean).length;
    setStrength(score);
  }, [formData.password]);

  const getStrengthLabel = () => {
    switch (strength) {
      case 0:
      case 1:
        return { text: 'Very Weak', color: '#EF4444' };
      case 2:
        return { text: 'Weak', color: '#F59E0B' };
      case 3:
        return { text: 'Fair', color: '#FCD34D' };
      case 4:
        return { text: 'Good', color: '#10B981' };
      case 5:
        return { text: 'Strong & Secure', color: '#059669' };
      default:
        return { text: '', color: '' };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (strength < 5) {
      setError('Please choose a stronger password matching all requirements.');
      return;
    }

    try {
      const submitData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      
      await register(submitData);
      setMessage('Registration successful! Redirecting to dashboard...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err);
    }
  };

  const strengthLabel = getStrengthLabel();

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authCard} card`}>
        <h1 className={styles.title}>Join ICON</h1>
        <p className={styles.subtitle}>Create an account to start collaborating.</p>
        
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success} style={{ color: 'var(--success-color)', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row} style={{ display: 'flex', gap: '1rem' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Name</label>
              <input type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} required disabled={loading} />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Username</label>
              <input type="text" name="username" className="input-field" value={formData.username} onChange={handleChange} required disabled={loading} />
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} required disabled={loading} />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Password</label>
            <input type="password" name="password" className="input-field" value={formData.password} onChange={handleChange} required disabled={loading} />
          </div>

          {/* Password strength UI */}
          {formData.password && (
            <div style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Password Strength:</span>
                <span style={{ fontWeight: 'bold', color: strengthLabel.color }}>{strengthLabel.text}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', height: '6px', width: '100%', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: '100%',
                      background: idx <= strength ? strengthLabel.color : 'transparent',
                      transition: 'background 0.3s ease',
                    }}
                  />
                ))}
              </div>
              <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', marginTop: '0.5rem', listStyleType: 'disc' }}>
                <li style={{ color: checks.length ? 'var(--success-color)' : 'inherit' }}>At least 8 characters</li>
                <li style={{ color: checks.lower ? 'var(--success-color)' : 'inherit' }}>At least one lowercase letter</li>
                <li style={{ color: checks.upper ? 'var(--success-color)' : 'inherit' }}>At least one uppercase letter</li>
                <li style={{ color: checks.number ? 'var(--success-color)' : 'inherit' }}>At least one number</li>
                <li style={{ color: checks.special ? 'var(--success-color)' : 'inherit' }}>At least one special character</li>
              </ul>
            </div>
          )}
          
          <div className={styles.row} style={{ display: 'flex', gap: '1rem' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Domain (e.g. AI, Web)</label>
              <input type="text" name="domain" className="input-field" value={formData.domain} onChange={handleChange} disabled={loading} />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Skills (comma separated)</label>
              <input type="text" name="skills" className="input-field" placeholder="React, Node, etc." value={formData.skills} onChange={handleChange} disabled={loading} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <p className={styles.switchText}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
