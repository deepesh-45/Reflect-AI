import { useState, useEffect } from 'react';
import api from '../config/api';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

const EMOTION_COLORS = {
  Happy: 'var(--happy)',
  Sad: 'var(--sad)',
  Stressed: 'var(--stressed)',
  Angry: 'var(--angry)',
  Excited: 'var(--excited)',
  Lonely: 'var(--lonely)',
  Neutral: 'var(--neutral)',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Could not retrieve dashboard analytics. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <div className="page-header">
          <h2>Dashboard</h2>
          <p>Compiling reflection statistics...</p>
        </div>
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="card skeleton" style={{ height: 110 }}></div>
          <div className="card skeleton" style={{ height: 110 }}></div>
          <div className="card skeleton" style={{ height: 110 }}></div>
        </div>
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card skeleton" style={{ height: 320 }}></div>
          <div className="card skeleton" style={{ height: 320 }}></div>
        </div>
        <div className="card skeleton" style={{ height: 200 }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <div className="page-header">
          <h2>Dashboard</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--error)', padding: '20px 24px' }}>
          <p style={{ color: 'var(--error)', marginBottom: 12 }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchDashboard}>Retry</button>
        </div>
      </div>
    );
  }

  const { summary, streak, analytics } = data || {};
  const { totalEntries, primaryEmotion, averageConfidence, emotionDistribution, moodTimeline } = analytics || {};

  // Custom Tooltip for Timeline
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.date}</p>
          <p style={{ fontSize: 13, fontWeight: 600 }}>{item.title || 'Untitled Entry'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span className={`emotion-badge emotion-${item.emotion}`}>{item.emotion}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({item.confidence}% confidence)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Monitor your mental wellness trends and view tailored reflection feedback.</p>
      </div>

      {/* Analytics stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,168,153,0.15)', color: 'var(--primary-light)' }}>🔥</div>
          <div>
            <div className="stat-value">{streak} {streak === 1 ? 'day' : 'days'}</div>
            <div className="stat-label">Journaling Streak</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(165,162,194,0.15)', color: 'var(--secondary)' }}>📝</div>
          <div>
            <div className="stat-value">{totalEntries}</div>
            <div className="stat-label">Total Reflections</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ 
            background: `rgba(${primaryEmotion === 'Happy' ? '255,214,10' : '139,168,153'}, 0.15)`, 
            color: EMOTION_COLORS[primaryEmotion] || 'var(--primary)' 
          }}>
            🌟
          </div>
          <div>
            <div className="stat-value" style={{ color: EMOTION_COLORS[primaryEmotion] }}>
              {primaryEmotion}
            </div>
            <div className="stat-label">Primary Emotion (Avg: {averageConfidence}%)</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Timeline Chart */}
        <div className="card">
          <h3 className="card-title">📈 Mood Timeline</h3>
          {moodTimeline && moodTimeline.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moodTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-dim)" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="var(--primary)" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorConfidence)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Write your first journal entry to start mapping your timeline.
            </div>
          )}
        </div>

        {/* Emotion Distribution */}
        <div className="card">
          <h3 className="card-title">🍩 Emotion Distribution</h3>
          {emotionDistribution && emotionDistribution.length > 0 ? (
            <div style={{ width: '100%', height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {emotionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.name] || 'var(--neutral)'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
                      itemStyle={{ color: 'var(--text)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, fontSize: 11 }}>
                {emotionDistribution.map((entry) => (
                  <span key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: EMOTION_COLORS[entry.name] }} />
                    {entry.name} ({entry.percentage}%)
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No emotions recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Gemini AI Summary Card */}
      <div className="card">
        <h3 className="card-title">🤖 AI Reflection Companion Insights</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 32 }}>💡</div>
          <div style={{ flex: 1 }}>
            {summary ? (
              <p style={{ lineHeight: 1.7, fontSize: 14, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {summary}
              </p>
            ) : (
              <p style={{ lineHeight: 1.7, fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Write journal entries to unlock a personalized, AI-generated overview of your emotional patterns, triggers, and growth pointers.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
