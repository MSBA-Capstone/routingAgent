import { useState, useEffect, useRef } from 'react';
import './App.css';

import PasswordScreen from './components/PasswordScreen';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import TypingIndicator from './components/TypingIndicator';
import { GUIDED_FLOW, GUIDED_FLOW_COMPLETE_MESSAGE } from './guidedFlow';
import { useGuidedFlow } from './hooks/useGuidedFlow';
import { createMessage, updateMessage, addMessage } from './utils/messageUtils';

// Use VITE_API_BASE_URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const scrollRef = useRef(null);

  const {
    guidedMode,
    currentQuestionIndex,
    guidedAnswers,
    finishFlow,
    promptQuestion,
    storeGuidedAnswer,
  } = useGuidedFlow(authenticated, setMessages);

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
      setMessages(prev => updateMessage(prev, placeholderId, { text: answer }));
    } catch (err) {
      setMessages(prev => updateMessage(prev, placeholderId, { text: 'Error: ' + err.message }));
    }
    setLoading(false);
  };

  // Handle successful API response
  const handleApiSuccess = (data, question, questionIndex, placeholderId) => {
    const parsed = question.parseResponse
      ? question.parseResponse(data)
      : {
          answer: data.answer || data.message || 'No answer returned.',
          continueFlow: data.continue !== false,
        };
    const answerText = parsed.answer ?? 'No answer returned.';
    const shouldContinue = parsed.continueFlow !== false;

    setMessages(prev => updateMessage(prev, placeholderId, { text: answerText }));
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
  };

  // Handle API error
  const handleApiError = (error, question, questionIndex, placeholderId) => {
    setMessages(prev => updateMessage(prev, placeholderId, { text: 'Error: ' + error.message }));
    setLoading(false);
    promptQuestion(questionIndex, { repeat: true });
  };

  // Send guided answer to the question-specific endpoint
  const sendGuidedAnswer = async (text, question, questionIndex, replaceUserId) => {
    if (!question) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    // Handle user message
    let userMsgId = replaceUserId;
    if (replaceUserId) {
      setMessages(prev => updateMessage(prev, replaceUserId, { text: trimmed }));
    } else {
      userMsgId = `u-${Date.now()}-${Math.random()}`;
      const userMsg = createMessage('user', trimmed, { id: userMsgId });
      setMessages(prev => addMessage(prev, userMsg));
    }

    setInput("");
    const storageKey = question.storageKey || question.payloadKey || question.id;
    const answersAfterStore = storeGuidedAnswer(storageKey, trimmed);

    // Add acknowledgement message if present
    const ackText = question.acknowledgement;
    if (ackText) {
      const ackMsg = createMessage('assistant', ackText, { id: `g-ack-${question.id}-${Date.now()}` });
      setMessages(prev => addMessage(prev, ackMsg));
    }

    // Handle non-API questions
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

    // Create placeholder for assistant response
    const placeholderId = `a-${Date.now()}-${Math.random()}`;
    const placeholderMsg = createMessage('assistant', '...', {
      id: placeholderId,
      request: trimmed,
      inReplyTo: userMsgId
    });
    setMessages(prev => addMessage(prev, placeholderMsg));

    // Prepare request body
    const history = [...messages, placeholderMsg].map(m => ({ id: m.id, role: m.role, text: m.text }));
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

      if (question.endpoint === "/utility_itinerary") {
        handleUtilityItineraryResponse(data, question, questionIndex, placeholderId);
      } else {
        handleApiSuccess(data, question, questionIndex, placeholderId);
      }
    } catch (err) {
      handleApiError(err, question, questionIndex, placeholderId);
    }
  };

  // Handle utility itinerary response with polling
  const handleUtilityItineraryResponse = (data, question, questionIndex, placeholderId) => {
    const job_id = data.job_id;
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch(`${API_BASE_URL}/job_status/${job_id}`);
        const statusData = await statusRes.json();
        if (statusData.status === "completed") {
          clearInterval(pollInterval);
          const answerText = statusData.result.answer ?? 'No answer returned.';
          setMessages(prev => updateMessage(prev, placeholderId, { text: answerText }));
          setLoading(false);
          const nextIndex = questionIndex + 1;
          if (nextIndex < GUIDED_FLOW.length) {
            promptQuestion(nextIndex);
          } else {
            finishFlow();
          }
        } else if (statusData.status === "error") {
          clearInterval(pollInterval);
          setMessages(prev => updateMessage(prev, placeholderId, { text: 'Error: ' + statusData.result }));
          setLoading(false);
          promptQuestion(questionIndex, { repeat: true });
        }
      } catch (pollErr) {
        clearInterval(pollInterval);
        setMessages(prev => updateMessage(prev, placeholderId, { text: 'Error polling status: ' + pollErr.message }));
        setLoading(false);
        promptQuestion(questionIndex, { repeat: true });
      }
    }, 2000);
  };

  const sendMessage = async (text, opts = {}) => {
    if (!text.trim()) return;
    const { replaceUserId } = opts;

    let userMsgId = replaceUserId;
    if (!replaceUserId) {
      userMsgId = `u-${Date.now()}-${Math.random()}`;
      const userMsg = createMessage('user', text, { id: userMsgId });
      setMessages(prev => addMessage(prev, userMsg));
    } else {
      setMessages(prev => updateMessage(prev, replaceUserId, { text }));
    }

    setInput("");
    setLoading(true);

    const placeholderId = `a-${Date.now()}-${Math.random()}`;
    const placeholderMsg = createMessage('assistant', '...', {
      id: placeholderId,
      request: text,
      inReplyTo: userMsgId
    });
    setMessages(prev => addMessage(prev, placeholderMsg));

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
    setMessages(prev => updateMessage(prev, assistantMsg.id, { text: '...' }));
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

