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
    <div className="max-w-md mx-auto my-20 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-center mb-4 text-xl font-bold text-gray-900 dark:text-white">🔒 Enter Access Password</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="px-3 py-2 text-lg rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !password.trim()}
          className="py-2 text-lg rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          {loading ? "Validating..." : "Enter"}
        </button>
      </form>
      {error && <div className="text-center text-red-600 dark:text-red-400 mt-3">{error}</div>}
    </div>
  );
}

export default PasswordScreen;
