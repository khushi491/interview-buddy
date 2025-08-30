"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOpenAIRealtime } from "@/hooks/use-openai-realtime";

export const TestRealtime: React.FC = () => {
  const {
    isConnected,
    isTranscribing,
    transcript,
    audioLevel,
    error,
    connect,
    disconnect,
    clearTranscript,
  } = useOpenAIRealtime();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-black/20 backdrop-blur-sm border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              OpenAI Realtime API Test
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              Test the real-time audio transcription with OpenAI's Realtime API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isConnected
                    ? "bg-green-600/20 border border-green-500/50"
                    : "bg-red-600/20 border border-red-500/50"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                  }`}
                />
                <span className="text-sm font-medium">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {isTranscribing && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/50">
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">Connecting...</span>
                </div>
              )}
            </div>

            {/* Audio Level Indicator */}
            {isConnected && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-300">Audio Level:</span>
                <div className="flex items-center gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 rounded-full transition-all duration-100 ${
                        audioLevel > (i + 1) * 0.1
                          ? "bg-green-400"
                          : "bg-gray-600"
                      }`}
                      style={{
                        height: `${Math.max(4, audioLevel * 30 * (0.5 + Math.random() * 0.5))}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={isConnected ? disconnect : connect}
                disabled={isTranscribing}
                className={`${
                  isConnected
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
              >
                {isConnected
                  ? "Disconnect"
                  : isTranscribing
                    ? "Connecting..."
                    : "Connect"}
              </Button>

              <Button
                onClick={clearTranscript}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Clear Transcript
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4">
                <h3 className="text-red-400 font-medium mb-2">Error:</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Transcript Display */}
            <div className="bg-black/40 rounded-lg p-4 min-h-[200px]">
              <h3 className="text-white font-medium mb-3">Live Transcript:</h3>
              <div className="text-gray-300 text-sm leading-relaxed">
                {transcript || (
                  <span className="text-gray-500 italic">
                    {isConnected
                      ? "Start speaking to see real-time transcription..."
                      : "Connect to start transcribing audio"}
                  </span>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-primary/20 border border-primary/50 rounded-lg p-4">
              <h3 className="text-primary font-medium mb-2">Instructions:</h3>
              <ul className="text-primary text-sm space-y-1">
                <li>• Click "Connect" to establish WebRTC connection</li>
                <li>• Grant microphone permissions when prompted</li>
                <li>• Speak naturally - transcription appears in real-time</li>
                <li>• Click "Disconnect" to end the session</li>
                <li>• Use "Clear Transcript" to reset the display</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
