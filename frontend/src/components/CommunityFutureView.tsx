import { useState, useEffect } from 'react';
import { 
  Heart, 
  Lock, 
  Unlock, 
  Send, 
  Users, 
  Flame, 
  X,
  Sparkle
} from 'lucide-react';
import { CommunityPost, FutureLetter } from '../types';
import api from '../config/api';

export default function CommunityFutureView() {
  const [activeTab, setActiveTab] = useState<'community' | 'future'>('community');
  
  // Community Feed States
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [isAnonymousPost, setIsAnonymousPost] = useState(true);
  const [selectedPostEmotion, setSelectedPostEmotion] = useState('Reflective');

  // Letter Vault States
  const [letters, setLetters] = useState<FutureLetter[]>([]);
  const [loadingLetters, setLoadingLetters] = useState(true);
  const [letterSubject, setLetterSubject] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [selectedLetterDuration, setSelectedLetterDuration] = useState<'test-1m' | '1M' | '3M' | '6M' | '1Y'>('3M');
  
  // Modal / Display States
  const [unlockedLetterToRead, setUnlockedLetterToRead] = useState<FutureLetter | null>(null);
  const [loadingDetailLetter, setLoadingDetailLetter] = useState(false);

  useEffect(() => {
    if (activeTab === 'community') {
      fetchCommunityPosts();
    } else {
      fetchFutureLetters();
    }
  }, [activeTab]);

  // Load Community posts
  const fetchCommunityPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await api.get('/api/community');
      const mapped = res.data.map((p: any) => ({
        id: p.id,
        emotions: [p.emotions?.[0] || 'Reflective'],
        content: p.content,
        timestamp: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently',
        likes: p.relateCount || 0,
        supportCount: p.supportCount || 0,
        inspireCount: p.inspireCount || 0,
        isAnonymous: p.anonymous ?? true,
        creatorName: p.creatorName || 'Anonymous Student'
      }));
      setPosts(mapped);
    } catch (e) {
      console.error('Failed to fetch posts:', e);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Load future-self letters
  const fetchFutureLetters = async () => {
    try {
      setLoadingLetters(true);
      const res = await api.get('/api/letters');
      const mapped = res.data.map((l: any) => ({
        id: l.id,
        title: l.title,
        content: l.content,
        createdAt: new Date(l.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
        unlockDate: new Date(l.unlockDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        duration: l.duration || '3M',
        isLocked: l.locked ?? true
      }));
      setLetters(mapped);
    } catch (e) {
      console.error('Failed to fetch letters:', e);
    } finally {
      setLoadingLetters(false);
    }
  };

  // Helper date calculator for local UI representation
  const getCalculatedUnlockDate = (duration: 'test-1m' | '1M' | '3M' | '6M' | '1Y') => {
    const today = new Date();
    if (duration === 'test-1m') today.setMinutes(today.getMinutes() + 1);
    else if (duration === '1M') today.setMonth(today.getMonth() + 1);
    else if (duration === '3M') today.setMonth(today.getMonth() + 3);
    else if (duration === '6M') today.setMonth(today.getMonth() + 6);
    else today.setFullYear(today.getFullYear() + 1);

    return today.toLocaleString('en-US', { year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // Trigger publishing to community feed
  const handlePublishPost = async () => {
    if (!newPostText.trim()) return;
    try {
      await api.post('/api/community', {
        content: newPostText,
        anonymous: isAnonymousPost,
        emotions: [selectedPostEmotion]
      });
      setNewPostText('');
      fetchCommunityPosts();
    } catch (e) {
      console.error('Failed to create post:', e);
    }
  };

  // Trigger Letter Sealing
  const handleSealLetter = async () => {
    if (!letterContent.trim() || !letterSubject.trim()) return;
    try {
      await api.post('/api/letters', {
        title: letterSubject,
        content: letterContent,
        unlockOption: selectedLetterDuration
      });
      setLetterSubject('');
      setLetterContent('');
      fetchFutureLetters();
    } catch (e) {
      console.error('Failed to seal letter:', e);
    }
  };

  // Toggle reaction on post
  const handleReact = async (post: CommunityPost, type: 'relate' | 'support' | 'inspire') => {
    try {
      // Optimistic UI updates
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          const updated = { ...p };
          if (type === 'relate') {
            updated.likes = (updated.likes || 0) + 1;
            updated.hasLiked = true;
          } else if (type === 'support') {
            updated.supportCount = (updated.supportCount || 0) + 1;
            updated.hasSupported = true;
          } else if (type === 'inspire') {
            updated.inspireCount = (updated.inspireCount || 0) + 1;
            updated.hasInspired = true;
          }
          return updated;
        }
        return p;
      }));

      // Call API
      await api.post(`/api/community/${post.id}/react`, { reactionType: type });
    } catch (e) {
      console.error('Failed to react:', e);
      // Revert in case of API failure
      fetchCommunityPosts();
    }
  };

  // Read unlocked letter
  const handleReadLetter = async (letter: FutureLetter) => {
    if (letter.isLocked) {
      alert(`This letter remains securely sealed. Unlocks on ${letter.unlockDate}.`);
      return;
    }
    setLoadingDetailLetter(true);
    try {
      const res = await api.get(`/api/letters/${letter.id}`);
      setUnlockedLetterToRead({
        ...letter,
        content: res.data.content
      });
    } catch (e) {
      console.error('Failed to load letter details:', e);
      alert('Seals are still active. Access denied.');
    } finally {
      setLoadingDetailLetter(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto max-h-screen">
      
      {/* Page Container */}
      <div className="p-8 max-w-7xl mx-auto w-full space-y-6 pb-20">
        
        {/* Page Titles */}
        <div>
          <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">Community & Future</h2>
          <p className="text-sm text-on-surface-variant max-w-2xl font-medium">
            Connect with others anonymously or send a message to your future self. A safe space for shared reflection.
          </p>
        </div>

        {/* Tab Toggle Row Selector */}
        <div className="flex border-b border-surface-container-high mb-6 space-x-8 text-sm">
          <button 
            onClick={() => setActiveTab('community')}
            className={`pb-3 px-1 font-semibold text-base transition-all cursor-pointer border-none bg-transparent ${
              activeTab === 'community' 
                ? 'border-b-2 border-primary text-primary font-bold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Community Feed
          </button>
          
          <button 
            onClick={() => setActiveTab('future')}
            className={`pb-3 px-1 font-semibold text-base transition-all cursor-pointer border-none bg-transparent ${
              activeTab === 'future' 
                ? 'border-b-2 border-primary text-primary font-bold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Future Self
          </button>
        </div>

        {/* TAB 1: COMMUNITY CONTENT VIEW */}
        {activeTab === 'community' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Feed Main Feed Spans 8 columns */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Creator Box */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/15 shadow-sm space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-xs font-bold font-sans select-none shrink-0">
                    AN
                  </div>
                  <div className="flex-1 min-h-[50px]">
                    <textarea 
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder="Share your reflection anonymously..."
                      rows={2}
                      className="w-full bg-transparent border-none text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-0 p-0 resize-none font-medium h-[60px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center border-t border-surface-container-high pt-3 gap-3 md:gap-0">
                  <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-start">
                    <label className="flex items-center cursor-pointer select-none">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={isAnonymousPost}
                          onChange={(e) => setIsAnonymousPost(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-6 rounded-full transition-colors ${isAnonymousPost ? 'bg-primary' : 'bg-outline-variant/50'}`} />
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAnonymousPost ? 'translate-x-4' : ''}`} />
                      </div>
                      <span className="ml-3 text-xs font-semibold text-on-surface-variant">Post Anonymously</span>
                    </label>

                    <select 
                      value={selectedPostEmotion} 
                      onChange={(e) => setSelectedPostEmotion(e.target.value)}
                      className="text-xs bg-surface-container-low border border-outline-variant/30 rounded-lg px-2 py-1 outline-none text-on-surface font-semibold focus:ring-0 focus:border-primary shrink-0 cursor-pointer"
                    >
                      <option>Reflective</option>
                      <option>Overwhelmed</option>
                      <option>Joy</option>
                      <option>Breakthrough</option>
                      <option>Hopeful</option>
                      <option>Exhausted</option>
                    </select>
                  </div>

                  <button 
                    onClick={handlePublishPost}
                    disabled={!newPostText.trim()}
                    className="w-full md:w-auto bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-full px-5 py-2.5 shadow-sm cursor-pointer disabled:opacity-50 border-none"
                  >
                    Share
                  </button>
                </div>
              </div>

              {/* Feed items list */}
              {loadingPosts ? (
                <div className="space-y-4">
                  {Array(2).fill(0).map((_, i) => (
                    <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/15 animate-pulse h-40"></div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 text-on-surface-variant/80">
                  <p className="text-4xl mb-2">🤝</p>
                  <p className="text-sm font-medium">Be the first to share an anonymous thought with the community feed!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/15 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface">{post.creatorName || "Anonymous Reflection"}</p>
                            <p className="text-[10px] text-on-surface-variant font-semibold select-none">{post.timestamp}</p>
                          </div>
                        </div>

                        <div className="flex space-x-1.5 shrink-0">
                          {post.emotions.map((emotion, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-secondary-container text-on-secondary-container">
                              {emotion}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-on-surface leading-relaxed text-justify font-medium">
                        {post.content}
                      </p>

                      {/* Interactions toolbar */}
                      <div className="flex items-center gap-4 pt-3 border-t border-surface-container-high text-xs select-none">
                        <button 
                          onClick={() => handleReact(post, 'relate')}
                          disabled={post.hasLiked}
                          className={`flex items-center space-x-1.5 font-semibold transition-colors cursor-pointer border-none bg-transparent ${
                            post.hasLiked ? 'text-tertiary font-bold' : 'text-on-surface-variant hover:text-tertiary'
                          }`}
                        >
                          <Heart className={`w-4 h-4 shrink-0 ${post.hasLiked ? 'fill-tertiary text-tertiary' : ''}`} />
                          <span>Relate ({post.likes})</span>
                        </button>

                        <button 
                          onClick={() => handleReact(post, 'support')}
                          disabled={post.hasSupported}
                          className={`flex items-center space-x-1.5 font-semibold transition-colors cursor-pointer border-none bg-transparent ${
                            post.hasSupported ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                          }`}
                        >
                          <Flame className={`w-4 h-4 shrink-0 ${post.hasSupported ? 'fill-primary text-primary' : ''}`} />
                          <span>Support ({post.supportCount})</span>
                        </button>

                        <button 
                          onClick={() => handleReact(post, 'inspire')}
                          disabled={post.hasInspired}
                          className={`flex items-center space-x-1.5 font-semibold ml-auto transition-colors cursor-pointer border-none bg-transparent ${
                            post.hasInspired ? 'text-secondary font-bold' : 'text-on-surface-variant hover:text-secondary'
                          }`}
                        >
                          <Sparkle className={`w-4 h-4 shrink-0 ${post.hasInspired ? 'fill-secondary text-secondary animate-spin-slow' : ''}`} />
                          <span>Inspire ({post.inspireCount})</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* TAB 1 SIDEBAR Spans 4 columns */}
            <div className="lg:col-span-4 space-y-5 flex flex-col">
              
              {/* Trending Emotions cards */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/15 shadow-sm space-y-4">
                <h3 className="font-display font-semibold text-sm text-on-surface">Trending Emotions</h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3.5 py-1.5 rounded-full bg-secondary-container/50 text-on-secondary-container text-xs font-semibold border border-secondary/15 select-none uppercase tracking-wide">Anxious</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-primary-container/20 text-primary text-xs font-semibold border border-primary/25 select-none uppercase tracking-wide">Hopeful</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-tertiary-container/35 text-on-tertiary-container text-xs font-semibold border border-tertiary/15 select-none uppercase tracking-wide">Exhausted</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-surface-variant text-on-surface-variant text-xs font-semibold border border-outline-variant/30 select-none uppercase tracking-wide font-sans">Focused</span>
                </div>
              </div>

              {/* Guidelines glassmorphic card */}
              <div className="bg-primary/5 rounded-2xl border border-primary/10 shadow-sm p-5 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container/10 rounded-full blur-xl pointer-events-none" />
                <h3 className="font-display font-semibold text-sm text-on-surface mb-1.5">Community Guidelines</h3>
                <p className="text-xs text-on-surface-variant/90 leading-relaxed mb-4">
                  This is a sanctuary. Treat others with empathy. Constructive support only. Let's grow together in peace.
                </p>
                <a href="#" className="text-xs font-bold text-primary hover:underline">Read full guidelines →</a>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: FUTURE SELF MODULE */}
        {activeTab === 'future' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Letters Form left */}
            <div className="lg:col-span-5 h-full">
              <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/15 shadow-sm flex flex-col min-h-[460px] relative">
                
                <div className="flex items-center space-x-3 mb-4 select-none shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary border border-primary/10">
                    <Send className="w-5 h-5 text-primary rotate-45" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm text-on-surface">Write a Letter</h3>
                    <p className="text-[10px] text-on-surface-variant font-medium">To your future self</p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3 flex-1 flex flex-col">
                    <input 
                      type="text"
                      placeholder="Letter label / subject (e.g. Letter to graduation)"
                      value={letterSubject}
                      onChange={(e) => setLetterSubject(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl p-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                    />

                    <textarea 
                      value={letterContent}
                      onChange={(e) => setLetterContent(e.target.value)}
                      placeholder="What are your hopes? What are you struggling with today that you hope to overcome?"
                      className="flex-1 w-full bg-surface border border-outline-variant/25 rounded-xl p-4 text-xs font-semibold focus:ring-1 focus:ring-primary focus:bg-white resize-none leading-relaxed h-[180px]"
                    />
                  </div>

                  {/* Lock selectors */}
                  <div className="pt-2 shrink-0">
                    <label className="block text-xs font-bold text-on-surface mb-2">Letter Seal Durations:</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {([
                        { id: 'test-1m', label: '1 Min' },
                        { id: '1M', label: '1 Mon' },
                        { id: '3M', label: '3 Mon' },
                        { id: '6M', label: '6 Mon' },
                        { id: '1Y', label: '1 Yr' }
                      ] as const).map((dur) => (
                        <button
                          key={dur.id}
                          onClick={() => setSelectedLetterDuration(dur.id)}
                          className={`py-2 text-[9px] font-bold rounded-xl border transition-all cursor-pointer select-none text-center ${
                            selectedLetterDuration === dur.id
                              ? 'bg-primary/10 border-primary text-primary font-bold shadow-xsScale'
                              : 'bg-surface-container border-outline-variant/15 text-on-surface-variant hover:border-primary/50'
                          }`}
                        >
                          {dur.label}
                        </button>
                      ))}
                    </div>

                    <p className="text-[10px] text-on-surface-variant font-semibold mt-3 flex items-center space-x-1.5 opacity-80 select-none">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span>Unlocks on {getCalculatedUnlockDate(selectedLetterDuration)}</span>
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleSealLetter}
                  disabled={!letterContent.trim() || !letterSubject.trim()}
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center space-x-2 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 mt-6 border-none"
                >
                  <Lock className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Seal Letter</span>
                </button>

              </div>
            </div>

            {/* Letter Vault lists right */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between select-none">
                  <h3 className="font-display font-medium text-sm text-on-surface">The Vault</h3>
                  <span className="bg-surface-variant text-on-surface-variant px-2.5 py-0.5 rounded-full text-[10px] font-semibold">{letters.length} Letters</span>
                </div>

                {loadingLetters ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl h-16 animate-pulse"></div>
                    ))}
                  </div>
                ) : letters.length === 0 ? (
                  <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 text-on-surface-variant/80">
                    <p className="text-4xl mb-2">🔒</p>
                    <p className="text-sm font-medium">Your future letters vault is currently empty. Seal one to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                    {/* Locked letters */}
                    {letters.filter(l => l.isLocked).map((letter) => {
                      const remainLabel = letter.duration === 'test-1m' ? '1 Min' : letter.duration === '1M' ? '30 Days' : letter.duration === '3M' ? '90 Days' : letter.duration === '6M' ? '180 Days' : '365 Days';
                      return (
                        <div 
                          key={letter.id} 
                          className="relative bg-inverse-surface rounded-2xl p-5 overflow-hidden border border-inverse-primary/10 shadow-md select-none"
                        >
                          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center space-x-3.5">
                              <div className="w-12 h-12 rounded-full bg-inverse-primary/15 flex items-center justify-center text-inverse-primary border border-inverse-primary/20 shrink-0">
                                <Lock className="w-5 h-5 text-inverse-primary shrink-0" />
                              </div>
                              <div>
                                <h4 className="font-display font-semibold text-sm text-inverse-on-surface truncate max-w-xs">{letter.title}</h4>
                                <p className="text-[10px] text-inverse-primary/80 font-medium">Written on {letter.createdAt} • Sealed until {letter.unlockDate}</p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-2xl font-bold font-sans text-inverse-primary leading-none">
                                {remainLabel}
                              </p>
                              <p className="text-[9px] text-inverse-primary/60 uppercase tracking-widest mt-1">Remaining</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Unlocked letters */}
                    <div className="pt-4 border-t border-surface-container-high space-y-3">
                      <h4 className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider select-none">Unlocked & Ready</h4>
                      
                      {letters.filter(l => !l.isLocked).map((letter) => (
                        <div 
                          key={letter.id}
                          onClick={() => handleReadLetter(letter)}
                          className="bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/15 p-4 rounded-xl shadow-xs border-l-4 border-l-secondary cursor-pointer transition-colors flex items-center justify-between select-none animate-slide-up"
                        >
                          <div className="overflow-hidden">
                            <h5 className="font-display font-semibold text-xs text-on-surface flex items-center space-x-2">
                              <span>{letter.title}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 inline-block animate-ping"></span>
                            </h5>
                            <p className="text-[10px] text-on-surface-variant font-semibold mt-1">Unlocked • Written {letter.createdAt}</p>
                          </div>

                          <div className="px-3 py-1.5 bg-secondary-container text-on-secondary-container font-bold text-[10px] uppercase rounded-lg">
                            {loadingDetailLetter ? 'Opening...' : 'Read'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Unlocked letter Detail modal */}
      {unlockedLetterToRead && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-lg w-full border border-outline-variant/20 shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => setUnlockedLetterToRead(null)}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-surface-container text-on-surface-variant border-none bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4 text-on-surface-variant" />
            </button>

            <div className="flex items-center space-x-3.5 mb-4 border-b border-surface-container-high pb-3 select-none">
              <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <Unlock className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-sm text-on-surface">{unlockedLetterToRead.title}</h4>
                <p className="text-[10px] text-on-surface-variant font-semibold">Written on {unlockedLetterToRead.createdAt} • Seal Duration: {unlockedLetterToRead.duration}</p>
              </div>
            </div>

            <div className="text-xs text-on-surface font-medium leading-relaxed bg-surface p-4 rounded-xl border border-outline-variant/20 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {unlockedLetterToRead.content}
            </div>

            <button 
              onClick={() => setUnlockedLetterToRead(null)}
              className="mt-5 w-full bg-primary hover:bg-primary/95 text-white font-bold text-xs py-3 rounded-xl shadow-xs shrink-0 cursor-pointer select-none border-none"
            >
              Acknowledge gently
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
