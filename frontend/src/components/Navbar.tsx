import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiUser, FiLogOut, FiFolder, FiUsers } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';
import useNotificationStore from '../store/useNotificationStore';
import NotificationsPanel from './NotificationsPanel';
import api from '../services/api';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { requests, notifications } = useNotificationStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Autocomplete search states
  const [searchResults, setSearchResults] = useState<{ projects: any[]; users: any[] }>({ projects: [], users: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discovery?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchDropdown(false);
    }
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ projects: [], users: [] });
      return;
    }

    const fetchSearchSuggestions = async () => {
      try {
        const [{ data: projData }, { data: userData }] = await Promise.all([
          api.get<any[]>('/projects'),
          api.get<any[]>(`/users?search=${searchQuery}`)
        ]);

        const filteredProjects = projData.filter(p => 
          p.isPublic && (
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        );

        setSearchResults({
          projects: filteredProjects.slice(0, 4),
          users: userData.slice(0, 4)
        });
      } catch (error) {
        console.error('Failed to fetch search suggestions', error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const pendingRequestsCount = requests.length;
  const totalBadgeCount = unreadNotificationsCount + pendingRequestsCount;

  return (
    <nav className={styles.navbar}>
      <div className={`${styles.navContainer} container`}>
        <Link to="/dashboard" className={styles.logo}>
          ICON <span className={styles.accent}>Idea-CONnect</span>
        </Link>
        
        {/* Debounced search container */}
        <div ref={searchContainerRef} className={styles.searchContainer}>
          <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
            <FiSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search projects, users..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
            />
          </form>

          {/* Autocomplete Search Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className={styles.searchDropdown}>
              
              {/* Projects section */}
              <div className={styles.searchSection}>
                <h5>Projects</h5>
                {searchResults.projects.length === 0 ? (
                  <p className={styles.searchEmpty}>No matching projects</p>
                ) : (
                  searchResults.projects.map((proj) => (
                    <div 
                      key={proj._id} 
                      className={styles.searchResultItem}
                      onClick={() => {
                        navigate(`/project/${proj._id}`);
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                    >
                      <FiFolder style={{ color: 'var(--primary-color)' }} />
                      <span>{proj.name}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Users section */}
              <div className={styles.searchSection}>
                <h5>People</h5>
                {searchResults.users.length === 0 ? (
                  <p className={styles.searchEmpty}>No matching people</p>
                ) : (
                  searchResults.users.map((u) => (
                    <div 
                      key={u._id} 
                      className={styles.searchResultItem}
                      onClick={() => {
                        navigate(`/discovery?q=${encodeURIComponent(u.username)}`);
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className={styles.searchResultAvatar}>
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt={u.name} />
                        ) : (
                          u.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer redirect */}
              <div 
                className={styles.viewAllSearch}
                onClick={() => {
                  navigate(`/discovery?q=${encodeURIComponent(searchQuery)}`);
                  setShowSearchDropdown(false);
                }}
              >
                Press Enter to view all results
              </div>

            </div>
          )}
        </div>
        
        <div className={styles.navActions}>
          <div className={styles.profileMenu}>
            <button className={styles.iconBtn}>
              <FiBell />
              {totalBadgeCount > 0 && (
                <span className={styles.badgeCount}>{totalBadgeCount}</span>
              )}
            </button>
            <NotificationsPanel />
          </div>
          
          <div className={styles.profileMenu}>
            <div 
              className={styles.avatar} 
              onClick={() => navigate('/profile')} 
              title="View Profile"
              style={{ cursor: 'pointer' }}
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" />
              ) : (
                <FiUser />
              )}
            </div>
            <div className={styles.dropdown}>
              <Link to="/profile">Profile</Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                <FiLogOut /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
