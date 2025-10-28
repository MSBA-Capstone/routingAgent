function MessageInput({ input, setInput, onSubmit, loading, editingMessageId, onCancelEdit, options }) {
  if (options && !editingMessageId) {
    return (
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {options.map(option => (
          <button key={option} type="button" onClick={() => onSubmit(option)} disabled={loading} style={{ padding: '10px 16px', fontSize: 16, borderRadius: 6, background: '#ff9800', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {option}
          </button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type a message..."
        className="chat-input"
        style={{ flex: 1, padding: 10, fontSize: 16, borderRadius: 6, background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--input-border)' }}
        disabled={loading}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        {editingMessageId && (
          <button type="button" onClick={onCancelEdit} style={{ padding: '0 12px', fontSize: 14, borderRadius: 6, background: '#9e9e9e', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading || !input.trim()} style={{ padding: '0 18px', fontSize: 16, borderRadius: 6, background: '#ff9800', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {loading ? 'Sending...' : (editingMessageId ? 'Update' : 'Send')}
        </button>
      </div>
    </form>
  );
}

export default MessageInput;
