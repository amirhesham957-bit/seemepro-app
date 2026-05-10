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
  // Shared
  summary: string;
  strengths?: string[];
  areasToImprove?: string[];
  categoryScores?: CategoryScores;
  // Voice
  truthfulness?: number;
  stressLevel?: string;
  emotions?: EmotionMap;
  // Video
  face?: VideoFace;
  body?: VideoBody;
  inconsistencies?: string[];
  // Live
  overallScore?: number;
  videoAnalysis?: { eyeContact: number; posture: number; facialExpressions: string };
  voiceAnalysis?: { confidence: number; pace: number; clarity: number; fillerWords: number };
  coachingTips?: string[];
}

interface ReportProps {
  type: 'video' | 'voice' | 'live';
  results: ReportResults;
  id?: string;
}

const s = {
  wrap: {
    backgroundColor: '#FCFCFD',
    color: '#1a1a2e',
    width: '850px',
    padding: '50px',
    fontFamily: '"Inter", sans-serif',
    position: 'absolute' as const,
    top: '-9999px',
    left: '-9999px',
    zIndex: -1,
  },
  header: {
    borderBottom: '2px solid #8b5cf6',
    paddingBottom: '20px',
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: { fontSize: '36px', margin: 0, fontWeight: 900, color: '#1337ec', letterSpacing: '-1px' },
  subtitle: { margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '2px', fontWeight: 600 },
  scoreBox: (borderColor: string) => ({
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    padding: '25px',
    textAlign: 'center' as const,
    borderTop: `4px solid ${borderColor}`,
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  }),
  section: (bg: string) => ({ marginBottom: '25px', backgroundColor: bg, padding: '20px', borderRadius: '12px' }),
  sectionTitle: (color: string) => ({ fontSize: '16px', color, marginTop: 0, marginBottom: '10px' }),
  list: { margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' },
};

const CircularScore = ({ score, color }: { score: number; color: string }) => {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} stroke="#e5e7eb" strokeWidth="8" fill="transparent" />
        <circle cx="40" cy="40" r={r} stroke={color} strokeWidth="8" fill="transparent" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: 'relative', fontWeight: 'bold', fontSize: '18px', color: '#1a1a2e' }}>{score}</div>
    </div>
  );
};

const BarRow = ({ label, value }: { label: string; value: number }) => (
  <div style={{ marginBottom: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
      <span style={{ color: '#4b5563', textTransform: 'capitalize' }}>{label.replace(/([A-Z])/g, ' $1').trim()}</span>
      <span style={{ fontWeight: 600, color: '#1337ec' }}>{value}%</span>
    </div>
    <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '6px' }}>
      <div style={{ width: `${value}%`, backgroundColor: '#1337ec', height: '6px', borderRadius: '4px' }} />
    </div>
  </div>
);

