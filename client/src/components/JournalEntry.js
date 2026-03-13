import React, { useState } from 'react';

const ambienceOptions = [
  { value: 'forest', label: '🌲 Forest', color: '#228B22' },
  { value: 'ocean', label: '🌊 Ocean', color: '#1E90FF' },
  { value: 'mountain', label: '⛰️ Mountain', color: '#8B4513' }
];

const JournalEntry = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const [ambience, setAmbience] = useState('forest');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      alert('Please write something in your journal entry');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ text: text.trim(), ambience });
      setText('');
      setAmbience('forest');
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>✍️ Write New Entry</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Ambience Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Session Ambience:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {ambienceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAmbience(option.value)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: ambience === option.value ? option.color : '#eee',
                  color: ambience === option.value ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Your Journal Entry:
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I felt calm today after listening to the rain..."
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '15px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '2px solid #ddd',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: '1.6'
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          style={{
            padding: '12px 30px',
            backgroundColor: isSubmitting ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isSubmitting ? 'Saving...' : '💾 Save Entry'}
        </button>
      </form>
    </div>
  );
};

export default JournalEntry;
