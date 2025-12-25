import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import styles from '../styles/Movies.module.css';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  async function fetchMovies() {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching movies from Supabase...');
      const { data, error, status, statusText } = await supabase
        .from('movie')
        .select('*');

      console.log('Supabase response:', { data, error, status, statusText });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} movies`);
      setMovies(data || []);
      
      // If no data and no error, it might be RLS blocking
      if (!data || data.length === 0) {
        console.warn('No data returned. This might be due to Row Level Security (RLS) policies.');
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError(err.message || 'Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Kacper's Website - Movies</title>
        <meta name="description" content="Movies from database" />
      </Head>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1>Movies</h1>
            <p>Movies from Supabase database:</p>
          </div>
          <button 
            onClick={fetchMovies} 
            disabled={loading}
            className={styles.refreshButton}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading && <p className={styles.loading}>Loading movies...</p>}

        {error && (
          <div className={styles.error}>
            <p><strong>Error loading movies:</strong> {error}</p>
            <p>Make sure your Supabase credentials are correct and the table exists.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <strong>Common issues:</strong>
            </p>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <li>Row Level Security (RLS) might be blocking access - check your Supabase dashboard</li>
              <li>Table name might be incorrect (should be 'movie')</li>
              <li>Check browser console for detailed error messages</li>
            </ul>
          </div>
        )}

        {!loading && !error && movies.length === 0 && (
          <div className={styles.empty}>
            <p><strong>No movies found in the database.</strong></p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              If you know there should be records, this is likely due to <strong>Row Level Security (RLS)</strong> policies.
            </p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              To fix this, go to your Supabase dashboard → Table Editor → movie table → Policies, and either:
            </p>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
              <li>Disable RLS for the table (not recommended for production), or</li>
              <li>Create a policy that allows SELECT for anonymous users</li>
            </ul>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Check the browser console (F12) for detailed logs.
            </p>
          </div>
        )}

        {!loading && !error && movies.length > 0 && (
          <div className={styles.moviesContainer}>
            <table className={styles.moviesTable}>
              <thead>
                <tr>
                  {Object.keys(movies[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movies.map((movie, index) => (
                  <tr key={index}>
                    {Object.values(movie).map((value, cellIndex) => (
                      <td key={cellIndex}>
                        {value === null ? (
                          <span className={styles.nullValue}>null</span>
                        ) : typeof value === 'object' ? (
                          <pre>{JSON.stringify(value, null, 2)}</pre>
                        ) : (
                          String(value)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.count}>Total movies: {movies.length}</p>
          </div>
        )}
      </div>
    </>
  );
}

