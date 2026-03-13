import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JournalEntry from './components/JournalEntry';
import EntryList from './components/EntryList';
import Insights from './components/Insights';
import AnalyzeButton from './components/AnalyzeButton';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

// Demo user ID (in real app, this would come from auth)
const USER_ID = '123';

function App() {
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('write'); // 'write', 'entries', 'insights'
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Fetch entries
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/journal/${USER_ID}`);
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch insights
  const fetchInsights = async () => {
    try {
      const response = await axios.get(`/journal/insights/${USER_ID}`);
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchInsights();
  }, []);

  // Handle new entry submission
  const handleSubmitEntry = async (entryData) => {
    try {
      await axios.post('/journal', {
        userId: USER_ID,
        ...entryData
      });
      await fetchEntries();
      await fetchInsights();
      setActiveTab('entries');
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Failed to create entry: ' + (error.response?.data?.error || error.message));
    }
  };

  // Handle analyze
  const handleAnalyze = async (entryId) => {
    try {
      const response = await axios.post(`/journal/${entryId}/analyze`);
      await fetchEntries();
      await fetchInsights();
      return response.data.analysis;
    } catch (error) {
      console.error('Error analyzing entry:', error);
      throw error;
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>🌿 AI Journal System</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>ArvyaX Nature Sessions Journal</p>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <button
          onClick={() => setActiveTab('write')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'write' ? '#4CAF50' : '#ddd',
            color: activeTab === 'write' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ✍️ Write Entry
        </button>
        <button
          onClick={() => setActiveTab('entries')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'entries' ? '#2196F3' : '#ddd',
            color: activeTab === 'entries' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          📖 View Entries ({entries.length})
        </button>
        <button
          onClick={() => { setActiveTab('insights'); fetchInsights(); }}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'insights' ? '#9C27B0' : '#ddd',
            color: activeTab === 'insights' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          💡 Insights
        </button>
      </div>

      {/* Content Area */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '10px', minHeight: '400px' }}>
        {activeTab === 'write' && (
          <JournalEntry onSubmit={handleSubmitEntry} />
        )}

        {activeTab === 'entries' && (
          <EntryList
            entries={entries}
            loading={loading}
            onAnalyze={handleAnalyze}
            selectedEntry={selectedEntry}
            onSelectEntry={setSelectedEntry}
          />
        )}

        {activeTab === 'insights' && (
          <Insights insights={insights} />
        )}
      </div>
    </div>
  );
}

export default App;
