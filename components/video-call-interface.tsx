"use client";
import { useState, useEffect, useRef } from "react";
import { UIMessage } from "ai";

// Helper function to extract text content from UIMessage
const getMessageText = (message: UIMessage): string => {
    const textPart = message.parts.find(part => part.type === 'text');
    return textPart ? (textPart as any).text : '';
};

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";

import {
  Mic,
  MicOff,
  Phone,
  Settings,
  MoreHorizontal,
  MessageSquare,
  Video,
  VideoOff,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
} from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useWebcam } from "@/hooks/use-webcam";

interface VideoCallInterfaceProps {
  messages: any[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  currentStep: number;
  disabled?: boolean;
  onEndCall?: () => void;
  duration?: number;
  isInterviewComplete?: boolean;
  interviewType: "video" | "audio";
}

export function VideoCallInterface({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  currentStep,
  disabled = false,
  onEndCall,
  duration = 0,
  isInterviewComplete = false,
  interviewType,
}: VideoCallInterfaceProps) {
  const [showControls, setShowControls] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(
    interviewType === "video"
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const {
    isConnected,
    isTranscribing,
    isSpeaking,
    transcript,
    audioLevel,
    error: realtimeError,
    connect,
    disconnect,
    clearTranscript,
    sendMessage,
  } = useOpenAIRealtime();

  const { videoRef, error: webcamError } = useWebcam(
    isVideoEnabled && interviewType === "video"
  );

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stepTitles = [
    "Opening & Introduction",
    "Background & Experience",
    "Technical Skills",
    "Problem Solving",
    "Closing Questions",
  ];

  useEffect(() => {
    if (hasStarted && isConnected) {
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }

      durationIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          const elapsed = Math.floor(
            (Date.now() - callStartTimeRef.current) / 1000
          );
          setCallDuration(elapsed);
        }
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [hasStarted, isConnected]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleStartCall = async () => {
    try {
      setHasStarted(true);
      await connect(interviewContext);
    } catch (err) {
      console.error("Failed to start call:", err);
      setHasStarted(false);
    }
  };

  const handleEndCall = async () => {
    try {
      disconnect();
      setHasStarted(false);
      setCallDuration(0);
      callStartTimeRef.current = null;

      if (onEndCall) {
        onEndCall();
      }
    } catch (err) {
      console.error("Failed to end call:", err);
    }
  };

  const handleSendMessage = (message: string) => {
    if (isConnected && message.trim()) {
      sendMessage(message.trim());
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAudioLevelBars = () => {
    const bars = [];
    const level = Math.min(100, (audioLevel / 255) * 100);
    for (let i = 0; i < 5; i++) {
      const height = Math.max(
        4,
        (level / 100) * 20 * (0.3 + Math.random() * 0.7)
      );
      bars.push(
        <div
          key={i}
          className="w-1 bg-green-500 rounded-full transition-all duration-100"
          style={{ height: `${height}px` }}
        />
      );
    }
    return bars;
  };

  const getConnectionStatus = () => {
    if (realtimeError) return { text: "Error", color: "bg-red-500" };
    if (!hasStarted) return { text: "Ready", color: "bg-muted" };
    if (!isConnected) return { text: "Connecting...", color: "bg-yellow-500" };
    return { text: "Connected", color: "bg-green-500" };
  };

  const connectionStatus = getConnectionStatus();

  if (!isVideoEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-40 h-40 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
          <User className="w-20 h-20 text-primary-foreground" />
        </div>
        <p className="text-primary-foreground/80 mb-2">Your camera is off</p>
        <Button
          onClick={() => setIsVideoEnabled(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Enable Camera
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Main Video Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Video Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isVideoEnabled && videoRef ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-40 h-40 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
                <User className="w-20 h-20 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">Your camera is off</p>
              <Button
                onClick={() => setIsVideoEnabled(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Enable Camera
              </Button>
            </div>
          )}
        </div>

        {/* Overlay Controls */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  getConnectionStatus().color === "bg-green-500"
                    ? "default"
                    : "secondary"
                }
                className="bg-background/80 backdrop-blur-sm"
              >
                {getConnectionStatus().text}
              </Badge>
              <div className="text-sm text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
                {formatDuration(callDuration)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Center Status */}
          {isTranscribing && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Transcribing...
                </div>
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className="hover:bg-background/50"
              >
                {isVideoEnabled ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleMicClick}
                className={`hover:bg-background/50 ${isRecording ? "text-red-500" : ""}`}
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartCall}
                disabled={hasStarted || disabled}
                className="hover:bg-background/50"
              >
                <Phone className="w-5 h-5" />
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndCall}
                className="hover:bg-destructive/90"
              >
                End Call
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="h-64 border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 ${
                    message.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="w-6 h-6 bg-primary text-primary-foreground">
                      <AvatarFallback className="text-xs">AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] p-2 rounded-lg text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {getMessageText(message)}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="w-6 h-6 bg-secondary text-secondary-foreground">
                      <AvatarFallback className="text-xs">U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !input.trim()}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Panel */}
      {showTranscript && (
        <div className="h-48 border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Live Transcript</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-sm text-muted-foreground leading-relaxed">
                {transcript || "Waiting for speech..."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
