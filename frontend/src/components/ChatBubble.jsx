import React from 'react';
import TypingIndicator from './TypingIndicator';

function ChatBubble({ message, onRetry, onEdit, isLatestAssistant }) {
  const isUser = message.role === 'user';
  const containerStyle = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: 8
  };
  const bubbleStyle = {
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: 14,
    background: isUser ? '#1976d2' : 'var(--input-bg)',
    color: isUser ? '#fff' : 'var(--text)',
    boxShadow: 'var(--shadow)'
  };

  // Render typing indicator inside the assistant bubble when placeholder used
  const content = message.text === '...' && message.role === 'assistant'
    ? <TypingIndicator />
    : message.text;

  return (
    <div style={containerStyle}>
      <div style={bubbleStyle}>
        {content}
        <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          {message.role === 'assistant' && isLatestAssistant && (
            <button onClick={() => onRetry && onRetry(message)} style={{ background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer' }}>
              Retry
            </button>
          )}
          {message.role === 'user' && (
            <button onClick={() => onEdit && onEdit(message)} style={{ border: 'none', color: '#1976d2', cursor: 'pointer' }}>
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatBubble;
