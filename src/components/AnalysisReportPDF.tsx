import React from 'react';

interface CategoryScores {
  [key: string]: number | undefined;
}

interface VideoFace {
  microExpressions: string;
  eyeMovement: string;
}

interface VideoBody {
  posture: string;
  handMovements: string;
}

interface EmotionMap {
  [key: string]: number;
}

interface ReportResults {
  summary: string;
  strengths?: string[];
  areasToImprove?: string[];
  categoryScores?: CategoryScores;
  truthfulness?: number;
  stressLevel?: string;
  emotions?: EmotionMap;
  face?: VideoFace;
  body?: VideoBody;
  inconsistencies?: string[];
  overallScore?: number;
  videoAnalysis?: { eyeContact: number; posture: number; facialExpressions: string };
  voiceAnalysis?: { confidence: number; pace: number; clarity: number; fillerWords: number };
  coachingTips?: string[];
  toxicity?: number;
  category?: string;
  redFlags?: string[];
  gaslighting?: number;
  manipulation?: number;
}

interface ReportProps {
  type: 'video' | 'voice' | 'live' | 'toxic';
  results: ReportResults;
  id?: string;
}

const COLORS = {
  primary: '#1337ec',
  ai: '#8b5cf6',
  success: '#10b981',
  warning: '#ef4444',
  text: '#1a1a2e',
  muted: '#6b7280',
  border: '#e5e7eb',
  bg: '#FAFBFF',
};

const s = {
  wrap: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    width: '850px',
    padding: '56px 56px 40px',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    position: 'relative' as const,
  },
  watermark: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-35deg)',
    fontSize: '110px',
    fontWeight: 900,
    color: 'rgba(19,55,236,0.03)',
    letterSpacing: '-4px',
    userSelect: 'none' as const,
    pointerEvents: 'none' as const,
    whiteSpace: 'nowrap' as const,
    zIndex: 0,
  },
  header: {
    borderBottom: `3px solid ${COLORS.primary}`,
    paddingBottom: '24px',
    marginBottom: '36px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    position: 'relative' as const,
    zIndex: 1,
  },
  title: {
    fontSize: '42px',
    margin: 0,
    fontWeight: 900,
    background: 'linear-gradient(135deg, #1337ec 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text' as const,
    WebkitTextFillColor: 'transparent' as const,
    letterSpacing: '-1.5px',
    lineHeight: 1,
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '11px',
    color: COLORS.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '3px',
    fontWeight: 700,
  },
  scoreBox: (borderColor: string) => ({
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '28px',
    textAlign: 'center' as const,
    borderTop: `4px solid ${borderColor}`,
    boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
  }),
  section: (bg: string) => ({
    marginBottom: '24px',
    backgroundColor: bg,
    padding: '22px 24px',
    borderRadius: '16px',
    position: 'relative' as const,
    zIndex: 1,
  }),
  sectionTitle: (color: string) => ({
    fontSize: '14px',
    color,
    marginTop: 0,
    marginBottom: '12px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '1.5px',
  }),
  list: { margin: 0, paddingLeft: '20px', fontSize: '13.5px', lineHeight: '1.7' },
};

const CircularScore = ({ score, color }: { score: number; color: string }) => {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: '88px', height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={r} stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
        <circle cx="44" cy="44" r={r} stroke={color} strokeWidth="8" fill="transparent"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'relative', fontWeight: 800, fontSize: '20px', color: COLORS.text }}>{score}</div>
    </div>
  );
};

const BarRow = ({ label, value, color = COLORS.primary }: { label: string; value: number; color?: string }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
      <span style={{ color: '#4b5563', textTransform: 'capitalize', fontWeight: 500 }}>
        {label.replace(/([A-Z])/g, ' $1').trim()}
      </span>
      <span style={{ fontWeight: 700, color }}>{value}%</span>
    </div>
    <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '6px', height: '7px' }}>
      <div style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, height: '7px', borderRadius: '6px' }} />
    </div>
  </div>
);

