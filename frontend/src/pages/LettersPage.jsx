import { useState, useEffect } from 'react';
import api from '../config/api';

export default function LettersPage() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Creation Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockOption, setUnlockOption] = useState('1M');
  const [submitting, setSubmitting] = useState(false);

  // Read Modal State
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [readError, setReadError] = useState('');

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/letters');
      setLetters(res.data);
    } catch (err) {
      console.error('Error fetching letters:', err);
      setError('Could not retrieve letters from vault.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLetter = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const res = await api.post('/api/letters', { title, content, unlockOption });
      setSuccess(res.data.message);
      setTitle('');
      setContent('');
      fetchLetters(); // Refresh list
    } catch (err) {
      console.error('Error creating letter:', err);
      setError('Failed to seal future letter. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenLetter = async (letter) => {
    if (letter.locked) {
      alert(`This letter is securely sealed. Come back after ${new Date(letter.unlockDate).toLocaleString()} to open it!`);
      return;
    }

    try {
      setLoadingLetter(true);
      setReadError('');
      const res = await api.get(`/api/letters/${letter.id}`);
      setSelectedLetter(res.data);
    } catch (err) {
      console.error('Error reading letter:', err);
      setReadError('Failed to read letter. Details may be sealed.');
    } finally {
      setLoadingLetter(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div>
      <div className="page-header">
        <h2>Future Letters Vault</h2>
        <p>Write letters to your future self about your current dreams, worries, or advice. They remain cryptographically sealed until their unlock date.</p>
      </div>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--error)', padding: 12, marginBottom: 16, color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="card" style={{ borderLeft: '4px solid var(--success)', padding: 12, marginBottom: 16, color: 'var(--success)' }}>
          {success}
        </div>
      )}

      <div className="grid-2">
        {/* Write Letter Form */}
        <form onSubmit={handleCreateLetter} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Write to Your Future Self</h3>
          
          <div className="form-group">
            <label className="form-label">Letter Title</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Read this when you graduate"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unlock Time Lock</label>
            <select
              className="input"
              value={unlockOption}
              onChange={(e) => setUnlockOption(e.target.value)}
            >
              <option value="test-1m">⏳ 1 Minute (Test Mode)</option>
              <option value="1M">📅 1 Month</option>
              <option value="3M">📅 3 Months</option>
              <option value="6M">📅 6 Months</option>
              <option value="1Y">📅 1 Year</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Letter Body</label>
            <textarea
              className="textarea"
              placeholder="What do you want to remind yourself of? How do you think you will change? Write everything down..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ minHeight: 180 }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting || !title.trim() || !content.trim()}>
            {submitting ? 'Sealing letter...' : 'Lock and Seal Letter 🔒'}
          </button>
        </form>

        {/* Vault List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          <h3 className="card-title">💌 Sealed Letters</h3>
          
          {loading && letters.length === 0 ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8 }}></div>
            ))
          ) : letters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
              <p style={{ fontSize: 44, marginBottom: 12 }}>🔒</p>
              <p>Your vault is empty. Seal your first letter.</p>
            </div>
          ) : (
            letters.map((letter) => (
              <div 
                key={letter.id} 
                className="letter-card" 
                onClick={() => handleOpenLetter(letter)}
                style={{ 
                  cursor: 'pointer', 
                  background: letter.locked ? 'var(--surface)' : 'rgba(139,168,153,0.06)',
                  borderColor: letter.locked ? 'var(--border)' : 'rgba(139,168,153,0.3)',
                  padding: 16
                }}
              >
                <div className="letter-lock-icon" style={{ 
                  color: letter.locked ? 'var(--accent)' : 'var(--success)', 
                  background: letter.locked ? 'var(--surface2)' : 'rgba(129,201,149,0.1)' 
                }}>
                  {letter.locked ? '🔒' : '🔓'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {letter.title}
                  </h4>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Written on {formatDate(letter.createdAt)}
                  </div>
                  <div style={{ fontSize: 11, color: letter.locked ? 'var(--accent)' : 'var(--success)', fontWeight: 600, marginTop: 4 }}>
                    {letter.locked 
                      ? `Locked until ${new Date(letter.unlockDate).toLocaleString()}`
                      : 'Ready to read'
                    }
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Read Letter Modal */}
      {selectedLetter && (
        <div className="modal-overlay" onClick={() => setSelectedLetter(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Written: {formatDate(selectedLetter.createdAt)} • Unlocked: {formatDate(selectedLetter.unlockDate)}
                </span>
                <h3 className="modal-title" style={{ marginTop: 4 }}>{selectedLetter.title}</h3>
              </div>
              <button className="close-btn" onClick={() => setSelectedLetter(null)}>×</button>
            </div>
            
            {readError ? (
              <div style={{ color: 'var(--error)', padding: 12, borderRadius: 6, background: 'rgba(242,139,130,0.1)' }}>
                {readError}
              </div>
            ) : (
              <div style={{ 
                marginTop: 10,
                fontSize: 14, 
                lineHeight: 1.8, 
                color: 'var(--text)', 
                whiteSpace: 'pre-wrap', 
                maxHeight: '380px', 
                overflowY: 'auto',
                paddingRight: 8
              }}>
                {selectedLetter.content}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLetter(null)}>
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
