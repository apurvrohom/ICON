import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import styles from './Auth.module.css';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength states
  const [strength, setStrength] = useState(0);
  const [checks, setChecks] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const checksObj = {
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    };
    setChecks(checksObj);

    // Calculate score (0 to 5)
    const score = Object.values(checksObj).filter(Boolean).length;
    setStrength(score);
  }, [password]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (strength < 5) {
      setError('Please meet all password strength requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(data.message || 'Password reset successful!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const strengthLabel = getStrengthLabel();

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authCard} card`}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>Enter a new, strong password below.</p>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success} style={{ color: 'var(--success-color)', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>New Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Password strength UI */}
          {password && (
            <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
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

          <div className={styles.inputGroup}>
            <label>Confirm Password</label>
            <input
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className={styles.switchText} style={{ marginTop: '1.5rem' }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
