import { useState, useEffect } from 'react';
import api from '../config/api';

export default function PoetryPage() {
  const [activeTab, setActiveTab] = useState('assistant'); // 'assistant' or 'poetry'
  
  // Writing Assistant State
  const [textToEnhance, setTextToEnhance] = useState('');
  const [enhanceAction, setEnhanceAction] = useState('Improve Expression');
  const [enhancedText, setEnhancedText] = useState('');
  const [loadingEnhance, setLoadingEnhance] = useState(false);
  const [enhanceError, setEnhanceError] = useState('');

  // Poetry State
  const [poetryInput, setPoetryInput] = useState('');
  const [poetryStyle, setPoetryStyle] = useState('Free Verse');
  const [generatedPoem, setGeneratedPoem] = useState('');
  const [loadingPoem, setLoadingPoem] = useState(false);
  const [poemError, setPoemError] = useState('');
  const [savedPoems, setSavedPoems] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [journals, setJournals] = useState([]);
  const [selectedJournalId, setSelectedJournalId] = useState('');

  useEffect(() => {
    if (activeTab === 'poetry') {
      fetchPoemLibrary();
      fetchJournals();
    }
  }, [activeTab]);

  const fetchJournals = async () => {
    try {
      const res = await api.get('/api/journal');
      setJournals(res.data);
    } catch (err) {
      console.error('Error fetching journals:', err);
    }
  };

  const fetchPoemLibrary = async () => {
    try {
      setLoadingLibrary(true);
      const res = await api.get('/api/assistant/poetry');
      setSavedPoems(res.data);
    } catch (err) {
      console.error('Error fetching poems:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleEnhance = async (e) => {
    e.preventDefault();
    if (!textToEnhance.trim()) return;

    try {
      setLoadingEnhance(true);
      setEnhanceError('');
      setEnhancedText('');
      const res = await api.post('/api/assistant/write-assist', {
        text: textToEnhance,
        action: enhanceAction
      });
      setEnhancedText(res.data.enhanced);
    } catch (err) {
      console.error('Enhancement error:', err);
      setEnhanceError('Failed to enhance text. Please verify service availability.');
    } finally {
      setLoadingEnhance(false);
    }
  };

  const handleGeneratePoem = async (e) => {
    e.preventDefault();
    if (!poetryInput.trim()) return;

    try {
      setLoadingPoem(true);
      setPoemError('');
      setGeneratedPoem('');
      const res = await api.post('/api/assistant/poetry', {
        text: poetryInput,
        journalId: selectedJournalId || null,
        style: poetryStyle
      });
      setGeneratedPoem(res.data.poem.generatedPoem);
      // Prepend to library
      setSavedPoems([res.data.poem, ...savedPoems]);
      setPoetryInput('');
      setSelectedJournalId('');
    } catch (err) {
      console.error('Poem generation error:', err);
      setPoemError('Failed to transform your reflection into poetry.');
    } finally {
      setLoadingPoem(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div>
      <div className="page-header">
        <h2>Creative Assistant</h2>
        <p>Use generative AI to refine your emotional writing or transform your thoughts into expressive poetry.</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'assistant' ? 'active' : ''}`}
          onClick={() => setActiveTab('assistant')}
        >
          ✍️ Writing Assistant
        </button>
        <button 
          className={`tab ${activeTab === 'poetry' ? 'active' : ''}`}
          onClick={() => setActiveTab('poetry')}
        >
          🎭 Poetry Generator
        </button>
      </div>

      {activeTab === 'assistant' ? (
        /* WRITING ASSISTANT TAB */
        <div className="grid-2">
          {/* Input Side */}
          <form onSubmit={handleEnhance} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Draft Your Thoughts</h3>
            
            <div className="form-group">
              <label className="form-label">Select Adjustment Mode</label>
              <select 
                className="input" 
                value={enhanceAction}
                onChange={(e) => setEnhanceAction(e.target.value)}
              >
                <option value="Improve Expression">Improve Expression</option>
                <option value="Improve Vocabulary">Improve Vocabulary</option>
                <option value="Correct Grammar">Correct Grammar</option>
                <option value="Enhance Emotional Depth">Enhance Emotional Depth</option>
                <option value="Rewrite Thoughtfully">Rewrite Thoughtfully</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Original Text</label>
              <textarea
                className="textarea"
                placeholder="Type or paste your journal entry text here..."
                value={textToEnhance}
                onChange={(e) => setTextToEnhance(e.target.value)}
                style={{ minHeight: 200 }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loadingEnhance || !textToEnhance.trim()}>
              {loadingEnhance ? 'Refining text...' : 'Enhance Text ✨'}
            </button>
          </form>

          {/* Output Side */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>AI Refined Content</h3>
              {enhancedText && (
                <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(enhancedText)}>
                  📋 Copy
                </button>
              )}
            </div>

            {enhanceError && (
              <div style={{ color: 'var(--error)', fontSize: 13, background: 'rgba(242,139,130,0.1)', padding: 12, borderRadius: 6 }}>
                {enhanceError}
              </div>
            )}

            {loadingEnhance ? (
              <div className="skeleton" style={{ flex: 1, minHeight: 200, padding: 16 }}></div>
            ) : enhancedText ? (
              <div style={{ 
                flex: 1, 
                padding: 16, 
                background: 'var(--bg2)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-sm)',
                lineHeight: 1.6,
                fontSize: 14,
                whiteSpace: 'pre-wrap',
                color: 'var(--text)'
              }}>
                {enhancedText}
              </div>
            ) : (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--text-dim)', 
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-sm)',
                minHeight: 200,
                textAlign: 'center',
                padding: 20
              }}>
                Select an action and click Enhance to preview improved writing.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* POETRY GENERATOR TAB */
        <div className="grid-3" style={{ gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'stretch' }}>
          {/* Left panel: Creator & Active Poem */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Generate form */}
            <form onSubmit={handleGeneratePoem} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Convert Ideas to Art</h3>
              <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Poetic Style</label>
                  <select 
                    className="input" 
                    value={poetryStyle}
                    onChange={(e) => setPoetryStyle(e.target.value)}
                  >
                    <option value="Free Verse">Free Verse</option>
                    <option value="Reflective">Reflective</option>
                    <option value="Motivational">Motivational</option>
                    <option value="Emotional">Emotional</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Transform a Saved Journal (Optional)</label>
                  <select 
                    className="input" 
                    value={selectedJournalId}
                    onChange={(e) => {
                      const jId = e.target.value;
                      setSelectedJournalId(jId);
                      if (jId) {
                        const selectedJ = journals.find(j => j.id === jId);
                        if (selectedJ) {
                          setPoetryInput(selectedJ.content);
                        }
                      } else {
                        setPoetryInput('');
                      }
                    }}
                  >
                    <option value="">-- Choose from your journals --</option>
                    {journals.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({new Date(j.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Describe your mood or paste draft points</label>
                <textarea
                  className="textarea"
                  placeholder="E.g., Today was overwhelming but I finished my exams. The weight has lifted but I feel incredibly tired..."
                  value={poetryInput}
                  onChange={(e) => setPoetryInput(e.target.value)}
                  style={{ minHeight: 100 }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loadingPoem || !poetryInput.trim()}>
                {loadingPoem ? 'Weaving poem...' : 'Generate Poetry 🎭'}
              </button>
            </form>

            {/* Display Active Poem */}
            {(generatedPoem || loadingPoem) && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary-light)' }}>
                    ✨ Newly Formed {poetryStyle} Poem
                  </h4>
                  {generatedPoem && (
                    <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(generatedPoem)}>
                      📋 Copy Poem
                    </button>
                  )}
                </div>

                {poemError && (
                  <div style={{ color: 'var(--error)', fontSize: 13, background: 'rgba(242,139,130,0.1)', padding: 12, borderRadius: 6 }}>
                    {poemError}
                  </div>
                )}

                {loadingPoem ? (
                  <div className="skeleton" style={{ height: 180 }}></div>
                ) : (
                  <div className="poem-text">
                    {generatedPoem}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel: Poetry Library */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
            <h3 className="card-title" style={{ marginBottom: 12 }}>📚 Poem Library</h3>
            
            {loadingLibrary ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 90, marginBottom: 12, borderRadius: 8 }}></div>
              ))
            ) : savedPoems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)', fontSize: 13 }}>
                Your poetry library is empty. Generate a poem to save it here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {savedPoems.map((poem) => (
                  <div 
                    key={poem.id} 
                    style={{ 
                      padding: 12, 
                      background: 'var(--bg2)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setGeneratedPoem(poem.generatedPoem);
                      setPoetryStyle(poem.style);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span>{poem.style}</span>
                      <span>{new Date(poem.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ 
                      fontSize: 12, 
                      color: 'var(--text)', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic'
                    }}>
                      "{poem.generatedPoem.split('\n')[0] || 'Poem content'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
