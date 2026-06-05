import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Calendar, 
  Palette, 
  MoreHorizontal, 
  Wand2, 
  CheckCircle, 
  Brain, 
  Send,
  Plus,
  Trash2
} from 'lucide-react';
import { JournalEntry, ChatMessage, MoodType, EmotionResult } from '../types';
import api from '../config/api';

interface SmartJournalViewProps {
  activeEntry: JournalEntry | null;
  reflections: JournalEntry[];
  onSaveEntry: (title: string, content: string, id?: string) => Promise<JournalEntry>;
  onDeleteEntry: (id: string) => Promise<void>;
  onSelectEntry: (entry: JournalEntry | null) => void;
}

export default function SmartJournalView({ 
  activeEntry, 
  reflections, 
  onSaveEntry, 
  onDeleteEntry, 
  onSelectEntry 
}: SmartJournalViewProps) {
  // Editor States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('Neutral');
  const [searchQuery, setSearchQuery] = useState('');

  // Emotion Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EmotionResult | null>(null);

  // Chat/Companion States
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-msg",
      sender: "assistant",
      text: "Hello! I am your AI Sanctuary Companion. You can talk to me about anything on your mind. How are you feeling physically and emotionally today?",
      timestamp: "Today"
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isCompanionTyping, setIsCompanionTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "My shoulders feel tense",
    "I took a deep breath",
    "Let's check in on my energy levels"
  ]);

  // UI feedback triggers
  const [showToast, setShowToast] = useState(false);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync state with active entry when selected
  useEffect(() => {
    if (activeEntry) {
      setTitle(activeEntry.title);
      setContent(activeEntry.content);
      setMood(activeEntry.mood || 'Neutral');
      if (activeEntry.emotionAnalysis) {
        setAnalysisResult(activeEntry.emotionAnalysis);
      } else if (activeEntry.mood) {
        setAnalysisResult({
          tags: [activeEntry.mood],
          confidence: activeEntry.emotionAnalysis?.confidence || 90,
          reflectionSummary: activeEntry.reflectionFeedback || "Analyzed reflection."
        });
      } else {
        setAnalysisResult(null);
      }
    } else {
      // Clear for new entry
      setTitle('');
      setContent('');
      setMood('Neutral');
      setAnalysisResult(null);
    }
    setSavingState('idle');
  }, [activeEntry]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCompanionTyping]);

  // Trigger manual or automatic save
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSavingState('saving');
    try {
      const updated = await onSaveEntry(title, content, activeEntry?.id);
      onSelectEntry(updated);
      setSavingState('saved');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (e) {
      console.error(e);
      setSavingState('idle');
    }
  };

  // Perform full-sentiment parsing via backend
  const performEmotionAnalysis = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsAnalyzing(true);
    try {
      const updated = await onSaveEntry(title, content, activeEntry?.id);
      onSelectEntry(updated);
      if (updated.emotionAnalysis || updated.mood) {
        setAnalysisResult({
          tags: [updated.mood],
          confidence: updated.emotionAnalysis?.confidence || 90,
          reflectionSummary: updated.reflectionFeedback || "Your thoughts are processed."
        });
        setMood(updated.mood);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (e) {
      console.error("AI Analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Companion chat endpoint communication
  const sendMessageToCompanion = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `chat-${Math.random()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsCompanionTyping(true);

    try {
      const response = await api.post("/api/chat", { message: text });
      const data = response.data;
      if (data && data.reply) {
        const replyMsg: ChatMessage = {
          id: `chat-${Math.random()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, replyMsg]);
        
        // Dynamically vary suggestions based on topic
        if (text.toLowerCase().includes('stress') || text.toLowerCase().includes('tired')) {
          setSuggestions([
            "Let's explore physical relaxation",
            "I need to manage my study load",
            "Can we do a breathing exercise?"
          ]);
        } else if (text.toLowerCase().includes('happy') || text.toLowerCase().includes('accomplish')) {
          setSuggestions([
            "How can I maintain this momentum?",
            "I want to celebrate this win",
            "What habits are helping me?"
          ]);
        } else {
          setSuggestions([
            "Let's check on my sleep hygiene",
            "How do I feel right now?",
            "What can I do next?"
          ]);
        }
      }
    } catch (error) {
      console.error("Companion failed to respond", error);
      // Friendly fallback
      const replyMsg: ChatMessage = {
        id: `chat-err-${Math.random()}`,
        sender: 'assistant',
        text: "I am right here with you, Alex. Take a slow, deep breath. We can take this one step at a time.",
        timestamp: "Just now"
      };
      setMessages(prev => [...prev, replyMsg]);
    } finally {
      setIsCompanionTyping(false);
    }
  };

  const handleDelete = async () => {
    if (!activeEntry?.id) return;
    if (!window.confirm("Are you sure you want to delete this reflection?")) return;
    try {
      await onDeleteEntry(activeEntry.id);
      onSelectEntry(null);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredReflections = reflections.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col max-h-screen">
      
      {/* Search and Header App Bar */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-10 flex justify-between items-center h-16 px-8 border-b border-outline-variant/10">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-3" />
          <input 
            type="text" 
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-outline-variant/30 rounded-full text-xs font-medium bg-surface-container-low text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => onSelectEntry(null)}
            className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-full px-4 py-2 flex items-center space-x-1.5 cursor-pointer shadow-sm border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Thought</span>
          </button>
        </div>
      </header>

      {/* Split Pane View Workspace */}
      <main className="flex-1 flex gap-6 px-8 pb-8 overflow-hidden h-[calc(100vh-64px)]">
        
        {/* PANEL 1: Scrollable Entries Directory */}
        <aside className="w-72 flex-shrink-0 flex flex-col bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-4 overflow-y-auto max-h-full">
          <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center justify-between">
            <span>Journal Vault</span>
            <span className="text-[10px] text-outline bg-surface-container-low px-2 py-0.5 rounded-full">{filteredReflections.length}</span>
          </h3>
          
          <div className="space-y-2 flex-1">
            {filteredReflections.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant/70">
                <p className="text-3xl mb-1">📓</p>
                <p className="text-[11px] font-semibold">No reflections found.</p>
              </div>
            ) : (
              filteredReflections.map((entry) => {
                const isActive = activeEntry?.id === entry.id;
                const dateLabel = new Date(entry.timestamp || entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                return (
                  <button
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer block select-none ${
                      isActive 
                        ? 'bg-primary/10 border-primary shadow-sm' 
                        : 'bg-surface-container-low/40 border-outline-variant/10 hover:bg-surface-container-low/80 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 select-none">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase emotion-${entry.mood}`}>
                        {entry.mood || 'Neutral'}
                      </span>
                      <span className="text-[9px] text-on-surface-variant font-semibold">{dateLabel}</span>
                    </div>
                    <h4 className="text-xs font-bold text-on-surface truncate leading-tight select-none">
                      {entry.title || 'Untitled Thought'}
                    </h4>
                    <p className="text-[10px] text-on-surface-variant/90 truncate leading-normal select-none mt-1">
                      {entry.content}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* PANEL 2: Deep Reflection Editor */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden relative max-h-full">
          <div className="w-full h-1 bg-gradient-to-r from-primary-container via-surface-container to-background opacity-60"></div>
          
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {/* Top Row Header Row */}
            <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium mb-4 select-none">
              <span className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>
                  {activeEntry 
                    ? new Date(activeEntry.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </span>
              
              <div className="flex items-center space-x-2">
                {activeEntry && (
                  <button 
                    onClick={handleDelete}
                    className="p-1.5 hover:bg-error-container/10 hover:text-error rounded-lg transition-colors text-outline cursor-pointer border-none bg-transparent"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button className="p-1.5 hover:bg-surface-container-low rounded-lg transition-colors text-outline cursor-pointer border-none bg-transparent">
                  <Palette className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-surface-container-low rounded-lg transition-colors text-outline cursor-pointer border-none bg-transparent">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Title Input */}
            <input 
              type="text"
              placeholder="Give your thoughts a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="w-full bg-transparent border-none text-2xl font-bold font-display text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:ring-0 mb-4 p-0"
            />

            {/* Reflection Note Content Area */}
            <textarea 
              placeholder="Start typing your reflection here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleSave}
              className="flex-1 w-full bg-transparent border-none text-sm leading-relaxed text-on-surface/90 placeholder:text-outline-variant/50 focus:outline-none focus:ring-0 p-0 resize-none font-medium h-48"
            />

            {/* Sentiment analysis triggers */}
            <div className="mt-4 pt-4 border-t border-outline-variant/10 flex flex-col gap-4">
              <div className="flex items-center justify-between select-none">
                <button 
                  onClick={performEmotionAnalysis}
                  disabled={isAnalyzing || !content.trim() || !title.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container-high transition-colors rounded-xl text-xs font-semibold text-on-surface cursor-pointer disabled:opacity-50"
                >
                  <Wand2 className={`w-3.5 h-3.5 text-primary ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? "Analyzing..." : "Analyze Emotion"}</span>
                </button>
                <span className="text-[10px] text-on-surface-variant font-semibold opacity-75">
                  {savingState === 'saving' && 'Saving...'}
                  {savingState === 'saved' && 'Saved successfully'}
                  {savingState === 'idle' && 'Draft matches cloud'}
                </span>
              </div>

              {/* Sentiment Card Panel */}
              <div className="bg-surface-container/60 rounded-xl p-4 border border-primary/10 relative overflow-hidden flex items-center justify-between select-none">
                <div className="absolute right-0 top-0 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
                
                <div className="space-y-1 relative z-10 max-w-lg">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Emotion Analysis Summary</span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-on-surface">Dominant Tag:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase emotion-${mood}`}>
                      {mood}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant/95 leading-relaxed font-normal pt-1.5 italic">
                    {analysisResult ? analysisResult.reflectionSummary : "Ready to analyze. Write your reflection and click 'Analyze Emotion' to trigger Gemini sentiment extraction."}
                  </p>
                </div>

                <div className="flex flex-col items-end select-none flex-shrink-0 relative z-10 pl-4 border-l border-outline-variant/20">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-5 h-5 text-primary fill-primary/10 shrink-0" />
                    <span className="text-xl font-bold font-sans text-on-surface">
                      {analysisResult ? `${analysisResult.confidence}%` : "50%"}
                    </span>
                  </div>
                  <span className="text-[9px] text-on-surface-variant/80 font-medium">Confidence</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* PANEL 3: AI Companion Interactive Sidebar */}
        <aside className="w-80 flex flex-col bg-surface-bright rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden flex-shrink-0 max-h-full">
          
          {/* Sidebar Chat Header */}
          <div className="p-4 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center space-x-3 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface">AI Companion</h4>
              <p className="text-[10px] text-primary font-semibold flex items-center space-x-1.5 mt-0.5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block shrink-0"></span>
                <span>Active listener online</span>
              </p>
            </div>
          </div>

          {/* Interactivity Chat Window */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4 bg-gradient-to-b from-surface-bright to-surface-container-low/20">
            
            <div className="flex justify-center my-1 select-none">
              <span className="px-3 py-1 bg-surface-container rounded-full text-[10px] font-medium text-outline">
                Chat Sanctuary
              </span>
            </div>

            {/* Render Conversational History */}
            {messages.map((m) => {
              const isAssistant = m.sender === 'assistant';
              return (
                <div 
                  key={m.id}
                  className={`flex space-x-2 max-w-[90%] ${isAssistant ? '' : 'self-end flex-row-reverse space-x-reverse'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-primary-container/25 flex-shrink-0 flex items-center justify-center text-primary mt-1">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    isAssistant 
                      ? 'bg-surface-container-lowest border-outline-variant/20 text-on-surface rounded-tl-sm' 
                      : 'bg-primary text-white border-primary rounded-tr-sm shadow-sm font-medium'
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })}

            {/* Pulse Indicator during AI thinking */}
            {isCompanionTyping && (
              <div className="flex space-x-2 max-w-[60%]">
                <div className="w-7 h-7 rounded-full bg-primary-container/25 flex-shrink-0 flex items-center justify-center text-primary mt-1">
                  <Brain className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-2xl rounded-tl-sm border border-outline-variant/20 flex items-center space-x-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant animate-bounce delay-200"></span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Suggested Responses list */}
          <div className="px-4 pt-3 bg-surface-container-lowest border-t border-screen/20">
            <p className="text-[10px] text-outline font-semibold tracking-wide mb-1.5">Suggested responses:</p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((sg, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessageToCompanion(sg)}
                  className="w-full text-left px-3 py-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/15 rounded-lg text-[11px] font-medium transition-colors cursor-pointer block truncate"
                >
                  {sg}
                </button>
              ))}
            </div>
          </div>

          {/* Input text send panel */}
          <div className="p-3 bg-surface-container-lowest">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                sendMessageToCompanion(chatInput);
              }}
              className="relative flex items-center"
            >
              <input 
                type="text"
                placeholder="Type your thoughts..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface text-xs rounded-xl pl-4 pr-10 py-3 border border-transparent focus:border-primary/45 focus:bg-surface-container-lowest focus:ring-0 focus:ring-transparent transition-all outline-none placeholder:text-outline-variant font-medium"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim()}
                className="absolute right-1.5 w-8 h-8 flex items-center justify-center bg-primary text-white hover:bg-primary/95 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 rounded-lg cursor-pointer shrink-0 border-none"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>

        </aside>

      </main>

      {/* Entry Saved Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-inverse-surface border border-inverse-primary/25 text-inverse-on-surface px-6 py-3 rounded-full shadow-xl flex items-center space-x-3 transition-all duration-300">
          <CheckCircle className="w-5 h-5 text-inverse-primary shrink-0 animate-bounce" />
          <span className="text-xs font-semibold uppercase tracking-wide text-white">Reflections Saved Successfully</span>
        </div>
      )}

    </div>
  );
}
