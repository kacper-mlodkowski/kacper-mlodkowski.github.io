import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Layout.module.css';

export default function Layout({ children }) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/movies', label: 'Movies' },
  ];

  return (
    <div className={styles.container}>
      <nav className={styles.sidebar}>
        <h2>Menu</h2>
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
      <main className={styles.content}>{children}</main>
    </div>
  );
}

