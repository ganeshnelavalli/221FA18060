import { useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [accessCount, setAccessCount] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShortUrl('');
    setExpiresAt(null);
    setAccessCount(null);
    if (!longUrl.startsWith('http')) {
      setError('Please enter a valid URL including http or https.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl })
      });
      const data = await response.json();
      if (response.ok && data.shortUrl) {
        setShortUrl(data.shortUrl);
        setExpiresAt(data.expiresAt);
        setAccessCount(data.accessCount);
      } else {
        setError(data.error || 'Failed to shorten URL');
      }
    } catch (err) {
      setError('Could not connect to backend');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 60 }}>
      <div className="card shadow-sm p-4">
        <h2 className="text-center mb-4">URL Shortener</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Enter your long URL here..."
              value={longUrl}
              onChange={e => setLongUrl(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="d-grid">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Shortening...' : 'Shorten URL'}
            </button>
          </div>
        </form>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        {shortUrl && (
          <div className="alert alert-success mt-4">
            <div>Short URL: <a href={shortUrl} target="_blank" rel="noopener noreferrer">{shortUrl}</a></div>
            {expiresAt && (
              <div className="mt-2">Expires at: {new Date(expiresAt).toLocaleString()}</div>
            )}
            {accessCount !== null && (
              <div className="mt-2">Access count: {accessCount}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App
