import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import styles from '../styles/Users.module.css';

export default function Users() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  async function fetchUsers() {
    try {
      setFetchLoading(true);
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!user) {
        throw new Error('You must be logged in to insert records');
      }

      const { data, error } = await supabase
        .from('user')
        .insert([
          {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            date_of_birth: dateOfBirth,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      setSuccess(`Successfully added: ${firstName} ${lastName}`);
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      // Refresh the list
      await fetchUsers();
    } catch (err) {
      console.error('Error inserting user:', err);
      setError(err.message || 'Failed to insert record');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <>
      <Head>
        <title>Kacper's Website - Users</title>
        <meta name="description" content="Manage users (authenticated only)" />
      </Head>
      <div>
        <div className={styles.header}>
          <div>
            <h1>Users</h1>
            <p className={styles.subtitle}>
              Logged in as: <strong>{user.email}</strong>
            </p>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2>Add New User</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Enter first name"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Enter last name"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            {success && (
              <div className={styles.success}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !firstName.trim() || !lastName.trim() || !dateOfBirth}
              className={styles.submitButton}
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </div>

        <div className={styles.listSection}>
          <h2>All Users</h2>
          {fetchLoading ? (
            <p className={styles.loading}>Loading users...</p>
          ) : error ? (
            <div className={styles.error}>
              <p>Error loading users: {error}</p>
            </div>
          ) : users.length === 0 ? (
            <p className={styles.empty}>No users found.</p>
          ) : (
            <div className={styles.usersList}>
              <table className={styles.usersTable}>
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Date of Birth</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userRecord) => (
                    <tr key={userRecord.id}>
                      <td>{userRecord.first_name}</td>
                      <td>{userRecord.last_name}</td>
                      <td>
                        {userRecord.date_of_birth
                          ? new Date(userRecord.date_of_birth).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        {userRecord.created_at
                          ? new Date(userRecord.created_at).toLocaleString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.count}>Total users: {users.length}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

