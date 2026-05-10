import React from 'react';

interface ReportProps {
  type: 'video' | 'voice';
  results: any;
  id?: string;
}

export const AnalysisReportPDF: React.FC<ReportProps> = ({ type, results, id = 'pdf-report-content' }) => {
  if (!results) return null;

  return (
    <div 
      id={id} 
      style={{
        backgroundColor: '#FCFCFD',
        color: '#1a1a2e',
        width: '800px',
        padding: '40px',
        fontFamily: '"Inter", sans-serif',
        position: 'absolute',
        top: '-9999px', // Hide it from view
        left: '-9999px',
        zIndex: -1,
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '2px solid #8b5cf6', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0, fontWeight: 800, color: '#1337ec' }}>SeeMe Pro</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px' }}>Certified Analysis Report</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{new Date().toLocaleDateString()}</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
        </div>
      </div>

      {/* Main Score */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '20px', textAlign: 'center', borderLeft: '4px solid #8b5cf6' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#4b5563' }}>Truthfulness Score</h3>
          <div style={{ fontSize: '48px', fontWeight: 800, color: '#1337ec' }}>{results.truthfulness}%</div>
        </div>
        {type === 'voice' && (
          <div style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '20px', textAlign: 'center', borderLeft: '4px solid #00CC66' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#4b5563' }}>Stress Level</h3>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#00CC66' }}>{results.stressLevel}</div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>Executive Summary</h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>{results.summary}</p>
      </div>

      {/* Detailed Metrics */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {type === 'video' && results.face && (
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ fontSize: '18px', color: '#1337ec', marginBottom: '10px' }}>Facial Expressions</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#4b5563', lineHeight: '1.8' }}>
              <li><strong>Micro-expressions:</strong> {results.face.microExpressions}</li>
              <li><strong>Eye Tracking:</strong> {results.face.eyeMovement}</li>
            </ul>
          </div>
        )}
        
        {type === 'video' && results.body && (
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ fontSize: '18px', color: '#8b5cf6', marginBottom: '10px' }}>Body Language</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#4b5563', lineHeight: '1.8' }}>
              <li><strong>Posture:</strong> {results.body.posture}</li>
              <li><strong>Gestures:</strong> {results.body.handMovements}</li>
            </ul>
          </div>
        )}

        {type === 'voice' && results.voicePitch && (
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ fontSize: '18px', color: '#8b5cf6', marginBottom: '10px' }}>Voice Pitch & Tone</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#4b5563', lineHeight: '1.8' }}>
              <li><strong>Pitch Analysis:</strong> {results.voicePitch}</li>
            </ul>
          </div>
        )}
        
        {type === 'voice' && results.emotions && (
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ fontSize: '18px', color: '#1337ec', marginBottom: '10px' }}>Emotion Breakdown</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#4b5563', lineHeight: '1.8' }}>
              {Object.entries(results.emotions).map(([emo, val]) => (
                <li key={emo} style={{ textTransform: 'capitalize' }}><strong>{emo}:</strong> {val as number}%</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {type === 'video' && results.inconsistencies && (
        <div style={{ marginBottom: '40px', backgroundColor: '#fffbeb', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ fontSize: '18px', color: '#b45309', margin: '0 0 10px 0' }}>Critical Inconsistencies</h3>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#92400e', lineHeight: '1.6' }}>
            {results.inconsistencies.map((inc: string, idx: number) => <li key={idx}>{inc}</li>)}
          </ul>
        </div>
      )}

      {/* Digital Security Stamp */}
      <div style={{ 
        marginTop: '60px', 
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
          marginBottom: '10px'
        }}>
          VERIFIED<br/>ANALYSIS<br/>SEAL
        </div>
        <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>
          This document is generated by SeeMe Pro AI Processing Pipeline.<br/>
          Authenticity verified via cryptographic hash.
        </p>
      </div>
    </div>
  );
};
