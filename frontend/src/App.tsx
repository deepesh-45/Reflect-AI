import { useState, useEffect } from 'react';
import { 
  Brain, 
  Send, 
  Activity, 
  Compass, 
  Smile, 
  Lightbulb,
  Sparkle
} from 'lucide-react';
import { JournalEntry, ChatMessage } from './types';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import SmartJournalView from './components/SmartJournalView';
import WritingHubView from './components/WritingHubView';
import CommunityFutureView from './components/CommunityFutureView';
import AuthPage from './pages/AuthPage';
import { useAuth } from './context/AuthContext';
import api from './config/api';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  
  const [currentView, setView] = useState<string>('home');
  const [reflections, setReflections] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  // Full Screen Companion Chat States
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([
    {
      id: "ai-welcome",
      sender: "assistant",
      text: "Welcome back to your Digital Sanctuary. I am here to hold a warm, gentle space for you. What is currently resting on your heart today? Choose a conversation prompt below or type freely.",
      timestamp: "Today"
    }
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [companionStatus, setCompanionStatus] = useState('Listening actively');

  // Load reflections from backend once logged in
  useEffect(() => {
    if (user) {
      fetchReflections();
      fetchChatHistory();
    }
  }, [user]);

  const fetchReflections = async () => {
    try {
      const res = await api.get('/api/journal');
      const mapped = res.data.map((j: any) => ({
        id: j.id,
        title: j.title,
        content: j.content,
        date: new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: j.createdAt,
        mood: j.emotion || 'Neutral',
        color: j.emotion === 'Calm' ? '#5d5b78' : j.emotion === 'Joy' ? '#496457' : '#805437',
        triggers: j.triggers || [],
        reflectionFeedback: j.summary || ''
      }));
      setReflections(mapped);
    } catch (e) {
      console.error('Failed to fetch reflections:', e);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await api.get('/api/chat/history');
      if (res.data && res.data.length > 0) {
        const mapped: ChatMessage[] = res.data.map((c: any) => ({
          id: c.id,
          sender: c.role === 'user' ? 'user' : 'assistant',
          text: c.message,
          timestamp: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setAssistantMessages([
          {
            id: "ai-welcome",
            sender: "assistant",
            text: "Welcome back to your Digital Sanctuary. I am here to hold a warm, gentle space for you. What is currently resting on your heart today? Choose a conversation prompt below or type freely.",
            timestamp: "Today"
          },
          ...mapped
        ]);
      }
    } catch (e) {
      console.error('Failed to fetch chat history:', e);
    }
  };

  // CRUD handlers for journal entries
  const handleSaveReflection = async (title: string, content: string, id?: string): Promise<JournalEntry> => {
    if (id) {
      // Edit
      const res = await api.put(`/api/journal/${id}`, { title, content });
      const entry = res.data.entry;
      const updatedEntry: JournalEntry = {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        date: new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: entry.createdAt,
        mood: entry.emotion || 'Neutral',
        color: entry.emotion === 'Calm' ? '#5d5b78' : entry.emotion === 'Joy' ? '#496457' : '#805437',
        triggers: entry.triggers || [],
        reflectionFeedback: entry.summary || ''
      };
      setReflections(prev => prev.map(r => r.id === id ? updatedEntry : r));
      return updatedEntry;
    } else {
      // Create new
      const res = await api.post('/api/journal', { title, content });
      const entry = res.data.entry;
      const newEntry: JournalEntry = {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        date: new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: entry.createdAt,
        mood: entry.emotion || 'Neutral',
        color: entry.emotion === 'Calm' ? '#5d5b78' : entry.emotion === 'Joy' ? '#496457' : '#805437',
        triggers: entry.triggers || [],
        reflectionFeedback: entry.summary || ''
      };
      setReflections(prev => [newEntry, ...prev]);
      return newEntry;
    }
  };

  const handleDeleteReflection = async (id: string) => {
    await api.delete(`/api/journal/${id}`);
    setReflections(prev => prev.filter(r => r.id !== id));
  };

  const handleSelectEntry = (entry: JournalEntry | null) => {
    setActiveEntry(entry);
    setView('journal');
  };

  const handleCreateNewReflection = () => {
    setActiveEntry(null);
    setView('journal');
  };

  // Full Screen Companion Chat sender
  const handleSendAssistantChatMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `ai-full-${Math.random()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAssistantMessages((prev) => [...prev, userMsg]);
    setAssistantInput('');
    setIsTyping(true);
    setCompanionStatus('Writing reply...');

    try {
      const response = await api.post("/api/chat", { message: text });
      const data = response.data;
      if (data && data.reply) {
        const replyMsg: ChatMessage = {
          id: `ai-reply-${Math.random()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAssistantMessages((prev) => [...prev, replyMsg]);
      }
    } catch (e) {
      console.error("AI companion failed to respond", e);
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Math.random()}`,
        sender: 'assistant',
        text: "I am always here beside you, Alex. It is okay if steps feel heavy right now. Take your time, breathe deeply, and tell me: what does self-compassion look like for you in this exact moment?",
        timestamp: "Just now"
      };
      setAssistantMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
      setCompanionStatus('Listening actively');
    }
  };

  // Render view controller
  const renderActiveView = () => {
    switch (currentView) {
      case 'home':
        return (
          <DashboardView 
            reflections={reflections} 
            onSelectEntry={handleSelectEntry} 
            onNavigate={setView} 
          />
        );
      case 'journal':
        return (
          <SmartJournalView 
            activeEntry={activeEntry} 
            reflections={reflections}
            onSaveEntry={handleSaveReflection} 
            onDeleteEntry={handleDeleteReflection}
            onSelectEntry={handleSelectEntry}
          />
        );
      case 'assistant':
        return (
          <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
            <header className="sticky top-0 bg-background/85 backdrop-blur-md z-10 flex justify-between items-center h-16 px-8 border-b border-outline-variant/10 shrink-0">
              <div className="flex items-center space-x-3 select-none">
                <Brain className="w-5 h-5 text-primary" />
                <h2 className="font-display text-base font-semibold text-on-surface">AI Sanctuary Companion</h2>
              </div>
              <div className="flex items-center space-x-2 text-[10px] text-primary font-bold uppercase select-none tracking-wide">
                <span className="w-2 h-2 bg-primary rounded-full animate-ping"></span>
                <span>{companionStatus}</span>
              </div>
            </header>

            {/* Chat Body panel */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col max-w-4xl mx-auto w-full">
              {assistantMessages.map((m) => {
                const isAI = m.sender === 'assistant';
                return (
                  <div key={m.id} className={`flex space-x-4 max-w-2xl ${isAI ? '' : 'self-end flex-row-reverse space-x-reverse'}`}>
                    {isAI && (
                      <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0 border border-primary/10 select-none">
                        <Brain className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className={`p-5 rounded-2xl border text-sm leading-relaxed ${
                      isAI 
                        ? 'bg-surface-container-lowest border-outline-variant/15 text-on-surface rounded-tl-none shadow-xs' 
                        : 'bg-primary text-white border-primary rounded-tr-none shadow-sm font-medium'
                    }`}>
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex space-x-4 max-w-md">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0 border border-primary/5 select-none">
                    <Brain className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div className="bg-surface-container-lowest border border-outline-variant/15 p-4 rounded-2xl rounded-tl-none flex items-center space-x-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-outline-variant animate-bounce"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-outline-variant animate-bounce delay-100"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-outline-variant animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Daily wellness advice selector links */}
            <div className="max-w-4xl mx-auto w-full px-8 pb-3 select-none">
              <p className="text-[10px] text-outline font-bold tracking-wider mb-2 uppercase">Sanctuary reflection frames:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <button 
                  onClick={() => handleSendAssistantChatMessage("Can you guide me through a 5-minute breathing box exercise?")}
                  className="bg-surface-container-lowest hover:bg-surface-container-low text-on-surface hover:text-primary font-semibold border border-outline-variant/15 p-3 rounded-xl flex items-center space-x-2 text-left cursor-pointer border-none"
                >
                  <Activity className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">Breathing Exercise</span>
                </button>
                <button 
                  onClick={() => handleSendAssistantChatMessage("I'm feeling overwhelmed by my coursework structure. How can I balance my mind?")}
                  className="bg-surface-container-lowest hover:bg-surface-container-low text-on-surface hover:text-primary font-semibold border border-outline-variant/15 p-3 rounded-xl flex items-center space-x-2 text-left cursor-pointer border-none"
                >
                  <Compass className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">Academic Balance</span>
                </button>
                <button 
                  onClick={() => handleSendAssistantChatMessage("I need to unwind my brain to sleep. Do you have a cognitive relaxation prompt?")}
                  className="bg-surface-container-lowest hover:bg-surface-container-low text-on-surface hover:text-primary font-semibold border border-outline-variant/15 p-3 rounded-xl flex items-center space-x-2 text-left cursor-pointer border-none"
                >
                  <Smile className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">Unwind for Sleep</span>
                </button>
                <button 
                  onClick={() => handleSendAssistantChatMessage("Guide me through a positive self-talk affirmation to spark daily focus.")}
                  className="bg-surface-container-lowest hover:bg-surface-container-low text-on-surface hover:text-primary font-semibold border border-outline-variant/15 p-3 rounded-xl flex items-center space-x-2 text-left cursor-pointer border-none"
                >
                  <Lightbulb className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">Affirmation Prompt</span>
                </button>
              </div>
            </div>

            {/* Input send tray */}
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/10 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAssistantChatMessage(assistantInput);
                }}
                className="max-w-4xl mx-auto w-full relative flex items-center"
              >
                <input 
                  type="text"
                  placeholder="Tell your companion what's on your mind..."
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent focus:border-primary/40 focus:bg-white focus:ring-0 rounded-2xl pl-5 pr-14 py-4 text-sm font-medium outline-none placeholder:text-outline-variant"
                />
                <button 
                  type="submit"
                  disabled={!assistantInput.trim() || isTyping}
                  className="absolute right-2 bg-primary hover:bg-primary/95 text-white shadow-md p-3.5 rounded-xl cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95 transition-all border-none shrink-0"
                >
                  <Send className="w-4 h-4 text-white shrink-0" />
                </button>
              </form>
            </div>
          </div>
        );
      case 'writing-hub':
        return (
          <WritingHubView />
        );
      case 'community':
      case 'future':
        return (
          <CommunityFutureView />
        );
      default:
        return null;
    }
  };

  // Auth gate checks
  if (authLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background select-none">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
        <div className="flex items-center space-x-2">
          <Sparkle className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-on-surface-variant font-display text-sm font-semibold tracking-wide">Initializing Sanctuary...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex bg-background h-screen font-sans antialiased overflow-hidden text-on-background">
      
      {/* Persistent Left Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        onNewReflection={handleCreateNewReflection} 
      />

      {/* Primary Canvas Area */}
      <div className="flex-1 ml-64 min-h-screen bg-background relative flex flex-col overflow-hidden">
        {renderActiveView()}
      </div>

    </div>
  );
}
