import { useState, useEffect } from 'react';
// Use VITE_API_BASE_URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function PasswordScreen({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/validate_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError("Invalid password.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="app-container" style={{ maxWidth: 400, margin: '80px auto', padding: 24, background: 'var(--card-bg)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 16 }}>🔒 Enter Access Password</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          style={{ padding: 10, fontSize: 16, borderRadius: 6, background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--input-border)' }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !password.trim()} style={{ padding: '10px 0', fontSize: 16, borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {loading ? "Validating..." : "Enter"}
        </button>
      </form>
      {error && <div style={{ textAlign: 'center', color: '#d32f2f', marginTop: 12 }}>{error}</div>}
    </div>
  );
}
import './App.css';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [catImg, setCatImg] = useState("");
  const [fact, setFact] = useState("");
  const [factStatus, setFactStatus] = useState("");

  // Fetch a random cat image
  const fetchCatImg = async () => {
    try {
      const res = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await res.json();
      setCatImg(data[0]?.url || "");
    } catch {
      setCatImg("");
    }
  };

  useEffect(() => {
    if (authenticated) fetchCatImg();
  }, [authenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    await fetchCatImg(); // update cat image on each query
    try {
      const res = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResponse(data.answer || "No answer returned.");
    } catch (err) {
      setResponse("Error: " + err.message);
    }
    setLoading(false);
  };

  // Add new cat fact
  const handleAddFact = async (e) => {
    e.preventDefault();
    setFactStatus("");
    if (!fact.trim()) {
      setFactStatus("Please enter a cat fact.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/add_fact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fact })
      });
      const data = await res.json();
      if (data.success) {
        setFactStatus("✅ " + data.message);
        setFact("");
      } else {
        setFactStatus("❌ " + (data.error || "Unknown error."));
      }
    } catch (err) {
      setFactStatus("❌ Error: " + err.message);
    }
  };

  if (!authenticated) {
    return <PasswordScreen onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="app-container" style={{ maxWidth: 500, margin: '40px auto', padding: 24, background: 'var(--card-bg)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 16 }}>🐾 Cat RAG Chat</h1>
      {catImg && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src={catImg} alt="Random Cat" style={{ maxWidth: '100%', borderRadius: 8, boxShadow: '0 2px 8px #0002' }} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="chat-form" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask a question about cats..."
          disabled={loading}
          className="chat-input"
          style={{ flex: 1, padding: 10, fontSize: 16, borderRadius: 6, background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--input-border)' }}
        />
        <button type="submit" disabled={loading || !query.trim()} style={{ padding: '0 18px', fontSize: 16, borderRadius: 6, background: '#ff9800', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {loading ? "Loading..." : "Ask"}
        </button>
      </form>
      <div className="chat-response" style={{ background: 'var(--input-bg)', borderRadius: 8, padding: 16, minHeight: 80, color: 'var(--text)' }}>
        {response && <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{response}</pre>}
      </div>

      <hr style={{ margin: '32px 0 24px 0', border: 'none', borderTop: '1px solid #eee' }} />
      <h2 style={{ textAlign: 'center', marginBottom: 12, fontSize: 20 }}>Add Your Own Cat Fact</h2>
      <form onSubmit={handleAddFact} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={fact}
          onChange={e => setFact(e.target.value)}
          placeholder="Enter a new cat fact..."
          className="chat-input"
          style={{ flex: 1, padding: 10, fontSize: 16, borderRadius: 6, background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--input-border)' }}
        />
        <button type="submit" style={{ padding: '0 18px', fontSize: 16, borderRadius: 6, background: '#4caf50', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Add Fact
        </button>
      </form>
      {factStatus && <div style={{ textAlign: 'center', color: factStatus.startsWith('✅') ? '#4caf50' : '#d32f2f', marginBottom: 8 }}>{factStatus}</div>}
    </div>
  );
}

export default App;

