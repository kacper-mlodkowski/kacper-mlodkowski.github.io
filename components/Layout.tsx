import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarHidden');
      if (saved !== null) {
        setSidebarHidden(JSON.parse(saved));
      }
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarHidden', JSON.stringify(sidebarHidden));
    }
  }, [sidebarHidden]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/movies', label: 'Movies' },
  ];

  const toggleSidebar = () => {
    setSidebarHidden(!sidebarHidden);
  };

  return (
    <div className={styles.container}>
      <button
        onClick={toggleSidebar}
        className={`${styles.toggleButton} ${sidebarHidden ? styles.toggleButtonHidden : ''}`}
        aria-label={sidebarHidden ? 'Show menu' : 'Hide menu'}
        title={sidebarHidden ? 'Show menu' : 'Hide menu'}
      >
        {sidebarHidden ? '☰' : '☰'}
      </button>
      <nav className={`${styles.sidebar} ${sidebarHidden ? styles.hidden : ''}`}>
        <ul className={styles.navLinks}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={router.pathname === link.href ? styles.active : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.authSection}>
          {user ? (
            <>
              <div className={styles.userInfo}>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
              <button onClick={signOut} className={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.loginButton}>
              Login
            </Link>
          )}
        </div>
      </nav>
      <main className={`${styles.content} ${sidebarHidden ? styles.contentFullWidth : ''}`}>{children}</main>
    </div>
  );
}

