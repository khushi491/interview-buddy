'use client';

import { useState, useEffect, useCallback } from 'react';

interface VoiceAIState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}

export const useVoiceAI = () => {
  const [state, setState] = useState<VoiceAIState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    error: null,
  });

  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onstart = () => {
          setState(prev => ({ ...prev, isListening: true, error: null }));
        };

        recognitionInstance.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setState(prev => ({
            ...prev,
            transcript: prev.transcript + finalTranscript + interimTranscript,
          }));
        };

        recognitionInstance.onerror = (event) => {
          setState(prev => ({
            ...prev,
            isListening: false,
            error: `Speech recognition error: ${event.error}`,
          }));
        };

        recognitionInstance.onend = () => {
          setState(prev => ({ ...prev, isListening: false }));
        };

        setRecognition(recognitionInstance);
      } else {
        setState(prev => ({
          ...prev,
          error: 'Speech recognition not supported in this browser',
        }));
      }

      // Speech Synthesis
      if ('speechSynthesis' in window) {
        setSpeechSynthesis(window.speechSynthesis);
      } else {
        setState(prev => ({
          ...prev,
          error: 'Speech synthesis not supported in this browser',
        }));
      }
    }
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (recognition && !state.isListening) {
      setState(prev => ({ ...prev, transcript: '', error: null }));
      recognition.start();
    }
  }, [recognition, state.isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognition && state.isListening) {
      recognition.stop();
    }
  }, [recognition, state.isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Speak text
  const speak = useCallback((text: string) => {
    if (speechSynthesis && !state.isSpeaking) {
      // Stop any current speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setState(prev => ({ ...prev, isSpeaking: true }));
      };

      utterance.onend = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
      };

      utterance.onerror = (event) => {
        setState(prev => ({
          ...prev,
          isSpeaking: false,
          error: `Speech synthesis error: ${event.error}`,
        }));
      };

      speechSynthesis.speak(utterance);
    }
  }, [speechSynthesis, state.isSpeaking]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, [speechSynthesis]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '' }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    clearTranscript,
    clearError,
  };
}; 