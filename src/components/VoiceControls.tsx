'use client';

import React, { useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useVoiceAI } from '@/hooks/useVoiceAI';

interface VoiceControlsProps {
  onTranscriptChange: (transcript: string) => void;
  currentTranscript: string;
  questionText?: string;
}

export default function VoiceControls({ 
  onTranscriptChange, 
  currentTranscript, 
  questionText 
}: VoiceControlsProps) {
  const {
    isListening,
    isSpeaking,
    transcript,
    error,
    toggleListening,
    speak,
    stopSpeaking,
    clearTranscript,
    clearError,
  } = useVoiceAI();

  // Update parent component when transcript changes
  useEffect(() => {
    if (transcript) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);

  const handleSpeakQuestion = () => {
    if (questionText) {
      speak(questionText);
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
  };

  const handleClearTranscript = () => {
    clearTranscript();
    onTranscriptChange('');
  };

  return (
    <div className="space-y-4">
      {/* Voice Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Speech Recognition Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            disabled={!window.SpeechRecognition && !(window as any).webkitSpeechRecognition}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isListening
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? 'Stop Recording' : 'Start Recording'}
          </button>
          
          {currentTranscript && (
            <button
              onClick={handleClearTranscript}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Text-to-Speech Controls */}
        {questionText && (
          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <button
                onClick={handleStopSpeaking}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                <VolumeX className="h-4 w-4" />
                Stop Speaking
              </button>
            ) : (
              <button
                onClick={handleSpeakQuestion}
                disabled={!('speechSynthesis' in window)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Volume2 className="h-4 w-4" />
                Speak Question
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live Transcript Display */}
      {isListening && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Listening...
            </span>
          </div>
          <p className="text-blue-900 dark:text-blue-100">
            {transcript || 'Start speaking...'}
          </p>
        </div>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Speaking question...
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <p className="text-red-700 dark:text-red-300 text-sm">
              {error}
            </p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Browser Support Warning */}
      {(!window.SpeechRecognition && !(window as any).webkitSpeechRecognition) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            ⚠️ Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
          </p>
        </div>
      )}

      {!('speechSynthesis' in window) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            ⚠️ Text-to-speech is not supported in this browser.
          </p>
        </div>
      )}
    </div>
  );
} 