import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Layout.module.css';

export default function Layout({ children }) {
  const router = useRouter();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/projects', label: 'Projects' },
    { href: '/movies', label: 'Movies' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <div className={styles.container}>
      <nav className={styles.sidebar}>
        <h2>Navigation</h2>
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
      </nav>
      <main className={styles.content}>{children}</main>
    </div>
  );
}

