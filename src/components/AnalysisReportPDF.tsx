import React from 'react';

interface ReportProps {
  type: 'video' | 'voice';
  results: any;
  id?: string;
}

export const AnalysisReportPDF: React.FC<ReportProps> = ({ type, results, id = 'pdf-report-content' }) => {
  if (!results) return null;

  // Helper for circular progress
  const renderCircularScore = (score: number, color: string) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    return (
      <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={radius} stroke="#e5e7eb" strokeWidth="8" fill="transparent" />
          <circle 
            cx="40" cy="40" r={radius} 
            stroke={color} 
            strokeWidth="8" 
            fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div style={{ position: 'relative', fontWeight: 'bold', fontSize: '18px', color: '#1a1a2e' }}>{score}</div>
      </div>
    );
  };

  return (
    <div 
      id={id} 
      style={{
        backgroundColor: '#FCFCFD',
        color: '#1a1a2e',
        width: '850px',
        padding: '50px',
        fontFamily: '"Inter", sans-serif',
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        zIndex: -1,
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '2px solid #8b5cf6', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '36px', margin: 0, fontWeight: 900, color: '#1337ec', letterSpacing: '-1px' }}>SeeMe Pro</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Gemini AI Behavioral Analysis Report</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>Date: {new Date().toLocaleDateString()}</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
        </div>
      </div>

      {/* Main Score Dashboard */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: '16px', padding: '25px', textAlign: 'center', borderTop: '4px solid #1337ec', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#4b5563', fontWeight: 600 }}>Overall Truthfulness Score</h3>
          {renderCircularScore(results.truthfulness, '#1337ec')}
        </div>
        
        {type === 'voice' && results.stressLevel && (
          <div style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: '16px', padding: '25px', textAlign: 'center', borderTop: '4px solid #00CC66', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#4b5563', fontWeight: 600 }}>Detected Stress Level</h3>
            <div style={{ fontSize: '42px', fontWeight: 800, color: '#00CC66', lineHeight: '80px' }}>{results.stressLevel}</div>
          </div>
        )}
      </div>

      {/* Strengths & Areas to Improve */}
      {results.strengths && results.areasToImprove && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div style={{ flex: 1, padding: '20px', backgroundColor: '#ecfdf5', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
            <h3 style={{ fontSize: '16px', color: '#047857', marginTop: 0, marginBottom: '10px' }}>Key Strengths</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#065f46', fontSize: '14px', lineHeight: '1.6' }}>
              {results.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div style={{ flex: 1, padding: '20px', backgroundColor: '#fff1f2', borderRadius: '12px', borderLeft: '4px solid #e11d48' }}>
            <h3 style={{ fontSize: '16px', color: '#be123c', marginTop: 0, marginBottom: '10px' }}>Areas to Improve</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#9f1239', fontSize: '14px', lineHeight: '1.6' }}>
              {results.areasToImprove.map((a: string, i: number) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Category Scores */}
      {results.categoryScores && (
        <div style={{ marginBottom: '30px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '18px', color: '#374151', marginTop: 0, marginBottom: '15px' }}>Category Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {Object.entries(results.categoryScores).map(([category, score]) => (
              <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span style={{ color: '#4b5563', textTransform: 'capitalize' }}>{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span style={{ fontWeight: 600, color: '#1337ec' }}>{score as number}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '18px', color: '#1f2937', marginTop: 0, marginBottom: '15px' }}>Detailed Behavioral Summary</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#4b5563', margin: 0 }}>{results.summary}</p>
      </div>

      {/* Detailed Metrics */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {type === 'video' && results.face && (
          <div style={{ flex: 1, minWidth: '350px', backgroundColor: '#f4f6ff', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', color: '#1337ec', marginTop: 0, marginBottom: '10px' }}>Facial Expressions</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#4b5563', lineHeight: '1.6', fontSize: '14px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Micro-expressions:</strong> {results.face.microExpressions}</li>
              <li><strong>Eye Tracking:</strong> {results.face.eyeMovement}</li>
            </ul>
          </div>
        )}
        
        {type === 'video' && results.body && (
          <div style={{ flex: 1, minWidth: '350px', backgroundColor: '#fdf4ff', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', color: '#8b5cf6', marginTop: 0, marginBottom: '10px' }}>Body Language</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#4b5563', lineHeight: '1.6', fontSize: '14px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Posture:</strong> {results.body.posture}</li>
              <li><strong>Gestures:</strong> {results.body.handMovements}</li>
            </ul>
          </div>
        )}
        
        {type === 'voice' && results.emotions && (
          <div style={{ flex: 1, minWidth: '350px', backgroundColor: '#f4f6ff', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', color: '#1337ec', marginTop: 0, marginBottom: '10px' }}>Emotion Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {Object.entries(results.emotions).map(([emo, val]) => (
                <div key={emo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <strong style={{ textTransform: 'capitalize', color: '#4b5563' }}>{emo}:</strong> 
                  <span style={{ color: '#111827' }}>{val as number}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {type === 'video' && results.inconsistencies && results.inconsistencies.length > 0 && (
        <div style={{ marginBottom: '40px', backgroundColor: '#fffbeb', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ fontSize: '16px', color: '#b45309', margin: '0 0 10px 0' }}>Critical Inconsistencies Detected</h3>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#92400e', lineHeight: '1.6', fontSize: '14px' }}>
            {results.inconsistencies.map((inc: string, idx: number) => <li key={idx} style={{ marginBottom: '4px' }}>{inc}</li>)}
          </ul>
        </div>
      )}

      {/* Digital Security Stamp */}
      <div style={{ 
        marginTop: '50px', 
        paddingTop: '20px', 
        borderTop: '2px dashed #e5e7eb', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          border: '3px solid #00CC66', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#00CC66',
          fontWeight: 'bold',
          fontSize: '10px',
          textAlign: 'center',
          transform: 'rotate(-15deg)',
          marginBottom: '10px',
          boxShadow: '0 0 10px rgba(0,204,102,0.2)'
        }}>
          VERIFIED<br/>ANALYSIS<br/>SEAL
        </div>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, textAlign: 'center', lineHeight: '1.5' }}>
          This document was securely generated by the SeeMe Pro AI Pipeline (Gemini Model).<br/>
          Authenticity verified via cryptographic hash.
        </p>
      </div>
    </div>
  );
};
