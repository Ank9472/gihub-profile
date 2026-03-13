import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, PieChartIcon, Tag, Lightbulb, Calendar } from 'lucide-react';

const moodScores = {
  very_negative: 1,
  negative: 2,
  neutral: 3,
  positive: 4,
  very_positive: 5,
};

const moodColors = {
  very_negative: '#ef4444',
  negative: '#f97316',
  neutral: '#eab308',
  positive: '#84cc16',
  very_positive: '#22c55e',
};

const CHART_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

const Insights = ({ entries }) => {
  // Fetch writing prompts
  const { data: promptsData } = useQuery({
    queryKey: ['writingPrompts'],
    queryFn: async () => {
      const response = await axios.get('/insights/prompts');
      return response.data;
    },
  });

  // Fetch weekly summary
  const { data: weeklySummary } = useQuery({
    queryKey: ['weeklySummary'],
    queryFn: async () => {
      const response = await axios.get('/insights/weekly');
      return response.data;
    },
  });

  // Calculate mood distribution
  const moodDistribution = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const moodChartData = Object.entries(moodDistribution).map(([mood, count]) => ({
    name: mood.replace('_', ' '),
    value: count,
    color: moodColors[mood],
  }));

  // Calculate mood trend over time
  const moodTrendData = entries
    .slice()
    .reverse()
    .slice(-30)
    .map((entry) => ({
      date: format(new Date(entry.createdAt), 'MMM d'),
      mood: moodScores[entry.mood] || 3,
      fullDate: format(new Date(entry.createdAt), 'MMMM d, yyyy'),
    }));

  // Get theme statistics from analyzed entries
  const themeStats = {};
  entries.forEach((entry) => {
    if (entry.insights?.themes) {
      entry.insights.themes.forEach((t) => {
        themeStats[t.theme] = (themeStats[t.theme] || 0) + 1;
      });
    }
  });

  const themeChartData = Object.entries(themeStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([theme, count]) => ({
      theme,
      count,
    }));

  // Calculate statistics
  const totalEntries = entries.length;
  const analyzedEntries = entries.filter((e) => e.isAnalyzed).length;
  const avgWordsPerEntry = totalEntries > 0
    ? Math.round(
        entries.reduce((sum, e) => sum + (e.wordCount || 0), 0) / totalEntries
      )
    : 0;

  const prompts = promptsData?.data?.prompts || [];
  const summary = weeklySummary?.data;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <TrendingUp className="text-purple-400" />
        Your Journal Insights
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Entries</p>
          <p className="text-3xl font-bold text-purple-400">{totalEntries}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">AI Analyzed</p>
          <p className="text-3xl font-bold text-green-400">{analyzedEntries}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Avg. Words</p>
          <p className="text-3xl font-bold text-blue-400">{avgWordsPerEntry}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Unique Themes</p>
          <p className="text-3xl font-bold text-pink-400">
            {Object.keys(themeStats).length}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Trend Chart */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-400" />
            Mood Trend (Last 30 Entries)
          </h3>
          {moodTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={moodTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value, payload) =>
                    payload[0]?.payload?.fullDate || value
                  }
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ fill: '#a855f7', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No entries yet to show mood trends
            </p>
          )}
        </div>

        {/* Mood Distribution Pie */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-purple-400" />
            Mood Distribution
          </h3>
          {moodChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={moodChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {moodChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No mood data available
            </p>
          )}
        </div>
      </div>

      {/* Themes Chart */}
      {themeChartData.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tag size={18} className="text-purple-400" />
            Top Themes in Your Journal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={themeChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis
                type="category"
                dataKey="theme"
                stroke="#9ca3af"
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly Summary */}
      {summary && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-purple-400" />
            Weekly Summary
          </h3>
          <div className="space-y-4">
            {summary.emotionalJourney && (
              <div>
                <h4 className="text-sm font-medium text-gray-400">
                  Emotional Journey
                </h4>
                <p className="text-gray-200">{summary.emotionalJourney}</p>
              </div>
            )}
            {summary.weeklyThemes && summary.weeklyThemes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400">
                  This Week's Themes
                </h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {summary.weeklyThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-purple-600/30 rounded-full text-purple-300"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {summary.affirmation && (
              <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30">
                <p className="text-lg italic text-center">{summary.affirmation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Writing Prompts */}
      {prompts.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-yellow-400" />
            Writing Prompts for You
          </h3>
          <div className="space-y-3">
            {prompts.map((prompt, index) => (
              <div
                key={index}
                className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition cursor-pointer"
              >
                <p className="text-gray-200">{prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Insights;
