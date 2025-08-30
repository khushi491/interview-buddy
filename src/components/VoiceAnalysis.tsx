'use client';

import { useState } from 'react';
import { Brain, Mic, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface VoiceAnalysisProps {
  transcript: string;
  jobRole: string;
  experienceLevel: string;
}

interface AnalysisResult {
  clarity: string;
  confidence: string;
  suggestions: string[];
}

export default function VoiceAnalysis({ transcript, jobRole, experienceLevel }: VoiceAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSpeech = async () => {
    if (!transcript.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze_speech',
          text: transcript,
          jobRole,
          experienceLevel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        setError('Failed to analyze speech');
      }
    } catch (error) {
      setError('Error analyzing speech');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getClarityIcon = (clarity: string) => {
    switch (clarity.toLowerCase()) {
      case 'excellent':
      case 'very good':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'very high':
      case 'high':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'moderate':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  if (!transcript.trim()) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mic className="h-5 w-5 text-purple-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Voice Analysis
        </h3>
      </div>

      {/* Analysis Button */}
      <div className="mb-4">
        <button
          onClick={analyzeSpeech}
          disabled={isAnalyzing || !transcript.trim()}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Analyze Speech'}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Clarity and Confidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getClarityIcon(analysis.clarity)}
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Speech Clarity
                </span>
              </div>
              <p className="text-blue-900 dark:text-blue-100">
                {analysis.clarity}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getConfidenceIcon(analysis.confidence)}
                <span className="font-medium text-green-700 dark:text-green-300">
                  Confidence Level
                </span>
              </div>
              <p className="text-green-900 dark:text-green-100">
                {analysis.confidence}
              </p>
            </div>
          </div>

          {/* Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                Improvement Suggestions
              </h4>
              <ul className="space-y-1">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-yellow-800 dark:text-yellow-200 text-sm flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 text-sm">
            {error}
          </p>
        </div>
      )}

      {/* Transcript Preview */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
          Transcript Preview
        </h4>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {transcript}
        </p>
      </div>
    </div>
  );
} 