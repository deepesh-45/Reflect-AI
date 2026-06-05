import { useState, useEffect } from 'react';
import { 
  Bell, 
  Flame, 
  Sparkles, 
  ChevronRight, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { JournalEntry, MoodType } from '../types';
import api from '../config/api';

interface DashboardViewProps {
  onSelectEntry: (entry: JournalEntry) => void;
  onNavigate: (view: string) => void;
  reflections: JournalEntry[];
}

const EMOTION_COLORS: Record<string, string> = {
  Happy: '#ffd60a',
  Sad: '#74b0ff',
  Stressed: '#f28b82',
  Angry: '#ff6b6b',
  Excited: '#ff9f43',
  Lonely: '#c3a6ff',
  Neutral: '#8892a4',
  Calm: '#8ba899',
  Joy: '#cc9674',
  Anxious: '#5d5b78',
  Pensive: '#e0dcfe',
};

export default function DashboardView({ onSelectEntry, onNavigate, reflections }: DashboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [reflections]); // Refresh when reflections list changes

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/dashboard');
      setDashboardData(res.data);
    } catch (e: any) {
      console.error(e);
      setError('Could not retrieve dashboard analytics. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <span className="text-on-surface-variant text-sm font-semibold animate-pulse">Compiling sanctuary statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background p-8">
        <div className="max-w-md w-full bg-surface-container-lowest border border-error/25 p-6 rounded-2xl shadow-lg text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-error mx-auto" />
          <h3 className="text-lg font-bold text-on-surface">Analytics Offline</h3>
          <p className="text-sm text-on-surface-variant">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-2.5 rounded-xl cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { summary, streak, analytics } = dashboardData || {};
  const { totalEntries, primaryEmotion, averageConfidence, emotionDistribution = [], moodTimeline = [] } = analytics || {};

  // Custom SVG line chart calculations
  const chartHeight = 220;
  const paddingY = 30;
  const graphHeight = chartHeight - paddingY * 2;
  
  const points = moodTimeline.map((item: any, i: number) => {
    const x = moodTimeline.length > 1 
      ? 40 + i * (420 / (moodTimeline.length - 1))
      : 250; // center if only one item
    const confidenceScore = item.confidence || 50;
    const y = chartHeight - paddingY - (confidenceScore / 100) * graphHeight;
    return { x, y, ...item };
  });

  const createBezierPath = () => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = createBezierPath();
  const fillPath = points.length > 1 
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z` 
    : '';

  // Doughnut visual segments mapping
  // Circumference: 2 * Math.PI * 38 = 238.76
  const circumference = 238.76;
  let runningPercentage = 0;

  return (
    <div className="flex-1 overflow-y-auto max-h-screen">
      
      {/* Top Banner Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-10 flex justify-between items-center h-16 px-8 border-b border-outline-variant/10">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Weekly Overview</h2>
        <div className="flex items-center space-x-4">
          <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/40 rounded-full transition-colors relative cursor-pointer border-none bg-transparent">
            <Bell className="w-5 h-5 text-on-surface-variant" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-error animate-ping"></span>
          </button>
        </div>
      </header>

      {/* Main Core Viewport Grid */}
      <div className="p-8 space-y-6">
        
        {/* Main Columns: Timeline and Stats block */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Timeline View: Spans 2 columns */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-6 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-medium text-lg text-on-surface">Mood Timeline</h3>
              <div className="flex items-center space-x-1.5 text-xs text-on-surface-variant">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Weekly Trends</span>
              </div>
            </div>

            {/* Custom Interactive SVG Line Plot */}
            <div className="flex-1 min-h-[300px] relative flex flex-col justify-end">
              {moodTimeline.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant/70">
                  <p className="text-4xl mb-2">📊</p>
                  <p className="text-sm font-medium">Write journal entries to begin tracking your mood timeline.</p>
                </div>
              ) : (
                <div className="w-full flex-1 relative flex items-center">
                  <svg viewBox={`0 0 500 ${chartHeight}`} className="w-full h-full overflow-visible">
                    {/* Grid Lines */}
                    {[0, 25, 50, 75, 100].map((step) => {
                      const lineY = chartHeight - paddingY - (step / 100) * graphHeight;
                      return (
                        <g key={step}>
                          <line 
                            x1="30" 
                            y1={lineY} 
                            x2="480" 
                            y2={lineY} 
                            stroke="#e6eeff" 
                            strokeWidth="1.2" 
                            strokeDasharray="4 4"
                          />
                          <text 
                            x="15" 
                            y={lineY + 4} 
                            fill="#727974" 
                            fontSize="10" 
                            textAnchor="end"
                            className="font-sans opacity-80"
                          >
                            {step}
                          </text>
                        </g>
                      );
                    })}

                    {/* Gradient Area Fill Under Curve */}
                    <defs>
                      <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#496457" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#496457" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Curves Paths */}
                    {points.length > 1 && (
                      <path d={fillPath} fill="url(#chart-fill)" />
                    )}
                    {points.length > 0 && (
                      <>
                        <path 
                          d={linePath} 
                          fill="none" 
                          stroke="#496457" 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          className="transition-all duration-1000 ease-in-out"
                        />

                        {/* Interactive Nodes */}
                        {points.map((p: any, idx: number) => (
                          <g key={idx} className="cursor-pointer" onClick={() => setSelectedPoint(idx)}>
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={selectedPoint === idx ? 8 : 5} 
                              fill={selectedPoint === idx ? '#496457' : '#ffffff'} 
                              stroke="#496457" 
                              strokeWidth="2.5"
                              className="transition-all duration-200"
                            />
                            {selectedPoint === idx && (
                              <g>
                                <rect 
                                  x={p.x - 45} 
                                  y={p.y - 38} 
                                  width="90" 
                                  height="24" 
                                  rx="6" 
                                  fill="#233144" 
                                  className="shadow-lg"
                                />
                                <text 
                                  x={p.x} 
                                  y={p.y - 22} 
                                  fill="#ffffff" 
                                  fontSize="9" 
                                  textAnchor="middle" 
                                  fontWeight="bold" 
                                  className="font-sans"
                                >
                                  {p.emotion}: {p.confidence}%
                                </text>
                              </g>
                            )}
                          </g>
                        ))}
                      </>
                    )}
                  </svg>
                </div>
              )}

              {/* Graph X Scale Labels */}
              {moodTimeline.length > 0 && (
                <div className="flex justify-between pl-8 pr-4 pt-2 border-t border-surface-container/30">
                  {moodTimeline.map((d: any, i: number) => (
                    <span key={i} className="text-[10px] text-on-surface-variant font-semibold opacity-85 w-14 text-center truncate">
                      {d.date}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side stats blocks: Doughnut and insight */}
          <div className="space-y-6 flex flex-col justify-between">
            
            {/* Emotion Doughnut card */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-6 flex-1 flex flex-col justify-between relative overflow-hidden">
              <h3 className="font-display font-medium text-lg text-on-surface mb-2">Emotion Distribution</h3>
              
              <div className="flex-1 relative min-h-[170px] flex items-center justify-center">
                {emotionDistribution.length === 0 ? (
                  <span className="text-xs text-on-surface-variant font-medium opacity-70">No emotions logged yet.</span>
                ) : (
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Ring Visual Representation */}
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {emotionDistribution.map((e: any, idx: number) => {
                        const strokeLength = (e.percentage / 100) * circumference;
                        const dashOffset = circumference - strokeLength;
                        const rotateAngle = (runningPercentage / 100) * 360;
                        const color = EMOTION_COLORS[e.name] || '#8892a4';
                        
                        runningPercentage += e.percentage;

                        return (
                          <circle 
                            key={idx}
                            cx="50" 
                            cy="50" 
                            r="38" 
                            fill="transparent" 
                            stroke={color} 
                            strokeWidth="14" 
                            strokeDasharray={`${circumference}`} 
                            strokeDashoffset={dashOffset}
                            transform={`rotate(${rotateAngle} 50 50)`}
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-bold text-on-surface">{averageConfidence}%</span>
                      <span className="text-[9px] text-on-surface-variant font-medium tracking-tight">Avg confidence</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Legends */}
              {emotionDistribution.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-surface-container/30">
                  {emotionDistribution.map((e: any, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2 text-[10px] font-semibold text-on-surface-variant">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: EMOTION_COLORS[e.name] || '#8892a4' }} />
                      <span className="truncate">{e.name} ({e.percentage}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Streak & Weekly Summary Info Box */}
            <div className="bg-primary/5 rounded-2xl shadow-sm p-6 border border-primary/10 relative overflow-hidden flex-shrink-0">
              <div className="absolute right-0 bottom-0 w-28 h-28 bg-primary-container/10 rounded-tl-full blur-xl pointer-events-none -mr-4 -mb-4"></div>
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-sm text-primary">Sanctuary Insight</h3>
              </div>
              
              <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-outline-variant/20 shadow-sm mb-4">
                <span className="text-xs font-semibold text-on-surface">Journaling Streak</span>
                <div className="flex items-center text-tertiary text-xs font-bold space-x-1">
                  <Flame className="w-4 h-4 fill-tertiary text-tertiary shrink-0" />
                  <span>{streak} {streak === 1 ? 'Day' : 'Days'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-outline-variant/20 shadow-sm">
                <span className="text-xs font-semibold text-on-surface">Primary Mood</span>
                <span 
                  className="text-xs font-bold px-2 py-0.5 rounded-full uppercase"
                  style={{ 
                    backgroundColor: `${EMOTION_COLORS[primaryEmotion] || '#8892a4'}15`, 
                    color: EMOTION_COLORS[primaryEmotion] || '#8892a4' 
                  }}
                >
                  {primaryEmotion || 'Neutral'}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Gemini AI Summary Card */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-6">
          <div className="flex items-center space-x-2.5 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display font-medium text-lg text-on-surface">AI Weekly Wellness Insights</h3>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="text-3xl select-none">💡</div>
            <div className="flex-1">
              {summary ? (
                <p className="text-xs font-medium text-on-surface/90 leading-relaxed whitespace-pre-wrap text-justify">
                  {summary}
                </p>
              ) : (
                <p className="text-xs text-on-surface-variant font-medium italic">
                  Keep documenting your reflections. As you save more entries, ReflectAI will automatically analyze your triggers, emotional timeline, and provide supportive, customized mental wellness guidance here.
                </p>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
