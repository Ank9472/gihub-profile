import React from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Sparkles, Loader2 } from 'lucide-react';

const AnalyzeButton = ({ entryId, isAnalyzed, onAnalysisComplete }) => {
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/entries/${entryId}/analyze`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Entry analyzed successfully!');
      if (onAnalysisComplete && data.data?.insights) {
        onAnalysisComplete(data.data.insights);
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to analyze entry';
      toast.error(message);
    },
  });

  const handleAnalyze = () => {
    analyzeMutation.mutate();
  };

  return (
    <button
      onClick={handleAnalyze}
      disabled={analyzeMutation.isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
        isAnalyzed
          ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
          : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isAnalyzed ? 'Re-analyze entry' : 'Analyze with AI'}
    >
      {analyzeMutation.isPending ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Analyzing...</span>
        </>
      ) : (
        <>
          <Sparkles size={18} />
          <span>{isAnalyzed ? 'Re-analyze' : 'Analyze'}</span>
        </>
      )}
    </button>
  );
};

export default AnalyzeButton;
