import { useState, useEffect } from 'react';
import api from '../config/api';

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/community');
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Could not fetch community posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const res = await api.post('/api/community', { content, anonymous });
      
      // Prepend the new post to the local state
      setPosts([res.data.post, ...posts]);
      setContent('');
      setSuccess('Your reflection has been shared with the community!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error sharing post:', err);
      setError('Failed to share post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (postId, reactionType) => {
    try {
      // Optmistic UI Update
      setPosts((prevPosts) => 
        prevPosts.map((p) => {
          if (p.id === postId) {
            const field = `${reactionType}Count`;
            return { ...p, [field]: (p[field] || 0) + 1 };
          }
          return p;
        })
      );
      
      await api.post(`/api/community/${postId}/react`, { reactionType });
    } catch (err) {
      console.error('Error reacting to post:', err);
      // Rollback optimistic update
      setPosts((prevPosts) => 
        prevPosts.map((p) => {
          if (p.id === postId) {
            const field = `${reactionType}Count`;
            return { ...p, [field]: Math.max(0, (p[field] || 1) - 1) };
          }
          return p;
        })
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <h2>Community Feed</h2>
        <p>A positive, anonymous space to share daily feelings, seek support, and inspire fellow students.</p>
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

      {/* Share Reflection Section */}
      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Share a Reflection</h3>
        <div className="form-group">
          <textarea
            className="textarea"
            placeholder="How are you feeling today? Share your thoughts, struggles, or small victories anonymously..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ minHeight: 100 }}
            required
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
            />
            Post anonymously as "Anonymous Companion"
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting || !content.trim()}>
            {submitting ? 'Sharing...' : 'Share with Community'}
          </button>
        </div>
      </form>

      {/* Community Feed Posts */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🌿 Student Reflections
        </h3>
        
        {loading && posts.length === 0 ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 120, marginBottom: 16 }}></div>
          ))
        ) : posts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🤝</p>
            <p>No community posts shared yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="community-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: post.anonymous ? 'var(--secondary)' : 'var(--primary-light)' }}>
                  👤 {post.creatorName}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {formatDate(post.createdAt)}
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: 14 }}>
                {post.content}
              </p>
              
              {/* Positive Reactions */}
              <div className="reaction-row">
                <button 
                  className="reaction-btn" 
                  onClick={() => handleReact(post.id, 'relate')}
                  title="I can relate to this"
                >
                  🤝 Relate ({post.relateCount || 0})
                </button>
                <button 
                  className="reaction-btn" 
                  onClick={() => handleReact(post.id, 'support')}
                  title="Sending you support"
                >
                  ❤️ Support ({post.supportCount || 0})
                </button>
                <button 
                  className="reaction-btn" 
                  onClick={() => handleReact(post.id, 'inspire')}
                  title="This inspires me"
                >
                  ✨ Inspire ({post.inspireCount || 0})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
