import ChatBubble from './ChatBubble';

function ChatWindow({ messages, scrollRef, onRetry, onEdit }) {
  // find the last assistant message id so only that one shows Retry
  let latestAssistantId = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') { latestAssistantId = messages[i].id; break; }
  }

  return (
    <div ref={scrollRef} style={{ overflowY: 'auto', padding: 12, flex: 1, borderRadius: 8, border: '1px solid var(--input-border)', background: 'var(--bg)' }}>
      {messages.map(msg => (
        <ChatBubble key={msg.id} message={msg} onRetry={onRetry} onEdit={onEdit} isLatestAssistant={msg.id === latestAssistantId} />
      ))}
    </div>
  );
}

export default ChatWindow;
