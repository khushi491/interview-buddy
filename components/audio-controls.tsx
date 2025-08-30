"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

interface AudioControlsProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onTranscriptionComplete?: (text: string) => void;
  disabled?: boolean;
}

export function AudioControls({
  isRecording,
  onToggleRecording,
  onTranscriptionComplete,
  disabled = false,
}: AudioControlsProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const {
    isRecording: isActuallyRecording,
    isTranscribing,
    audioLevel,
    startRecording,
    stopRecording,
    resetRecording,
    error,
  } = useAudioRecorder(onTranscriptionComplete || (() => {}));

  // Sync the recording state
  useEffect(() => {
    if (isActuallyRecording !== isRecording) {
      if (isActuallyRecording && !isRecording) {
        // Stop recording
        handleStopRecording();
      } else if (!isActuallyRecording && isRecording) {
        // Start recording
        handleStartRecording();
      }
    }
  }, [isRecording, isActuallyRecording]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const handleStopRecording = async () => {
    try {
      const transcription = await stopRecording();
      if (transcription && onTranscriptionComplete) {
        onTranscriptionComplete(transcription);
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  const handleToggleRecording = async () => {
    if (isActuallyRecording) {
      await handleStopRecording();
    } else {
      await handleStartRecording();
    }
    onToggleRecording();
  };

  // Calculate visual audio level for display
  const visualAudioLevel = Math.min(100, (audioLevel / 255) * 100);

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50 mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className="bg-green-100 text-green-700"
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              {isActuallyRecording && (
                <Badge
                  variant="secondary"
                  className="bg-red-100 text-red-700 animate-pulse"
                >
                  Recording
                </Badge>
              )}
              {isTranscribing && (
                <Badge
                  variant="secondary"
                  className="bg-primary/20 text-primary animate-pulse"
                >
                  Transcribing...
                </Badge>
              )}
              {error && (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-700"
                >
                  Error
                </Badge>
              )}
            </div>

            {(isActuallyRecording || isTranscribing) && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full transition-all duration-100"
                      style={{
                        height: `${Math.max(4, (visualAudioLevel / 100) * 20 * (0.5 + Math.random() * 0.5))}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className={`${isMuted ? "bg-red-50 border-red-200" : "bg-white"}`}
              disabled={disabled}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleRecording}
              className={`${isActuallyRecording ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
              disabled={disabled || isTranscribing}
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isActuallyRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConnected(!isConnected)}
              className={`${!isConnected ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
              disabled={disabled}
            >
              {isConnected ? (
                <Phone className="w-4 h-4" />
              ) : (
                <PhoneOff className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      </div>
    </Card>
  );
}