export const AnalysisReportPDF: React.FC<ReportProps> = ({ type, results, id = 'pdf-report-content' }) => {
  if (!results) return null;

  const mainScore = type === 'live'
    ? (results.overallScore ?? 0)
    : (results.truthfulness ?? 0);

  const reportLabel = type === 'video' ? 'Video Behavioral Analysis'
    : type === 'voice' ? 'Voice & Speech Analysis'
    : 'Live Interview Analysis';

  return (
    <div id={id} style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>SeeMe Pro</h1>
          <p style={s.subtitle}>Gemini AI — {reportLabel} Report</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
            ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Main Score Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={s.scoreBox('#1337ec')}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#4b5563', fontWeight: 600 }}>
            {type === 'live' ? 'Overall Performance' : 'Behavioral Integrity'}
          </h3>
          <CircularScore score={mainScore} color="#1337ec" />
        </div>

        {type === 'voice' && results.stressLevel && (
          <div style={s.scoreBox('#00CC66')}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#4b5563', fontWeight: 600 }}>Stress Level</h3>
            <div style={{ fontSize: '38px', fontWeight: 800, color: '#00CC66', lineHeight: '80px' }}>{results.stressLevel}</div>
          </div>
        )}

        {type === 'live' && results.videoAnalysis && (
          <div style={s.scoreBox('#8b5cf6')}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4b5563', fontWeight: 600 }}>Video · Voice Scores</h3>
            <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '2' }}>
              Eye Contact: <strong>{results.videoAnalysis.eyeContact}%</strong><br />
              Posture: <strong>{results.videoAnalysis.posture}%</strong><br />
              Confidence: <strong>{results.voiceAnalysis?.confidence}%</strong><br />
              Pace: <strong>{results.voiceAnalysis?.pace}%</strong>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{ ...s.section('#fff'), border: '1px solid #e5e7eb', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '18px', color: '#1f2937', marginTop: 0, marginBottom: '12px' }}>Detailed Behavioral Summary</h2>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#4b5563', margin: 0 }}>{results.summary}</p>
      </div>

      {/* Strengths + Areas */}
      {(results.strengths?.length || results.areasToImprove?.length) && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
          {results.strengths?.length && (
            <div style={{ flex: 1, padding: '18px', backgroundColor: '#ecfdf5', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
              <h3 style={s.sectionTitle('#047857')}>Key Strengths</h3>
              <ul style={{ ...s.list, color: '#065f46' }}>
                {results.strengths.map((str, i) => <li key={i}>{str}</li>)}
              </ul>
            </div>
          )}
          {results.areasToImprove?.length && (
            <div style={{ flex: 1, padding: '18px', backgroundColor: '#fff1f2', borderRadius: '12px', borderLeft: '4px solid #e11d48' }}>
              <h3 style={s.sectionTitle('#be123c')}>Areas to Improve</h3>
              <ul style={{ ...s.list, color: '#9f1239' }}>
                {results.areasToImprove.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Category Scores */}
      {results.categoryScores && Object.keys(results.categoryScores).length > 0 && (
        <div style={{ ...s.section('#f9fafb'), marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', color: '#374151', marginTop: 0, marginBottom: '15px' }}>Category Breakdown</h3>
          <div style={{ columns: 2, columnGap: '30px' }}>
            {(Object.entries(results.categoryScores) as [string, number | undefined][]).map(([k, v]) =>
              v !== undefined ? <BarRow key={k} label={k} value={v} /> : null
            )}
          </div>
        </div>
      )}

      {/* Video-specific */}
      {type === 'video' && (results.face || results.body) && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
          {results.face && (
            <div style={{ flex: 1, ...s.section('#f4f6ff') }}>
              <h3 style={s.sectionTitle('#1337ec')}>Facial Expressions</h3>
              <ul style={{ ...s.list, color: '#4b5563' }}>
                <li style={{ marginBottom: '6px' }}><strong>Micro-expressions:</strong> {results.face.microExpressions}</li>
                <li><strong>Eye Tracking:</strong> {results.face.eyeMovement}</li>
              </ul>
            </div>
          )}
          {results.body && (
            <div style={{ flex: 1, ...s.section('#fdf4ff') }}>
              <h3 style={s.sectionTitle('#8b5cf6')}>Body Language</h3>
              <ul style={{ ...s.list, color: '#4b5563' }}>
                <li style={{ marginBottom: '6px' }}><strong>Posture:</strong> {results.body.posture}</li>
                <li><strong>Gestures:</strong> {results.body.handMovements}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Video inconsistencies */}
      {type === 'video' && results.inconsistencies && results.inconsistencies.length > 0 && (
        <div style={{ ...s.section('#fffbeb'), borderLeft: '4px solid #f59e0b', marginBottom: '25px' }}>
          <h3 style={s.sectionTitle('#b45309')}>Critical Inconsistencies Detected</h3>
          <ul style={{ ...s.list, color: '#92400e' }}>
            {results.inconsistencies.map((inc, i) => <li key={i} style={{ marginBottom: '4px' }}>{inc}</li>)}
          </ul>
        </div>
      )}

      {/* Voice emotions */}
      {type === 'voice' && results.emotions && (
        <div style={{ ...s.section('#f4f6ff'), marginBottom: '25px' }}>
          <h3 style={s.sectionTitle('#1337ec')}>Emotion Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {Object.entries(results.emotions).map(([emo, val]) => (
              <div key={emo} style={{ textAlign: 'center', padding: '10px', backgroundColor: '#e0e7ff', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '20px', color: '#1337ec' }}>{val}%</div>
                <div style={{ fontSize: '11px', color: '#4b5563', textTransform: 'capitalize', marginTop: '2px' }}>{emo}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live coaching tips */}
      {type === 'live' && results.coachingTips && results.coachingTips.length > 0 && (
        <div style={{ ...s.section('#f0fdf4'), borderLeft: '4px solid #22c55e', marginBottom: '25px' }}>
          <h3 style={s.sectionTitle('#15803d')}>Coaching Tips</h3>
          <ol style={{ ...s.list, color: '#166534' }}>
            {results.coachingTips.map((tip, i) => <li key={i} style={{ marginBottom: '6px' }}>{tip}</li>)}
          </ol>
        </div>
      )}

      {/* Live: facial expression note */}
      {type === 'live' && results.videoAnalysis?.facialExpressions && (
        <div style={{ ...s.section('#fdf4ff'), marginBottom: '25px' }}>
          <h3 style={s.sectionTitle('#8b5cf6')}>Facial Expression Analysis</h3>
          <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>{results.videoAnalysis.facialExpressions}</p>
        </div>
      )}

      {/* Seal */}
      <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '2px dashed #e5e7eb', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <div style={{ width: '76px', height: '76px', borderRadius: '50%', border: '3px solid #00CC66', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00CC66', fontWeight: 'bold', fontSize: '9px', textAlign: 'center', transform: 'rotate(-15deg)', marginBottom: '10px' }}>
          VERIFIED<br />ANALYSIS<br />SEAL
        </div>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, textAlign: 'center', lineHeight: '1.6' }}>
          This document was securely generated by the SeeMe Pro AI Pipeline (Gemini Model).<br />
          Report type: <strong>{type.toUpperCase()}</strong> · Authenticity verified.
        </p>
      </div>
    </div>
  );
};
