import { useState, useEffect, useRef } from 'react';
import api from '../config/api';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      setFetchingHistory(true);
      const res = await api.get('/api/chat/history');
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Could not retrieve conversation history.');
    } finally {
      setFetchingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      message: inputText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    const originalText = inputText;
    setInputText('');
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/chat', { message: originalText });
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        message: res.data.reply,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('The AI companion is currently meditating. Please try again in a moment.');
      // Restore user text in case they want to retry
      setInputText(originalText);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to permanently clear this conversation history?')) return;
    try {
      setLoading(true);
      await api.delete('/api/chat/history');
      setMessages([]);
      setError('');
    } catch (err) {
      console.error('Error clearing chat history:', err);
      setError('Could not clear history.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>AI Companion</h2>
          <p>Have an open reflection. The AI uses your historical journal context to provide support.</p>
        </div>
        {messages.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleClearHistory} disabled={loading}>
            🗑️ Clear Chat
          </button>
        )}
      </div>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--error)', padding: 12, marginBottom: 16, color: 'var(--error)' }}>
          {error}
        </div>
      )}

      <div className="card chat-container">
        <div className="chat-messages">
          {fetchingHistory ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Retrieving context...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              <p style={{ fontSize: 44, marginBottom: 12 }}>🌿</p>
              <h4>Meet your ReflectAI Companion</h4>
              <p style={{ maxWidth: 380, margin: '8px auto 0', fontSize: 13, lineHeight: 1.6 }}>
                Ask questions, reflect on your goals, explore challenges, or talk about what is causing you stress.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}
              >
                <div style={{ fontWeight: 600, fontSize: 11, color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--primary-light)', marginBottom: 4 }}>
                  {msg.role === 'user' ? 'You' : 'Companion'}
                </div>
                <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {msg.message}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="chat-bubble ai skeleton" style={{ width: '120px', height: '40px', alignSelf: 'flex-start' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reflecting...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-row">
          <input
            type="text"
            className="input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={loading ? "AI is replying..." : "Type your reflection message here..."}
            disabled={loading || fetchingHistory}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !inputText.trim() || fetchingHistory}>
            Send ↗
          </button>
        </form>
      </div>
    </div>
  );
}