const CinematicSeal = ({ type }: { type: string }) => {
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const reportId = Math.random().toString(36).substring(2, 10).toUpperCase();
  return (
    <div style={{
      marginTop: '48px',
      paddingTop: '36px',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Left: report metadata */}
      <div style={{ fontSize: '11px', color: COLORS.muted, lineHeight: 2 }}>
        <div><strong style={{ color: '#374151' }}>Report ID:</strong> <span style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>SMP-{reportId}</span></div>
        <div><strong style={{ color: '#374151' }}>Generated:</strong> {reportDate}</div>
        <div><strong style={{ color: '#374151' }}>Analysis Type:</strong> <span style={{ textTransform: 'uppercase', color: COLORS.primary, fontWeight: 700 }}>{type}</span></div>
        <div><strong style={{ color: '#374151' }}>Engine:</strong> SeeMePro AI · Powered by Gemini</div>
      </div>

      {/* Center: Cinematic Seal */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1337ec 0%, #8b5cf6 50%, #00CC66 100%)',
            padding: '3px',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            }}>
              <span style={{ fontSize: '18px', color: COLORS.primary, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
                See<span style={{ color: COLORS.ai }}>Me</span>
              </span>
              <div style={{ width: '48px', height: '2px', background: 'linear-gradient(90deg, #1337ec, #8b5cf6)', margin: '5px 0' }} />
              <span style={{ fontSize: '10px', color: COLORS.ai, fontWeight: 800, letterSpacing: '4px' }}>PRO</span>
              <div style={{ width: '36px', height: '1.5px', backgroundColor: '#00CC66', margin: '5px 0 3px' }} />
              <span style={{ fontSize: '6px', color: COLORS.muted, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>AI Certified</span>
            </div>
          </div>
          <svg style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
            <circle cx="60" cy="60" r="57" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.4" />
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '20px', padding: '4px 12px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ fontSize: '10px', color: '#065f46', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Verified Analysis</span>
        </div>
      </div>

      {/* Right: confidentiality */}
      <div style={{ fontSize: '10px', color: COLORS.muted, lineHeight: 1.9, textAlign: 'right', maxWidth: '220px' }}>
        <div style={{ fontWeight: 700, color: '#374151', marginBottom: '4px', fontSize: '11px' }}>CONFIDENTIAL</div>
        <div>This document is generated exclusively</div>
        <div>by the SeeMePro AI Engine and is</div>
        <div>intended only for the report recipient.</div>
        <div style={{ marginTop: '8px', color: COLORS.primary, fontWeight: 600 }}>seeme.pro</div>
      </div>
    </div>
  );
};

export const AnalysisReportPDF: React.FC<ReportProps> = ({ type, results, id = 'pdf-report-content' }) => {
  if (!results) return null;

  const mainScore = type === 'live'
    ? (results.overallScore ?? 0)
    : type === 'toxic'
    ? (results.toxicity ?? 0)
    : (results.truthfulness ?? 0);

  const reportLabel = type === 'video' ? 'Video Behavioral Analysis'
    : type === 'voice' ? 'Voice & Speech Analysis'
    : type === 'toxic' ? 'Relationship Toxicity Analysis'
    : 'Live Interview Analysis';

  const mainScoreColor = type === 'toxic'
    ? (mainScore > 70 ? '#ef4444' : mainScore > 40 ? '#f97316' : '#10b981')
    : COLORS.primary;

  return (
    <div id={id} style={s.wrap}>
      {/* Watermark */}
      <div style={s.watermark}>SeeMePro</div>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>SeeMePro</h1>
          <p style={s.subtitle}>Gemini AI — {reportLabel} Report</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, letterSpacing: '1px' }}>AI VERIFIED</span>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #1337ec, #8b5cf6)', borderRadius: '12px', padding: '10px 18px', display: 'inline-block' }}>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>{mainScore}%</span>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', letterSpacing: '1px', marginTop: '2px', textTransform: 'uppercase' }}>
              {type === 'live' ? 'Overall Score' : type === 'toxic' ? 'Toxicity Level' : 'Integrity Score'}
            </div>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
        <div style={s.scoreBox(mainScoreColor)}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '12px', color: COLORS.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {type === 'live' ? 'Overall Performance' : type === 'toxic' ? 'Toxicity Level' : 'Behavioral Integrity'}
          </h3>
          <CircularScore score={mainScore} color={mainScoreColor} />
        </div>

        {type === 'voice' && results.stressLevel && (
          <div style={s.scoreBox('#f97316')}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '12px', color: COLORS.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Stress Level</h3>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#f97316', lineHeight: '88px' }}>{results.stressLevel}</div>
          </div>
        )}

        {type === 'live' && results.videoAnalysis && (
          <div style={s.scoreBox(COLORS.ai)}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: COLORS.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Video · Voice</h3>
            <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 2.2 }}>
              Eye Contact: <strong style={{ color: COLORS.primary }}>{results.videoAnalysis.eyeContact}%</strong><br />
              Posture: <strong style={{ color: COLORS.primary }}>{results.videoAnalysis.posture}%</strong><br />
              Confidence: <strong style={{ color: COLORS.primary }}>{results.voiceAnalysis?.confidence}%</strong><br />
              Pace: <strong style={{ color: COLORS.primary }}>{results.voiceAnalysis?.pace}%</strong>
            </div>
          </div>
        )}

        {type === 'toxic' && (
          <div style={s.scoreBox('#ef4444')}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '12px', color: COLORS.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Risk Indicators</h3>
            <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 2.2 }}>
              Gaslighting: <strong style={{ color: '#ef4444' }}>{results.gaslighting ?? 0}%</strong><br />
              Manipulation: <strong style={{ color: '#f97316' }}>{results.manipulation ?? 0}%</strong><br />
              Red Flags: <strong style={{ color: '#dc2626' }}>{results.redFlags?.length ?? 0} detected</strong>
            </div>
          </div>
        )}

        <div style={{ ...s.scoreBox(COLORS.success), display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: COLORS.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Report Info</h3>
          <div style={{ fontSize: '11px', color: '#4b5563', lineHeight: 2 }}>
            <div>Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong></div>
            <div>Type: <strong style={{ textTransform: 'uppercase', color: COLORS.primary }}>{type}</strong></div>
            <div>Status: <strong style={{ color: COLORS.success }}>Completed ✓</strong></div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ ...s.section('#fff'), border: `1px solid ${COLORS.border}`, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', color: COLORS.text, marginTop: 0, marginBottom: '10px', fontWeight: 700 }}>
          {type === 'toxic' ? '🔍 Relationship Assessment Summary' : '📊 Detailed Behavioral Summary'}
        </h2>
        <p style={{ fontSize: '13.5px', lineHeight: '1.85', color: '#4b5563', margin: 0 }}>{results.summary}</p>
      </div>

      {/* Toxic Red Flags */}
      {type === 'toxic' && results.redFlags && results.redFlags.length > 0 && (
        <div style={{ ...s.section('#fff5f5'), border: '1px solid #fecaca', marginBottom: '24px' }}>
          <h3 style={s.sectionTitle('#dc2626')}>🚩 Red Flags Detected ({results.redFlags.length})</h3>
          <ul style={{ ...s.list, color: '#7f1d1d' }}>
            {results.redFlags.map((flag, i) => <li key={i} style={{ marginBottom: '6px' }}>{flag}</li>)}
          </ul>
        </div>
      )}

      {/* Strengths + Areas */}
      {(results.strengths?.length || results.areasToImprove?.length) && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          {results.strengths?.length && (
            <div style={{ flex: 1, padding: '20px', backgroundColor: '#ecfdf5', borderRadius: '16px', borderLeft: '4px solid #10b981' }}>
              <h3 style={s.sectionTitle('#047857')}>✅ Key Strengths</h3>
              <ul style={{ ...s.list, color: '#065f46' }}>
                {results.strengths.map((str, i) => <li key={i} style={{ marginBottom: '4px' }}>{str}</li>)}
              </ul>
            </div>
          )}
          {results.areasToImprove?.length && (
            <div style={{ flex: 1, padding: '20px', backgroundColor: '#fff1f2', borderRadius: '16px', borderLeft: '4px solid #e11d48' }}>
              <h3 style={s.sectionTitle('#be123c')}>⚠️ Areas to Improve</h3>
              <ul style={{ ...s.list, color: '#9f1239' }}>
                {results.areasToImprove.map((a, i) => <li key={i} style={{ marginBottom: '4px' }}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Category Scores */}
      {results.categoryScores && Object.keys(results.categoryScores).length > 0 && (
        <div style={{ ...s.section('#f9fafb'), marginBottom: '24px', border: `1px solid ${COLORS.border}` }}>
          <h3 style={{ fontSize: '13px', color: '#374151', marginTop: 0, marginBottom: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            📈 Category Breakdown
          </h3>
          <div style={{ columns: 2, columnGap: '32px' }}>
            {(Object.entries(results.categoryScores) as [string, number | undefined][]).map(([k, v]) =>
              v !== undefined ? <BarRow key={k} label={k} value={v} /> : null
            )}
          </div>
        </div>
      )}

      {/* Video: Face + Body */}
      {type === 'video' && (results.face || results.body) && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          {results.face && (
            <div style={{ flex: 1, ...s.section('#f0f4ff') }}>
              <h3 style={s.sectionTitle(COLORS.primary)}>👁️ Facial Expressions</h3>
              <ul style={{ ...s.list, color: '#4b5563' }}>
                <li style={{ marginBottom: '6px' }}><strong>Micro-expressions:</strong> {results.face.microExpressions}</li>
                <li><strong>Eye Tracking:</strong> {results.face.eyeMovement}</li>
              </ul>
            </div>
          )}
          {results.body && (
            <div style={{ flex: 1, ...s.section('#fdf4ff') }}>
              <h3 style={s.sectionTitle(COLORS.ai)}>🧍 Body Language</h3>
              <ul style={{ ...s.list, color: '#4b5563' }}>
                <li style={{ marginBottom: '6px' }}><strong>Posture:</strong> {results.body.posture}</li>
                <li><strong>Gestures:</strong> {results.body.handMovements}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Video: Inconsistencies */}
      {type === 'video' && results.inconsistencies && results.inconsistencies.length > 0 && (
        <div style={{ ...s.section('#fffbeb'), borderLeft: '4px solid #f59e0b', marginBottom: '24px' }}>
          <h3 style={s.sectionTitle('#b45309')}>⚡ Critical Inconsistencies Detected</h3>
          <ul style={{ ...s.list, color: '#92400e' }}>
            {results.inconsistencies.map((inc, i) => <li key={i} style={{ marginBottom: '4px' }}>{inc}</li>)}
          </ul>
        </div>
      )}

      {/* Voice: Emotions */}
      {type === 'voice' && results.emotions && (
        <div style={{ ...s.section('#f0f4ff'), marginBottom: '24px', border: `1px solid ${COLORS.border}` }}>
          <h3 style={s.sectionTitle(COLORS.primary)}>🎭 Emotion Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {Object.entries(results.emotions).map(([emo, val]) => (
              <div key={emo} style={{ textAlign: 'center', padding: '14px 10px', backgroundColor: '#e0e7ff', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '22px', color: COLORS.primary }}>{val}%</div>
                <div style={{ fontSize: '11px', color: '#4b5563', textTransform: 'capitalize', marginTop: '4px', fontWeight: 600 }}>{emo}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live: Coaching Tips */}
      {type === 'live' && results.coachingTips && results.coachingTips.length > 0 && (
        <div style={{ ...s.section('#f0fdf4'), borderLeft: '4px solid #22c55e', marginBottom: '24px' }}>
          <h3 style={s.sectionTitle('#15803d')}>💡 Coaching Tips</h3>
          <ol style={{ ...s.list, color: '#166534' }}>
            {results.coachingTips.map((tip, i) => <li key={i} style={{ marginBottom: '6px' }}>{tip}</li>)}
          </ol>
        </div>
      )}

      {/* Live: Facial Expression Note */}
      {type === 'live' && results.videoAnalysis?.facialExpressions && (
        <div style={{ ...s.section('#fdf4ff'), marginBottom: '24px' }}>
          <h3 style={s.sectionTitle(COLORS.ai)}>😊 Facial Expression Analysis</h3>
          <p style={{ fontSize: '13.5px', color: '#4b5563', margin: 0, lineHeight: '1.7' }}>{results.videoAnalysis.facialExpressions}</p>
        </div>
      )}

      {/* Cinematic Seal */}
      <CinematicSeal type={type} />
    </div>
  );
};
