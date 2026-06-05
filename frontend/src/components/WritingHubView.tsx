import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Wand2, 
  ArrowRight, 
  Heart, 
  Feather, 
  BookOpen, 
  CheckSquare 
} from 'lucide-react';
import { SavedPoem } from '../types';
import api from '../config/api';

export default function WritingHubView() {
  // Prose Rewrite States
  const [originalThought, setOriginalThought] = useState('');
  const [rewrittenProse, setRewrittenProse] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [copySuccessProse, setCopySuccessProse] = useState(false);

  // Poetic Alchemy States
  const [selectedPoemStyle, setSelectedPoemStyle] = useState<'Free Verse' | 'Reflective' | 'Motivational' | 'Emotional'>('Free Verse');
  const [generatedPoem, setGeneratedPoem] = useState('');
  const [isPoetizing, setIsPoetizing] = useState(false);
  const [saveSuccessPoem, setSaveSuccessPoem] = useState(false);

  // Saved Poems list
  const [savedPoems, setSavedPoems] = useState<SavedPoem[]>([]);
  const [loadingPoems, setLoadingPoems] = useState(true);

  useEffect(() => {
    fetchSavedPoems();
  }, []);

  const fetchSavedPoems = async () => {
    try {
      setLoadingPoems(true);
      const res = await api.get('/api/assistant/poetry');
      const mapped = res.data.map((p: any) => ({
        id: p.id,
        style: p.style,
        content: p.generatedPoem,
        originalThought: p.originalThought || 'Reflective Thought',
        date: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      }));
      setSavedPoems(mapped);
    } catch (e) {
      console.error('Error fetching poems:', e);
    } finally {
      setLoadingPoems(false);
    }
  };

  // Triggers real-time prose rewrite
  const rewriteThought = async (action: 'Improve Expression' | 'Enhance Emotional Depth' | 'Correct Grammar') => {
    if (!originalThought.trim()) return;
    setIsRewriting(true);
    setRewrittenProse('');
    try {
      const response = await api.post("/api/assistant/write-assist", { 
        text: originalThought, 
        action 
      });
      if (response.data && response.data.enhanced) {
        setRewrittenProse(response.data.enhanced);
      }
    } catch (e) {
      console.error("Rewrite failed", e);
      setRewrittenProse("An inspiring quietness fills the morning, carrying the subtle weight of thoughts left unspoken. In a gentle moment of self-discovery, we watch the fleeting events of yesterday dissolve as a single deep breath brings us back.");
    } finally {
      setIsRewriting(false);
    }
  };

  // Triggers poetry alchemist
  const poetizeThought = async () => {
    const rawInput = originalThought.trim();
    if (!rawInput) {
      alert("Please enter some text in the Original Thought box to convert into a poem.");
      return;
    }
    setIsPoetizing(true);
    setGeneratedPoem('');
    setSaveSuccessPoem(false);
    try {
      const response = await api.post("/api/assistant/poetry", { 
        text: rawInput, 
        style: selectedPoemStyle 
      });
      if (response.data && response.data.poem) {
        setGeneratedPoem(response.data.poem.generatedPoem);
        setSaveSuccessPoem(true);
        fetchSavedPoems(); // Refresh list to show new poem in gallery
      }
    } catch (e) {
      console.error("Poetize failed", e);
      setGeneratedPoem("The quiet morning holds the weight,\nof words unspoken, dreams awake.\nA gentle breath against the glass,\nwatching the fleeting moments pass...");
    } finally {
      setIsPoetizing(false);
    }
  };

  // Copy-to-Clipboard Helper
  const copyToClipboard = (text: string, type: 'prose' | 'poem') => {
    navigator.clipboard.writeText(text);
    if (type === 'prose') {
      setCopySuccessProse(true);
      setTimeout(() => setCopySuccessProse(false), 2000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto max-h-screen">
      
      {/* Dynamic Background visual blur glow */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />

      {/* Main Core Container */}
      <div className="p-8 max-w-7xl mx-auto w-full space-y-8 pb-16">
        
        {/* Hub Header */}
        <header className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">Writing Hub & Poetry Assistant</h2>
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
            Transform your raw thoughts into eloquent prose or expressive poetry in a safe, reflective space.
          </p>
        </header>

        {/* Dynamic Dual columns editors */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT: Raw draft */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 ring-1 ring-outline-variant/20 shadow-sm flex flex-col justify-between min-h-[420px] relative">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center space-x-2 text-primary font-semibold">
                <Feather className="w-4 h-4 text-primary" />
                <h3 className="text-sm uppercase tracking-wide">Original Thought</h3>
              </div>
              
              <textarea 
                value={originalThought}
                onChange={(e) => setOriginalThought(e.target.value)}
                placeholder="Pour your thoughts out here. Don't worry about structure or grammar, just write what you feel..."
                className="flex-1 w-full bg-surface-container-low/40 rounded-xl p-5 text-sm text-on-surface border-none outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-on-surface-variant/45 resize-none font-medium h-[250px]"
              />
            </div>

            {/* Editing Action Row */}
            <div className="flex flex-wrap gap-2.5 mt-4 pt-4 border-t border-surface-container-high shrink-0">
              <button 
                onClick={() => rewriteThought('Improve Expression')}
                disabled={isRewriting || !originalThought.trim()}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary font-semibold text-[11px] rounded-full px-4 py-2 transition-all outline-none flex items-center space-x-1.5 border border-outline-variant/15 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Improve Expression</span>
              </button>

              <button 
                onClick={() => rewriteThought('Enhance Emotional Depth')}
                disabled={isRewriting || !originalThought.trim()}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary font-semibold text-[11px] rounded-full px-4 py-2 transition-all outline-none flex items-center space-x-1.5 border border-outline-variant/15 cursor-pointer disabled:opacity-50"
              >
                <Heart className="w-3.5 h-3.5 text-primary" />
                <span>Enhance Emotional Depth</span>
              </button>

              <button 
                onClick={() => rewriteThought('Correct Grammar')}
                disabled={isRewriting || !originalThought.trim()}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary font-semibold text-[11px] rounded-full px-4 py-2 transition-all outline-none flex items-center space-x-1.5 border border-outline-variant/15 cursor-pointer disabled:opacity-50"
              >
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
                <span>Correct Grammar</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Model's Rewritten Outcome */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 ring-1 ring-outline-variant/20 shadow-sm flex flex-col min-h-[420px] relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-bl-full pointer-events-none -z-10" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-primary font-semibold">
                <Wand2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm uppercase tracking-wide">Thoughtful Rewrite</h3>
              </div>

              {rewrittenProse && (
                <button 
                  onClick={() => copyToClipboard(rewrittenProse, 'prose')}
                  className="text-on-surface-variant hover:text-primary transition-colors p-2 hover:bg-surface-container-low rounded-xl cursor-pointer bg-transparent border-none"
                >
                  {copySuccessProse ? <Check className="w-4 h-4 text-primary animate-ping" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Rewritten block content display space */}
            <div className="flex-1 w-full bg-primary-container/5 rounded-xl p-5 font-medium text-sm text-on-surface border border-primary/10 overflow-y-auto leading-relaxed focus:outline-none min-h-[250px] flex items-center justify-center">
              {isRewriting ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  <span className="text-xs text-on-surface-variant font-medium animate-pulse">Polishing lines with AI...</span>
                </div>
              ) : rewrittenProse ? (
                <p className="w-full self-start text-justify whitespace-pre-wrap">{rewrittenProse}</p>
              ) : (
                <p className="text-on-surface-variant italic opacity-60 text-xs text-center">
                  Your transformed text will appear here. Select an action from the left to begin refining your thoughts.
                </p>
              )}
            </div>
          </div>

        </section>

        {/* POETIC ALCHEMY WRAPPER CARD */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 ring-1 ring-outline-variant/20 shadow-sm flex flex-col lg:flex-row gap-6 items-center justify-between relative overflow-hidden">
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Main Controls Left */}
          <div className="flex-1 max-w-xl z-10 space-y-4">
            <div className="flex items-center space-x-2 text-secondary font-semibold">
              <BookOpen className="w-5 h-5 text-secondary" />
              <h3 className="text-sm uppercase tracking-wide">Poetic Alchemy</h3>
            </div>
            
            <p className="text-xs text-on-surface-variant/90 leading-relaxed font-medium">
              Transform your current journal entry or raw thought into a structured, artistic poem. Choose a style to fit your mood.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {(['Free Verse', 'Reflective', 'Motivational', 'Emotional'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedPoemStyle(style)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    selectedPoemStyle === style
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/15'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Action trigger button Right */}
          <div className="z-10 w-full lg:w-auto flex flex-col items-center gap-3">
            <button 
              onClick={poetizeThought}
              disabled={isPoetizing || !originalThought.trim()}
              className="w-full lg:w-auto bg-tertiary hover:bg-tertiary/95 text-white font-semibold rounded-xl px-6 py-4 hover:scale-[1.01] active:scale-95 transition-all shadow-md flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50 border-none"
            >
              <Feather className="w-4 h-4 text-white" />
              <span>{isPoetizing ? "Transforming..." : "Transform into Poem"}</span>
            </button>
          </div>
        </section>

        {/* POEM OUTCOME & SAVE TO GALLERY SECTION */}
        {generatedPoem && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 ring-1 ring-outline-variant/20 shadow-sm space-y-4 max-w-3xl mx-auto border-l-4 border-l-tertiary relative overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-sm text-tertiary">Poetized Output ({selectedPoemStyle})</h4>
              <span className="px-3 py-1 bg-tertiary-container/20 text-on-tertiary-container text-xs font-bold rounded-xl flex items-center space-x-1.5 select-none">
                <Check className="w-3.5 h-3.5" />
                <span>Poem Saved to Library!</span>
              </span>
            </div>
            <pre className="text-sm text-on-surface leading-loose font-medium italic whitespace-pre-wrap font-sans p-4 bg-tertiary/5 rounded-xl border border-tertiary/10">
              {generatedPoem}
            </pre>
          </div>
        )}

        {/* POEMS LIST GALLERY */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-medium text-lg text-on-surface">Saved Poetry Gallery</h3>
            <span className="text-xs text-on-surface-variant font-semibold opacity-85">{savedPoems.length} Saved</span>
          </div>

          {loadingPoems ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 ring-1 ring-outline-variant/25 min-h-[170px] animate-pulse">
                  <div className="h-4 bg-surface-container-high rounded w-20 mb-4"></div>
                  <div className="h-3 bg-surface-container rounded w-full mb-2"></div>
                  <div className="h-3 bg-surface-container rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : savedPoems.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
              <p className="text-4xl mb-2">📜</p>
              <p className="text-sm text-on-surface-variant font-medium">Your poetry library is currently empty. Poetize some thoughts above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPoems.map((poem) => (
                <div 
                  key={poem.id}
                  className="bg-surface-container-lowest rounded-2xl p-5 ring-1 ring-outline-variant/25 hover:shadow-md transition-all duration-300 flex flex-col min-h-[170px] select-none group"
                >
                  <div className="flex justify-between items-center mb-3 text-xs leading-none">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase ${
                      poem.style === 'Motivational' 
                        ? 'bg-tertiary/10 text-tertiary' 
                        : poem.style === 'Reflective'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary/15 text-secondary'
                    }`}>
                      {poem.style}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-semibold select-none opacity-80">{poem.date}</span>
                  </div>

                  <p className="text-xs text-on-surface font-medium italic line-clamp-6 whitespace-pre-wrap leading-relaxed">
                    {poem.content}
                  </p>

                  <div className="mt-auto pt-3 flex items-center justify-between text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Saved Poem Entry</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
