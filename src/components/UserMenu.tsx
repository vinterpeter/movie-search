import { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, User, Cloud } from 'lucide-react';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import './UserMenu.css';

interface UserMenuProps {
  syncing?: boolean;
}

export const UserMenu = ({ syncing }: UserMenuProps) => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="user-menu__loading">
        <User size={18} />
      </div>
    );
  }

  if (!user) {
    return (
      <button className="user-menu__sign-in" onClick={handleSignIn}>
        <LogIn size={16} />
        <span className="user-menu__sign-in-text">{t('signIn')}</span>
      </button>
    );
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="user-menu__avatar"
          />
        ) : (
          <div className="user-menu__avatar-placeholder">
            <User size={16} />
          </div>
        )}
        {syncing && (
          <span className="user-menu__sync-indicator" title={t('syncingWatchlist')}>
            <Cloud size={12} />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="user-menu__dropdown">
          <div className="user-menu__user-info">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="user-menu__dropdown-avatar"
              />
            )}
            <div className="user-menu__user-details">
              <span className="user-menu__user-name">{user.displayName}</span>
              <span className="user-menu__user-email">{user.email}</span>
            </div>
          </div>
          <div className="user-menu__divider" />
          <button className="user-menu__option" onClick={handleSignOut}>
            <LogOut size={16} />
            <span>{t('signOut')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
