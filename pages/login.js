import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate signup fields
        if (!firstName.trim()) {
          setError('First name is required');
          setLoading(false);
          return;
        }
        if (!lastName.trim()) {
          setError('Last name is required');
          setLoading(false);
          return;
        }
        if (!dateOfBirth) {
          setError('Date of birth is required');
          setLoading(false);
          return;
        }
        
        // Validate date of birth (must be in the past)
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        if (birthDate >= today) {
          setError('Date of birth must be in the past');
          setLoading(false);
          return;
        }

        await signUp(email, password, firstName.trim(), lastName.trim(), dateOfBirth);
        setSuccess('Sign up successful! Please check your email to verify your account.');
        // Clear form
        setFirstName('');
        setLastName('');
        setDateOfBirth('');
        setEmail('');
        setPassword('');
      } else {
        await signIn(email, password);
        router.push('/movies');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Kacper's Website - Login</title>
        <meta name="description" content="Login to access protected features" />
      </Head>
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1>{isSignUp ? 'Sign Up' : 'Login'}</h1>
          <p className={styles.subtitle}>
            {isSignUp
              ? 'Create an account to access protected features'
              : 'Login to access protected features'}
          </p>

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

          <form onSubmit={handleSubmit} className={styles.form}>
            {isSignUp && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required={isSignUp}
                    placeholder="John"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required={isSignUp}
                    placeholder="Doe"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required={isSignUp}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
            </button>
          </form>

          <div className={styles.switch}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
                // Clear signup-specific fields when switching to login
                if (isSignUp) {
                  setFirstName('');
                  setLastName('');
                  setDateOfBirth('');
                }
              }}
              className={styles.switchButton}
            >
              {isSignUp
                ? 'Already have an account? Login'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

