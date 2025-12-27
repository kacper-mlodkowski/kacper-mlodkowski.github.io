import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import styles from '../styles/Movies.module.css';

export default function Movies() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    imdb_url: '',
    image_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const searchTimeoutRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    fetchMovies();
    checkAdminStatus();
  }, [user]);

  async function checkAdminStatus() {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(!error && data !== null);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  }

  // Close autocomplete when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced movie search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      await searchMovies(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  async function searchMovies(query) {
    try {
      setSearching(true);
      // Using TMDB API (free API key required - get one at https://www.themoviedb.org/settings/api)
      // For demo purposes, using a public key. For production, use environment variable.
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '15d2ea6d0dc1d476efbca3eba2b9bbfb';
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${apiKey}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setSuggestions(data.results.slice(0, 5)); // Limit to 5 results
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('Error searching movies:', err);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }

  async function selectMovie(movie) {
    try {
      setSearching(true);
      // Movie object from TMDB already has all the info we need
      const imdbId = movie.imdb_id || '';
      const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : '';

      setFormData({
        title: movie.title,
        imdb_url: imdbId ? `https://www.imdb.com/title/${imdbId}/` : '',
        image_url: posterUrl,
      });
      setSearchQuery(movie.title);
      setShowSuggestions(false);
      setSuggestions([]);

      // If we don't have IMDB ID, try to fetch it from TMDB
      if (!imdbId && movie.id) {
        try {
          const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '15d2ea6d0dc1d476efbca3eba2b9bbfb';
          const detailsResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&append_to_response=external_ids`
          );
          const detailsData = await detailsResponse.json();
          if (detailsData.external_ids?.imdb_id) {
            setFormData((prev) => ({
              ...prev,
              imdb_url: `https://www.imdb.com/title/${detailsData.external_ids.imdb_id}/`,
            }));
          }
        } catch (err) {
          console.error('Error fetching IMDB ID:', err);
        }
      }
    } catch (err) {
      console.error('Error selecting movie:', err);
      setSubmitError('Failed to load movie details');
    } finally {
      setSearching(false);
    }
  }

  async function fetchMovies() {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching movies from Supabase...');
      const { data, error, status, statusText } = await supabase
        .from('movie')
        .select('*')
        .order('created_at', { ascending: false });

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

  async function handleDelete(movieId) {
    if (!user) {
      setError('You must be logged in to delete movies');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${movies.find(m => m.id === movieId)?.title}"?`)) {
      return;
    }

    try {
      setDeletingId(movieId);
      const { error } = await supabase
        .from('movie')
        .delete()
        .eq('id', movieId);

      if (error) {
        throw error;
      }

      // Refresh the list
      await fetchMovies();
      setSubmitSuccess('Movie deleted successfully');
    } catch (err) {
      console.error('Error deleting movie:', err);
      setSubmitError(err.message || 'Failed to delete movie');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitting(true);

    try {
      if (!user) {
        throw new Error('You must be logged in to add movies');
      }

      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      const { data, error } = await supabase
        .from('movie')
        .insert([
          {
            title: formData.title.trim(),
            imdb_url: formData.imdb_url.trim() || null,
            image_url: formData.image_url.trim() || null,
            user_id: user.id,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      setSubmitSuccess(`Successfully added: "${formData.title}"`);
      setFormData({
        title: '',
        imdb_url: '',
        image_url: '',
      });
      setSearchQuery('');
      // Refresh the list
      await fetchMovies();
    } catch (err) {
      console.error('Error inserting movie:', err);
      setSubmitError(err.message || 'Failed to add movie');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Kacper's Website - Movies</title>
        <meta name="description" content="Movies from database" />
      </Head>
      <div style={{ width: '100%', maxWidth: '100%' }}>
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

        {user && (
          <div className={styles.formSection}>
            <h2>Add New Movie</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup} ref={autocompleteRef}>
                <label htmlFor="title">Title *</label>
                <div className={styles.autocompleteWrapper}>
                  <input
                    id="title"
                    type="text"
                    value={searchQuery || formData.title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      setFormData({ ...formData, title: value });
                      if (value.length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    required
                    placeholder="Start typing to search movies..."
                    disabled={submitting}
                    autoComplete="off"
                  />
                  {searching && (
                    <span className={styles.searchingIndicator}>Searching...</span>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className={styles.autocompleteDropdown}>
                      {suggestions.map((movie) => (
                        <div
                          key={movie.id}
                          className={styles.autocompleteItem}
                          onClick={() => selectMovie(movie)}
                        >
                          {movie.poster_path && (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                              alt={movie.title}
                              className={styles.autocompletePoster}
                            />
                          )}
                          <div className={styles.autocompleteInfo}>
                            <div className={styles.autocompleteTitle}>{movie.title}</div>
                            <div className={styles.autocompleteYear}>
                              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>


              {submitError && (
                <div className={styles.error}>
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className={styles.success}>
                  {submitSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !formData.title.trim()}
                className={styles.submitButton}
              >
                {submitting ? 'Adding...' : 'Add Movie'}
              </button>
            </form>
          </div>
        )}

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
          <div className={styles.moviesContainer} style={{ width: '100%', maxWidth: 'none' }}>
            <div className={styles.moviesGrid} style={{ width: '100%', maxWidth: 'none' }}>
              {movies.map((movie) => {
                const canDelete = user && (isAdmin || movie.user_id === user.id);
                return (
                <div key={movie.id} className={styles.movieCard}>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(movie.id)}
                      disabled={deletingId === movie.id}
                      className={styles.deleteButton}
                      title={isAdmin ? "Delete movie (admin)" : "Delete movie"}
                    >
                      {deletingId === movie.id ? '...' : '×'}
                    </button>
                  )}
                  <div className={styles.movieImageContainer}>
                    {movie.image_url ? (
                      <img
                        src={movie.image_url}
                        alt={movie.title}
                        className={styles.movieImage}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = e.target.parentElement.querySelector(`.${styles.movieImagePlaceholder}`);
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={styles.movieImagePlaceholder}
                      style={{ display: movie.image_url ? 'none' : 'flex' }}
                    >
                      No Image
                    </div>
                  </div>
                  <div className={styles.movieInfo}>
                    <h3 className={styles.movieTitle}>
                      {movie.imdb_url ? (
                        <a
                          href={movie.imdb_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.imdbLink}
                        >
                          {movie.title}
                          <span className={styles.externalLinkIcon}>↗</span>
                        </a>
                      ) : (
                        movie.title
                      )}
                    </h3>
                    {movie.created_at && (
                      <p className={styles.movieDate}>
                        Added: {new Date(movie.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
            <p className={styles.count}>Total movies: {movies.length}</p>
          </div>
        )}
      </div>
    </>
  );
}

