import { useState, useEffect, useRef } from 'react';
import './App.css';

import PasswordScreen from './components/PasswordScreen';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import TypingIndicator from './components/TypingIndicator';

// Use VITE_API_BASE_URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (authenticated) {
      // welcome message
      setMessages([{ id: 'welcome', role: 'assistant', text: 'Hi! I am your Cat RAG assistant. I will guide you through a few questions.' }]);
      // start guided flow automatically (GUIDED_QUESTIONS is a constant defined next to hooks so it's stable)
      setGuidedMode(true);
      setCurrentQuestionIndex(0);
      const q0 = GUIDED_QUESTIONS[0];
      if (q0) setMessages(prev => [...prev, { id: `g-${q0.id}`, role: 'assistant', text: q0.question }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  // Pre-determined guided questions. Each question maps to an endpoint and a payload key
  const GUIDED_QUESTIONS = [
    { id: 'q1', question: 'What is your name?', endpoint: '/query', payloadKey: 'query' },
    { id: 'q2', question: 'Tell me a cat fact you want to add to our dataset.', endpoint: '/query', payloadKey: 'query' },
    { id: 'q3', question: 'Any additional notes or context?', endpoint: '/query', payloadKey: 'query' }
  ];

  const [guidedMode, setGuidedMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    // auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // helper to post query and update a placeholder assistant message
  const postQuery = async (queryText, placeholderId) => {
    try {
      // include conversation history with the request
      const history = messages.map(m => ({ id: m.id, role: m.role, text: m.text }));
      const res = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, history })
      });
      const data = await res.json();
      const answer = data.answer || 'No answer returned.';
      setMessages(prev => prev.map(m => (m.id === placeholderId ? { ...m, text: answer } : m)));
    } catch (err) {
      setMessages(prev => prev.map(m => (m.id === placeholderId ? { ...m, text: 'Error: ' + err.message } : m)));
    }
    setLoading(false);
  };

  // Send guided answer to the question-specific endpoint
  const sendGuidedAnswer = async (text, question, replaceUserId) => {
    if (!question) return;
    const qId = question.id;

    let userMsgId = replaceUserId;
    if (!replaceUserId) {
      userMsgId = `u-${Date.now()}-${Math.random()}`;
      const userMsg = { id: userMsgId, role: 'user', text };
      setMessages(prev => [...prev, userMsg]);
    } else {
      setMessages(prev => prev.map(m => (m.id === replaceUserId ? { ...m, text } : m)));
    }

    setInput("");
    setLoading(true);

    const placeholderId = `a-${Date.now()}-${Math.random()}`;
    setMessages(prev => [...prev, { id: placeholderId, role: 'assistant', text: '...', request: text, inReplyTo: userMsgId }]);

  // build the request body using payloadKey and include conversation history
  const payloadKey = question.payloadKey || 'response';
  const history = messages.map(m => ({ id: m.id, role: m.role, text: m.text }));
  const body = { [payloadKey]: text, questionId: qId, history };

    try {
      const res = await fetch(`${API_BASE_URL}${question.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      // attempt to prefer common keys
      const answer = data.answer || data.message || data.result || data.success && data.message || 'No answer returned.';
      setMessages(prev => prev.map(m => (m.id === placeholderId ? { ...m, text: answer } : m)));
    } catch (err) {
      setMessages(prev => prev.map(m => (m.id === placeholderId ? { ...m, text: 'Error: ' + err.message } : m)));
    }

    setLoading(false);

    // advance to next question if available
    const nextIndex = Math.min(currentQuestionIndex + 1, GUIDED_QUESTIONS.length);
    if (nextIndex < GUIDED_QUESTIONS.length) {
      const nextQ = GUIDED_QUESTIONS[nextIndex];
      setCurrentQuestionIndex(nextIndex);
      setMessages(prev => [...prev, { id: `g-${nextQ.id}`, role: 'assistant', text: nextQ.question }]);
    } else {
      // finished
      setGuidedMode(false);
      setMessages(prev => [...prev, { id: `g-done`, role: 'assistant', text: 'Thanks — that completes the guided questions.' }]);
    }
  };

  const sendMessage = async (text, opts = {}) => {
    if (!text.trim()) return;
    const { replaceUserId } = opts;

    let userMsgId = replaceUserId;
    if (!replaceUserId) {
      userMsgId = `u-${Date.now()}-${Math.random()}`;
      const userMsg = { id: userMsgId, role: 'user', text };
      setMessages(prev => [...prev, userMsg]);
    } else {
      // update existing user message text
      setMessages(prev => prev.map(m => (m.id === replaceUserId ? { ...m, text } : m)));
    }

    setInput("");
    setLoading(true);

    const placeholderId = `a-${Date.now()}-${Math.random()}`;
    // store original request on the assistant message so Retry can re-use it
    setMessages(prev => [...prev, { id: placeholderId, role: 'assistant', text: '...', request: text, inReplyTo: userMsgId }]);

    await postQuery(text, placeholderId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (editingMessageId) {
      // find index of the user message we're editing and truncate messages to that point
      const idx = messages.findIndex(m => m.id === editingMessageId && m.role === 'user');
      if (idx !== -1) {
        const before = messages.slice(0, idx + 1).map(m => (m.id === editingMessageId ? { ...m, text: input } : m));
        setMessages(before);
        // send updated message and replace the existing user message
        if (guidedMode) {
          // when editing during guided flow, re-run the endpoint for the current question
          const q = GUIDED_QUESTIONS[currentQuestionIndex] || GUIDED_QUESTIONS[GUIDED_QUESTIONS.length - 1];
          sendGuidedAnswer(input, q, editingMessageId);
        } else {
          sendMessage(input, { replaceUserId: editingMessageId });
        }
      }
      setEditingMessageId(null);
    } else {
      if (guidedMode) {
        // submit answer to current guided question
        const q = GUIDED_QUESTIONS[currentQuestionIndex];
        if (q) sendGuidedAnswer(input, q);
      } else {
        sendMessage(input);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setInput("");
  };

  // Retry handler for assistant responses
  const handleRetry = async (assistantMsg) => {
    if (loading) return;
    const req = assistantMsg.request;
    if (!req) return;
    setLoading(true);
    // set assistant message back to placeholder
    setMessages(prev => prev.map(m => (m.id === assistantMsg.id ? { ...m, text: '...' } : m)));
    await postQuery(req, assistantMsg.id);
  };

  // Edit handler for user messages
  const handleEdit = (userMsg) => {
    setEditingMessageId(userMsg.id);
    setInput(userMsg.text);
  };

  if (!authenticated) {
    return <PasswordScreen onSuccess={() => setAuthenticated(true)} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div className="app-container" style={{ maxWidth: 700, margin: '24px auto', padding: 18, background: 'var(--card-bg)', borderRadius: 12, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', height: '80vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>🐾 Cat RAG Chat</h1>

  <ChatWindow messages={messages} scrollRef={scrollRef} onRetry={handleRetry} onEdit={handleEdit} />

  <MessageInput input={input} setInput={setInput} onSubmit={handleSubmit} loading={loading} editingMessageId={editingMessageId} onCancelEdit={handleCancelEdit} />

      {/* Thinking status while waiting for assistant */}
      {loading && (
        <div style={{ textAlign: 'center', color: '#666', fontSize: 13, marginTop: 8 }}>
          Assistant is thinking <TypingIndicator />
        </div>
      )}
    </div>
  );
}

export default App;

