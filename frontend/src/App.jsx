import { useState, useEffect, useRef } from 'react';
import './App.css';

import PasswordScreen from './components/PasswordScreen';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import TypingIndicator from './components/TypingIndicator';
import { GUIDED_FLOW, GUIDED_FLOW_COMPLETE_MESSAGE } from './guidedFlow';

// Use VITE_API_BASE_URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const scrollRef = useRef(null);

  const [guidedMode, setGuidedMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [guidedAnswers, setGuidedAnswers] = useState({});
  const guidedAnswersRef = useRef(guidedAnswers);

  useEffect(() => {
    guidedAnswersRef.current = guidedAnswers;
  }, [guidedAnswers]);

  useEffect(() => {
    if (!authenticated) return;

    const firstQuestion = GUIDED_FLOW[0];
    const initialMessages = [
      { id: 'welcome', role: 'assistant', text: 'Hi! I am your Road Trip assistant. I will guide you through a few questions.' },
    ];

    if (firstQuestion) {
      initialMessages.push({ id: `g-${firstQuestion.id}-0`, role: 'assistant', text: firstQuestion.prompt });
      setGuidedMode(true);
      setCurrentQuestionIndex(0);
    } else {
      setGuidedMode(false);
      setCurrentQuestionIndex(0);
    }

    guidedAnswersRef.current = {};
    setGuidedAnswers({});
    setMessages(initialMessages);
  }, [authenticated]);

  useEffect(() => {
    // auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const finishFlow = () => {
    setGuidedMode(false);
    setCurrentQuestionIndex(GUIDED_FLOW.length);
    setMessages(prev => {
      const alreadyComplete = prev.some(m => m.meta === 'guided-complete');
      if (alreadyComplete) {
        return prev;
      }
      return [
        ...prev,
      ];
    });
  };

  const promptQuestion = (index, options = {}) => {
    const question = GUIDED_FLOW[index];
    if (!question) {
      finishFlow();
      return;
    }

    const { repeat = false } = options;
    const text = repeat && question.repeatPrompt ? question.repeatPrompt : question.prompt;

    setMessages(prev => [
      ...prev,
      {
        id: `g-${question.id}-${Date.now()}`,
        role: 'assistant',
        text,
      },
    ]);
    setGuidedMode(true);
    setCurrentQuestionIndex(index);
  };

  const storeGuidedAnswer = (key, value) => {
    if (!key) {
      return guidedAnswersRef.current;
    }
    const next = { ...guidedAnswersRef.current, [key]: value };
    guidedAnswersRef.current = next;
    setGuidedAnswers(next);
    return next;
  };

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
  const sendGuidedAnswer = async (text, question, questionIndex, replaceUserId) => {
    if (!question) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    let userMsgId = replaceUserId;
    if (replaceUserId) {
      setMessages(prev => prev.map(m => (m.id === replaceUserId ? { ...m, text: trimmed } : m)));
    } else {
      userMsgId = `u-${Date.now()}-${Math.random()}`;
      const userMsg = { id: userMsgId, role: 'user', text: trimmed };
      setMessages(prev => [...prev, userMsg]);
    }

    setInput("");
    const storageKey = question.storageKey || question.payloadKey || question.id;
    const answersAfterStore = storeGuidedAnswer(storageKey, trimmed);

    const ackText = question.acknowledgement;
    if (ackText) {
      setMessages(prev => [
        ...prev,
        { id: `g-ack-${question.id}-${Date.now()}`, role: 'assistant', text: ackText },
      ]);
    }

    if (question.mode !== 'api') {
      setLoading(false);
      const nextIndex = questionIndex + 1;
      if (nextIndex < GUIDED_FLOW.length) {
        promptQuestion(nextIndex);
      } else {
        finishFlow();
      }
      return;
    }

    setLoading(true);

    const placeholderId = `a-${Date.now()}-${Math.random()}`;
    let historyMessages = [];
    setMessages(prev => {
      const updated = [
        ...prev,
        { id: placeholderId, role: 'assistant', text: '...', request: trimmed, inReplyTo: userMsgId },
      ];
      historyMessages = updated;
      return updated;
    });

    const history = historyMessages.map(m => ({ id: m.id, role: m.role, text: m.text }));
    const body = question.buildPayload
      ? question.buildPayload({ answers: answersAfterStore, currentAnswer: trimmed, history })
      : {
          [question.payloadKey || 'response']: trimmed,
          history,
          questionId: question.id,
          answers: answersAfterStore,
        };

    try {
      const res = await fetch(`${API_BASE_URL}${question.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const parsed = question.parseResponse
        ? question.parseResponse(data)
        : {
            answer: data.answer || data.message || 'No answer returned.',
            continueFlow: data.continue !== false,
          };
      const answerText = parsed.answer ?? 'No answer returned.';
      const shouldContinue = parsed.continueFlow !== false;
      setMessages(prev => prev.map(m => (m.id === placeholderId ? { ...m, text: answerText } : m)));
      setLoading(false);

      if (!shouldContinue) {
        const targetIndex = question.repeatIndex !== undefined ? question.repeatIndex : questionIndex;
        promptQuestion(targetIndex, { repeat: question.repeatIndex === undefined });
        return;
      }

      const nextIndex = questionIndex + 1;
      if (nextIndex < GUIDED_FLOW.length) {
        promptQuestion(nextIndex);
      } else {
        finishFlow();
      }
    } catch (err) {
      setMessages(prev => prev.map(m => (m.id === placeholderId ? { ...m, text: 'Error: ' + err.message } : m)));
      setLoading(false);
      promptQuestion(questionIndex, { repeat: true });
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

  const handleSubmit = (e, overrideText) => {
    let text;
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      text = overrideText || input;
    } else {
      text = e || input;  // e is the overrideText when called from button
    }
    if (loading) return;
    setInput("");
    if (editingMessageId) {
      // find index of the user message we're editing and truncate messages to that point
      const idx = messages.findIndex(m => m.id === editingMessageId && m.role === 'user');
      if (idx !== -1) {
        const before = messages.slice(0, idx + 1).map(m => (m.id === editingMessageId ? { ...m, text: text } : m));
        setMessages(before);
        // send updated message and replace the existing user message
        if (guidedMode) {
          // when editing during guided flow, re-run the handler for the active question
          const maxIndex = GUIDED_FLOW.length > 0 ? GUIDED_FLOW.length - 1 : 0;
          const qIndex = currentQuestionIndex < GUIDED_FLOW.length ? currentQuestionIndex : maxIndex;
          const q = GUIDED_FLOW[qIndex];
          if (q) {
            sendGuidedAnswer(text, q, qIndex, editingMessageId);
          }
        } else {
          sendMessage(text, { replaceUserId: editingMessageId });
        }
      }
      setEditingMessageId(null);
    } else {
      if (guidedMode) {
        // submit answer to current guided question
        const q = GUIDED_FLOW[currentQuestionIndex];
        if (q) sendGuidedAnswer(text, q, currentQuestionIndex);
      } else {
        sendMessage(text);
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
       <h1 style={{ textAlign: 'center', marginBottom: 8 }}>🗺️ Trip Planning Assistant</h1>

  <ChatWindow messages={messages} scrollRef={scrollRef} onRetry={handleRetry} onEdit={handleEdit} />

  <MessageInput input={input} setInput={setInput} onSubmit={handleSubmit} loading={loading} editingMessageId={editingMessageId} onCancelEdit={handleCancelEdit} options={guidedMode ? GUIDED_FLOW[currentQuestionIndex]?.options : null} />

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

