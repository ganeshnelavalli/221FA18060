import { useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';


import { useEffect } from 'react';

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [validity, setValidity] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [accessCount, setAccessCount] = useState(null);
  const [stats, setStats] = useState([]);

  // Helper to extract shortId from a shortUrl
  const getShortId = (url) => {
    if (!url) return '';
    try {
      return url.split('/').pop();
    } catch {
      return '';
    }
  };

  // Fetch stats for all short URLs in this session
  useEffect(() => {
    // Load from localStorage
    const stored = JSON.parse(localStorage.getItem('shortUrls') || '[]');
    if (stored.length > 0) {
      Promise.all(
        stored.map(async (url) => {
          const shortId = getShortId(url);
          try {
            const res = await fetch(`http://localhost:3000/stats/${shortId}`);
            if (!res.ok) return null;
            const data = await res.json();
            return { shortUrl: url, ...data };
          } catch {
            return null;
          }
        })
      ).then((results) => {
        setStats(results.filter(Boolean));
      });
    }
  }, []);

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
      const payload = { longUrl };
      if (validity) payload.validity = parseInt(validity, 10);
      if (customCode) payload.customCode = customCode;
      const response = await fetch('http://localhost:3000/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.shortUrl) {
        setShortUrl(data.shortUrl);
        setExpiresAt(data.expiresAt);
        setAccessCount(data.accessCount);
        // Save to localStorage for stats
        let stored = JSON.parse(localStorage.getItem('shortUrls') || '[]');
        if (!stored.includes(data.shortUrl)) {
          stored.push(data.shortUrl);
          localStorage.setItem('shortUrls', JSON.stringify(stored));
        }
        // Fetch stats for this shortUrl and update table
        const shortId = getShortId(data.shortUrl);
        try {
          const res = await fetch(`http://localhost:3000/stats/${shortId}`);
          if (res.ok) {
            const statData = await res.json();
            setStats((prev) => {
              // Remove any previous entry for this shortUrl
              const filtered = prev.filter((s) => s.shortUrl !== data.shortUrl);
              return [...filtered, { shortUrl: data.shortUrl, ...statData }];
            });
          }
        } catch {}
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
              className="form-control mb-2"
              placeholder="Original URL"
              value={longUrl}
              onChange={e => setLongUrl(e.target.value)}
              disabled={loading}
            />
            <input
              type="number"
              className="form-control mb-2"
              placeholder="Validity (minutes)"
              value={validity}
              onChange={e => setValidity(e.target.value)}
              disabled={loading}
              min="1"
            />
            <input
              type="text"
              className="form-control"
              placeholder="Custom Shortcode (optional)"
              value={customCode}
              onChange={e => setCustomCode(e.target.value)}
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
      {/* Statistics Table */}
      <div className="card shadow-sm p-4 mt-4">
        <h4 className="mb-3">Shortened URLs Statistics</h4>
        <div className="table-responsive">
          <table className="table table-bordered align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Short URL</th>
                <th>Original URL</th>
                <th>Created At</th>
                <th>Expiry</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr><td colSpan="5" className="text-center">No data</td></tr>
              ) : (
                stats.map((row, idx) => (
                  <tr key={idx}>
                    <td><a href={row.shortUrl} target="_blank" rel="noopener noreferrer">{row.shortUrl}</a></td>
                    <td style={{ maxWidth: 180, wordBreak: 'break-all' }}>{row.longUrl}</td>
                    <td>{row.expiresAt ? new Date(row.expiresAt - (row.expiresAt - Date.now())).toLocaleString() : '-'}</td>
                    <td>{row.expiresAt ? new Date(row.expiresAt).toLocaleString() : '-'}</td>
                    <td>{row.accessCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App
