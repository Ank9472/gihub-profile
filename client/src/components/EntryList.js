import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ambienceEmoji = {
  forest: '🌲',
  ocean: '🌊',
  mountain: '⛰️'
};

const EntryList = ({ entries, onRefresh }) => {
  const [analyzing, setAnalyzing] = useState({});

  const analyzeEntry = async (entryId) => {
    setAnalyzing(prev => ({ ...prev, [entryId]: true }));
    try {
      const response = await fetch(`${API_URL}/journal/${entryId}/analyze`, {
        method: 'POST'
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error analyzing entry:', error);
    } finally {
      setAnalyzing(prev => ({ ...prev, [entryId]: false }));
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    card: {
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #334155'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    ambience: {
      fontSize: '14px',
      color: '#94a3b8',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    date: {
      fontSize: '12px',
      color: '#64748b'
    },
    text: {
      color: '#e2e8f0',
      lineHeight: '1.6',
      marginBottom: '12px'
    },
    analysis: {
      backgroundColor: '#0f172a',
      borderRadius: '8px',
      padding: '12px',
      marginTop: '12px'
    },
    analysisTitle: {
      fontSize: '12px',
      color: '#8b5cf6',
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    emotion: {
      fontSize: '14px',
      color: '#fbbf24',
      marginBottom: '4px'
    },
    keywords: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      marginBottom: '8px'
    },
    keyword: {
      backgroundColor: '#334155',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#67e8f9'
    },
    summary: {
      fontSize: '13px',
      color: '#94a3b8',
      fontStyle: 'italic'
    },
    button: {
      backgroundColor: '#8b5cf6',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px'
    },
    buttonDisabled: {
      backgroundColor: '#4c1d95',
      cursor: 'not-allowed'
    },
    empty: {
      textAlign: 'center',
      color: '#64748b',
      padding: '40px'
    }
  };

  if (entries.length === 0) {
    return <div style={styles.empty}>No entries yet. Start writing!</div>;
  }

  return (
    <div style={styles.container}>
      {entries.map(entry => (
        <div key={entry._id} style={styles.card}>
          <div style={styles.header}>
            <span style={styles.ambience}>
              {ambienceEmoji[entry.ambience] || '📝'} {entry.ambience}
            </span>
            <span style={styles.date}>
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <p style={styles.text}>{entry.text}</p>
          
          {entry.isAnalyzed && entry.analysis ? (
            <div style={styles.analysis}>
              <div style={styles.analysisTitle}>AI Analysis</div>
              <div style={styles.emotion}>Emotion: {entry.analysis.emotion}</div>
              <div style={styles.keywords}>
                {entry.analysis.keywords?.map((kw, i) => (
                  <span key={i} style={styles.keyword}>{kw}</span>
                ))}
              </div>
              <div style={styles.summary}>{entry.analysis.summary}</div>
            </div>
          ) : (
            <button 
              style={{
                ...styles.button,
                ...(analyzing[entry._id] ? styles.buttonDisabled : {})
              }}
              onClick={() => analyzeEntry(entry._id)}
              disabled={analyzing[entry._id]}
            >
              {analyzing[entry._id] ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default EntryList;
