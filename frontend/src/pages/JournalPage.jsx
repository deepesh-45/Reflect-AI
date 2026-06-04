import { useState, useEffect } from 'react';
import api from '../config/api';

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/journal');
      setEntries(res.data);
      if (res.data.length > 0 && !selectedEntry) {
        setSelectedEntry(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching journal entries:', err);
      setError('Could not fetch your journal entries. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setIsEditing(false);
    setError('');
  };

  const handleStartNew = () => {
    setSelectedEntry(null);
    setIsEditing(true);
    setTitle('');
    setContent('');
    setError('');
  };

  const handleStartEdit = () => {
    if (!selectedEntry) return;
    setIsEditing(true);
    setTitle(selectedEntry.title);
    setContent(selectedEntry.content);
    setError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
    // Restore selection
    if (selectedEntry) {
      setTitle(selectedEntry.title);
      setContent(selectedEntry.content);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Both title and content are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      if (selectedEntry?.id) {
        // Update existing
        const res = await api.put(`/api/journal/${selectedEntry.id}`, { title, content });
        const updated = res.data.entry;
        setEntries(entries.map(item => item.id === updated.id ? updated : item));
        setSelectedEntry(updated);
      } else {
        // Create new
        const res = await api.post('/api/journal', { title, content });
        const newEntry = res.data.entry;
        setEntries([newEntry, ...entries]);
        setSelectedEntry(newEntry);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError('Failed to save and analyze entry. Please verify API access.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry?.id) return;
    if (!window.confirm('Are you sure you want to delete this reflection?')) return;

    try {
      setSubmitting(true);
      await api.delete(`/api/journal/${selectedEntry.id}`);
      const updatedEntries = entries.filter(item => item.id !== selectedEntry.id);
      setEntries(updatedEntries);
      setSelectedEntry(updatedEntries.length > 0 ? updatedEntries[0] : null);
      setIsEditing(false);
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Could not delete entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Smart Journal</h2>
          <p>Document your thoughts. Our AI analyses emotional context in real-time.</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary" onClick={handleStartNew}>
            ✍️ New Entry
          </button>
        )}
      </div>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--error)', padding: 14, marginBottom: 20, color: 'var(--error)' }}>
          {error}
        </div>
      )}

      <div className="grid-3" style={{ gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'stretch' }}>
        {/* Left Side: Entries List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          {loading && entries.length === 0 ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="card skeleton" style={{ height: 90 }}></div>
            ))
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📓</p>
              <p>Your journal is empty.</p>
            </div>
          ) : (
            entries.map(entry => (
              <div 
                key={entry.id} 
                className={`journal-item ${selectedEntry?.id === entry.id ? 'active' : ''}`}
                onClick={() => handleSelectEntry(entry)}
                style={{ 
                  borderColor: selectedEntry?.id === entry.id ? 'var(--primary)' : 'var(--border)',
                  background: selectedEntry?.id === entry.id ? 'var(--surface2)' : 'var(--surface)'
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className={`emotion-badge emotion-${entry.emotion || 'Neutral'}`}>
                      {entry.emotion || 'Neutral'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {entry.confidence || 50}%
                    </span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.title}
                  </h4>
                  <div className="journal-date">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Side: View or Edit Pane */}
        <div>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3>{selectedEntry ? 'Edit Reflection' : 'New Reflection'}</h3>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input 
                  type="text" 
                  className="input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="How is your day going?" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Write your thoughts</label>
                <textarea 
                  className="textarea" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Express yourself freely. Reflect on your events, concerns, achievements, or mood..." 
                  style={{ minHeight: 280 }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={handleCancelEdit} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Analyzing & Saving...' : 'Save Reflection'}
                </button>
              </div>
            </form>
          ) : selectedEntry ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    {formatDate(selectedEntry.createdAt)}
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700 }}>{selectedEntry.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={handleStartEdit}>
                    ✏️ Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={submitting}>
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Emotion insights panel */}
              <div className="grid-2" style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                    AI EMOTIONAL ANALYSIS
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`emotion-badge emotion-${selectedEntry.emotion || 'Neutral'}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                      {selectedEntry.emotion || 'Neutral'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      {selectedEntry.confidence || 50}% Confidence
                    </span>
                  </div>
                  <div className="confidence-bar" style={{ marginTop: 12, maxWidth: 220 }}>
                    <div 
                      className="confidence-fill" 
                      style={{ 
                        width: `${selectedEntry.confidence || 50}%`,
                        background: `var(--${(selectedEntry.emotion || 'Neutral').toLowerCase()})`
                      }} 
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                    DETECTED TRIGGERS / THEMES
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedEntry.triggers && selectedEntry.triggers.length > 0 ? (
                      selectedEntry.triggers.map((t, idx) => (
                        <span key={idx} style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 4 }}>
                          🏷️ {t}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        None detected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Journal Body */}
              <div style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
                {selectedEntry.content}
              </div>

              {/* Weekly/Immediate feedback */}
              {selectedEntry.reflectionFeedback && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 10 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary-light)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🌱 Supportive AI Insight
                  </h4>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {selectedEntry.reflectionFeedback}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>📓</p>
              <h3>Welcome to Smart Journal</h3>
              <p style={{ maxWidth: 400, margin: '8px auto 20px' }}>
                Reflect on your day, your stress points, or your happy moments. Our companion will auto-tag your emotions.
              </p>
              <button className="btn btn-primary" onClick={handleStartNew}>
                Write Your First Entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
