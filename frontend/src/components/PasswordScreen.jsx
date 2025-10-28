import { useState } from 'react';

function PasswordScreen({ onSuccess, apiBaseUrl }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBaseUrl}/validate_password`, {
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

export default PasswordScreen;
