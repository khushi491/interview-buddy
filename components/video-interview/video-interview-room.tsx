"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { BaseInterviewRoom } from "../interview/base-interview-room";
import { InterviewConfig } from "@/lib/interview-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Loader2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Users,
  Users2,
  Share,
  Circle,
  Grid3X3,
  Smile,
  Maximize2,
  Minimize2,
  X,
  Menu,
  RefreshCw,
} from "lucide-react";
import { useOpenAIRealtimeSDK } from "@/hooks/use-openai-realtime-sdk";
import { useWebcam } from "@/hooks/use-webcam";
import { useIsMobile } from "@/hooks/use-mobile";

interface VideoInterviewRoomProps {
  config: InterviewConfig;
  cvText?: string;
}

export const VideoInterviewRoom: React.FC<VideoInterviewRoomProps> = ({
  config,
  cvText,
}) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(10 * 60); // 10 minutes in seconds
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnalysisButton, setShowAnalysisButton] = useState(false);

  const isMobile = useIsMobile();

  // OpenAI Realtime API hook with SDK
  const {
    isConnected,
    isTranscribing,
    isSpeaking,
    transcript,
    liveTranscript,
    audioLevel,
    error: realtimeError,
    connect,
    disconnect,
    clearTranscript,
    sendMessage,
    pauseAudio,
    resumeAudio,
  } = useOpenAIRealtimeSDK();

  // Webcam hook for video mode
  const {
    videoRef,
    error: webcamError,
    isLoading: webcamLoading,
    refreshWebcam,
  } = useWebcam(isVideoEnabled && interviewStarted);

  // Track when video element is mounted
  const [videoElementMounted, setVideoElementMounted] = useState(false);

  // Ensure video element is mounted before webcam hook runs
  useEffect(() => {
    if (videoRef.current) {
      setVideoElementMounted(true);
      console.log("Video element mounted successfully");
    } else {
      setVideoElementMounted(false);
    }
  }, [videoRef.current]);

  // Debug webcam state
  useEffect(() => {
    console.log("Webcam state:", {
      isVideoEnabled,
      interviewStarted,
      webcamEnabled: isVideoEnabled && interviewStarted,
      webcamLoading,
      webcamError,
      hasVideoRef: !!videoRef.current,
      videoElementMounted,
    });
  }, [
    isVideoEnabled,
    interviewStarted,
    webcamLoading,
    webcamError,
    videoElementMounted,
  ]);

  // Force webcam refresh when video is enabled
  useEffect(() => {
    if (isVideoEnabled && interviewStarted && !webcamLoading && !webcamError) {
      console.log("Video enabled, refreshing webcam...");
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        refreshWebcam();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    isVideoEnabled,
    interviewStarted,
    webcamLoading,
    webcamError,
    refreshWebcam,
  ]);

  // Ensure webcam runs after video element is mounted
  useEffect(() => {
    if (
      isVideoEnabled &&
      interviewStarted &&
      videoElementMounted &&
      !webcamLoading &&
      !webcamError
    ) {
      console.log("Video element mounted and ready, initializing webcam...");
      // Delay to ensure everything is ready
      const timer = setTimeout(() => {
        refreshWebcam();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    isVideoEnabled,
    interviewStarted,
    videoElementMounted,
    webcamLoading,
    webcamError,
    refreshWebcam,
  ]);

  // Transcript auto-scroll ref
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom when new content is added
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, liveTranscript]);

  // Save transcript periodically during interview
  useEffect(() => {
    if (
      interviewId &&
      transcript &&
      transcript.trim() !== "" &&
      interviewStarted &&
      !interviewCompleted
    ) {
      const saveTranscript = async () => {
        try {
          const response = await fetch(`/api/interviews/${interviewId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: transcript,
              duration: duration,
              updatedAt: new Date().toISOString(),
            }),
          });

          if (!response.ok) {
            console.error(
              "Failed to save transcript during interview:",
              await response.text()
            );
          } else {
            console.log("Transcript saved during interview");
          }
        } catch (error) {
          console.error("Error saving transcript during interview:", error);
        }
      };

      // Save transcript every 30 seconds during interview
      const interval = setInterval(saveTranscript, 30000);
      return () => clearInterval(interval);
    }
  }, [interviewId, transcript, duration, interviewStarted, interviewCompleted]);

  // Initialize interview context
  const interviewContext = {
    position: config.position,
    interviewType: config.type,
    candidateName: config.candidateName || "Candidate",
    cvText: cvText || "No CV provided",
    jobDescription: config.jobDescription || "No job description provided",
    difficulty: config.difficulty || "medium",
    flow: config.flow || {
      sections: [
        {
          title: "Introduction",
          questions: [
            "Tell me about yourself",
            "Why are you interested in this position?",
          ],
        },
        {
          title: "Technical Discussion",
          questions: [
            "What's your experience with relevant technologies?",
            "How do you approach problem-solving?",
          ],
        },
        {
          title: "Closing",
          questions: [
            "Do you have any questions for me?",
            "What are your next steps?",
          ],
        },
      ],
    },
    mode: "realtime_speech",
  };

  // Start the interview
  const handleStartInterview = useCallback(async () => {
    try {
      console.log("Starting interview with context:", interviewContext);
      // reset any prior completion state to allow restart
      setInterviewCompleted(false);
      setIsAnalyzing(false);
      setInterviewStarted(true);
      setStartTime(new Date());

      // Create interview record in database
      console.log("Creating interview with payload:", {
        type: "VIDEO",
        position: config.position,
        interviewType: config.type,
        flow: config.flow,
        cvText: cvText,
        mode: "video",
      });

      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "VIDEO",
          position: config.position,
          interviewType: config.type,
          flow: config.flow,
          cvText: cvText,
          mode: "video",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Interview created successfully:", data);
        if (data.interview && data.interview.id) {
          setInterviewId(data.interview.id);
          // Also store in session storage as backup
          sessionStorage.setItem("currentInterviewId", data.interview.id);
          console.log("Interview ID set to:", data.interview.id);
        } else {
          console.error("Invalid response structure:", data);
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to create interview:", errorText);
        console.error("Response status:", response.status);
        console.error("Response headers:", response.headers);
      }

      await connect(interviewContext);
      console.log("Interview started successfully");
    } catch (error) {
      console.error("Failed to start interview:", error);
      setInterviewStarted(false);
    }
  }, [connect, interviewContext, config, cvText]);

  // Handle page unload/abandonment
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (interviewStarted && !interviewCompleted) {
        e.preventDefault();
        e.returnValue =
          "Are you sure you want to leave? Your interview progress will be lost.";
        return "Are you sure you want to leave? Your interview progress will be lost.";
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        interviewStarted &&
        !interviewCompleted
      ) {
        // Mark interview as abandoned when user leaves the page
        if (interviewId) {
          fetch(`/api/interviews/${interviewId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "abandoned",
              updatedAt: new Date().toISOString(),
            }),
          }).catch(console.error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [interviewStarted, interviewCompleted, interviewId]);

  // Generate analysis mid-interview
  const handleGenerateAnalysis = useCallback(async () => {
    if (
      !interviewId ||
      !transcript ||
      transcript.trim() === "" ||
      isAnalyzing
    ) {
      return;
    }

    try {
      setIsAnalyzing(true);
      console.log("Generating mid-interview analysis...");

      const response = await fetch("/api/interviews/video-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          transcript,
          duration,
          position: config.position,
          cvText,
          jobDescription: config.jobDescription,
          mode: "video",
          forceComplete: false, // Don't complete interview for mid-analysis
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Mid-interview analysis generated:", result);
        // Show analysis button or redirect to analysis view
        setShowAnalysisButton(true);
      } else {
        console.error(
          "Failed to generate mid-interview analysis:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error generating mid-interview analysis:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [interviewId, transcript, duration, config, cvText, isAnalyzing]);

  // End the interview
  const handleEndInterview = useCallback(async () => {
    try {
      setIsAnalyzing(true);

      // Save analytics to database
      if (interviewId && transcript && transcript.trim() !== "") {
        console.log("Saving analytics with transcript:", transcript);

        // First, save the transcript to the interview record
        const transcriptResponse = await fetch(
          `/api/interviews/${interviewId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: transcript,
              duration: duration,
              status: "completed",
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          }
        );

        if (!transcriptResponse.ok) {
          console.error(
            "Failed to save transcript:",
            await transcriptResponse.text()
          );
        } else {
          console.log("Transcript saved successfully");
        }

        // Then generate and save analysis
        const response = await fetch("/api/interviews/video-analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interviewId,
            transcript,
            duration,
            position: config.position,
            cvText,
            jobDescription: config.jobDescription,
            mode: "video",
            forceComplete: true, // Force completion when user manually ends
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Analytics saved successfully:", result);
        } else {
          console.error("Failed to save analytics:", await response.text());
        }
      } else {
        if (!interviewId) {
          console.warn("Cannot save analytics - missing interviewId");
        } else if (!transcript || transcript.trim() === "") {
          console.warn(
            "Cannot save analytics - transcript is empty or missing"
          );
        } else {
          console.warn("Cannot save analytics - unknown issue:", {
            interviewId,
            transcript,
          });
        }
      }

      disconnect();
      setInterviewStarted(false);
      setInterviewCompleted(true);
      setStartTime(null);
      setDuration(0);
      setTimeRemaining(10 * 60);
      setCurrentQuestion("");
      clearTranscript();
      // Keep the interviewId for analytics navigation
      console.log(
        "Interview ended and analytics saved. Interview ID:",
        interviewId
      );
    } catch (error) {
      console.error("Error ending interview:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    disconnect,
    clearTranscript,
    interviewId,
    transcript,
    duration,
    config,
    cvText,
  ]);

  // Toggle audio
  const handleToggleAudio = useCallback(() => {
    if (isAudioEnabled) {
      pauseAudio();
    } else {
      resumeAudio();
    }
    setIsAudioEnabled(!isAudioEnabled);
  }, [isAudioEnabled, pauseAudio, resumeAudio]);

  // Toggle video
  const handleToggleVideo = useCallback(() => {
    const newVideoState = !isVideoEnabled;
    setIsVideoEnabled(newVideoState);

    if (newVideoState && interviewStarted) {
      console.log("Video enabled, refreshing webcam...");
      // Small delay to ensure state is updated
      setTimeout(() => {
        refreshWebcam();
      }, 200);
    }
  }, [isVideoEnabled, interviewStarted, refreshWebcam]);

  // Update duration timer and check time limit
  useEffect(() => {
    if (!startTime) return;

    const timer = setInterval(() => {
      const currentDuration = Math.floor(
        (Date.now() - startTime.getTime()) / 1000
      );
      setDuration(currentDuration);
      setTimeRemaining(Math.max(0, 10 * 60 - currentDuration));

      // Auto-end interview if time limit reached
      if (currentDuration >= 10 * 60) {
        handleEndInterview();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, handleEndInterview]);

  // Periodically save analytics during interview
  useEffect(() => {
    if (
      !interviewStarted ||
      !interviewId ||
      !transcript ||
      transcript.trim() === ""
    )
      return;

    const saveInterval = setInterval(async () => {
      try {
        await fetch("/api/interviews/video-analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interviewId,
            transcript,
            duration,
            position: config.position,
            cvText,
            jobDescription: config.jobDescription,
            mode: "video",
            forceComplete: false, // Don't force completion during periodic saves
          }),
        });
      } catch (error) {
        console.error("Error saving analytics:", error);
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [interviewStarted, interviewId, transcript, duration, config, cvText]);

  // Audio level visualization
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

  // Render video content
  const renderVideoContent = () => {
    if (!isVideoEnabled) {
      return (
        <div className="w-40 h-40 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
          <User className="w-20 h-20 text-white" />
        </div>
      );
    }

    if (webcamError) {
      return (
        <div className="bg-black rounded-lg flex flex-col items-center justify-center text-center p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Webcam Error
          </h3>
          <p className="text-red-300 text-sm">{webcamError}</p>
        </div>
      );
    }

    return (
      <div className="bg-black rounded-lg overflow-hidden w-full aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <BaseInterviewRoom config={config} cvText={cvText}>
        {({
          interviewState,
          stateManager,
          messagesEndRef,
          controls,
          metrics,
          messages,
        }) => (
          <div className="fixed inset-0 w-full h-full bg-black z-50 flex flex-col">
            {/* Mobile Header */}
            <div className="bg-gray-900 h-12 flex items-center justify-between px-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="text-white p-1"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="text-white text-sm font-medium truncate">
                  {config.position} Interview
                </div>
              </div>
              <div className="flex items-center gap-2">
                {interviewStarted && (
                  <div className="flex items-center gap-1 text-white text-xs">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">
                      {Math.floor(duration / 60)}:
                      {(duration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-white p-1"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {!interviewStarted && !interviewCompleted ? (
                // Pre-interview mobile view
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-4">
                    Ready to Start Your Interview
                  </h2>
                  <p className="text-gray-300 mb-8 text-sm">
                    Click the button below to begin your {config.type} interview
                    for {config.position}.
                  </p>
                  <Button
                    onClick={handleStartInterview}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full"
                    disabled={!!realtimeError}
                  >
                    {realtimeError ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Connection Error
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Start Interview
                      </>
                    )}
                  </Button>
                </div>
              ) : !isConnected && interviewStarted && !interviewCompleted ? (
                // Connecting mobile view
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
                    <div className="relative z-10 w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-4">
                    Connecting to Interview...
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="flex space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-gray-300 text-sm">
                      Waiting for AI interviewer
                    </span>
                  </div>
                </div>
              ) : !interviewCompleted ? (
                // Active interview mobile view
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Main Video Area */}
                  <div className="flex-1 relative">
                    {/* AI Interviewer Video (Main) */}
                    <div className="absolute inset-0 bg-gray-800">
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">
                            AI Interviewer
                          </h3>
                          <p className="text-sm text-white/80">
                            Conducting Interview
                          </p>
                        </div>
                      </div>
                      {isSpeaking && (
                        <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs">
                          Speaking
                        </div>
                      )}
                    </div>

                    {/* User Video (Picture-in-Picture) */}
                    <div className="absolute top-4 right-4 w-20 h-16 bg-gray-700 rounded-lg overflow-hidden border-2 border-yellow-400">
                      {isVideoEnabled ? (
                        <>
                          {webcamLoading ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                            </div>
                          ) : webcamError ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <div className="text-center">
                                <AlertCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                                <span className="text-xs text-red-400">
                                  Webcam Error
                                </span>
                              </div>
                            </div>
                          ) : (
                            <video
                              ref={videoRef}
                              autoPlay
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      {!isAudioEnabled && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <MicOff className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Connection Status */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                        Connected
                      </span>
                    </div>
                  </div>

                  {/* Mobile Controls */}
                  <div className="bg-gray-900 p-4 border-t border-gray-700">
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        onClick={handleToggleAudio}
                        variant="ghost"
                        size="sm"
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isAudioEnabled
                            ? "text-white bg-gray-700 hover:bg-gray-600"
                            : "text-red-400 bg-red-500/20 hover:bg-red-500/30"
                        }`}
                      >
                        {isAudioEnabled ? (
                          <Mic className="w-5 h-5" />
                        ) : (
                          <MicOff className="w-5 h-5" />
                        )}
                      </Button>

                      <Button
                        onClick={handleToggleVideo}
                        variant="ghost"
                        size="sm"
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isVideoEnabled
                            ? "text-white bg-gray-700 hover:bg-gray-600"
                            : "text-red-400 bg-red-500/20 hover:bg-red-500/30"
                        }`}
                      >
                        {isVideoEnabled ? (
                          <Video className="w-5 h-5" />
                        ) : (
                          <VideoOff className="w-5 h-5" />
                        )}
                      </Button>

                      {/* Refresh Webcam Button - Show when video is enabled but loading or has error */}
                      {isVideoEnabled && (webcamLoading || webcamError) && (
                        <Button
                          onClick={refreshWebcam}
                          variant="ghost"
                          size="sm"
                          className="w-12 h-12 rounded-full flex items-center justify-center text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                          title="Refresh webcam"
                        >
                          <Loader2
                            className={`w-5 h-5 ${webcamLoading ? "animate-spin" : ""}`}
                          />
                        </Button>
                      )}

                      {/* Manual Refresh Button - Always show when video is enabled */}
                      {isVideoEnabled && interviewStarted && (
                        <Button
                          onClick={refreshWebcam}
                          variant="ghost"
                          size="sm"
                          className="w-12 h-12 rounded-full flex items-center justify-center text-green-400 bg-green-500/20 hover:bg-green-500/30"
                          title="Manual refresh webcam"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </Button>
                      )}

                      <Button
                        onClick={() => setShowTranscript(!showTranscript)}
                        variant="ghost"
                        size="sm"
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </Button>

                      {interviewCompleted ? (
                        <Button
                          onClick={() => {
                            const currentInterviewId =
                              interviewId ||
                              sessionStorage.getItem("currentInterviewId");
                            if (currentInterviewId) {
                              window.location.href = `/interview-report/${currentInterviewId}`;
                            } else {
                              window.location.href = `/interview/history`;
                            }
                          }}
                          className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <BarChart3 className="w-5 h-5" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleEndInterview}
                          variant="destructive"
                          size="sm"
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <PhoneOff className="w-5 h-5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Transcript Panel */}
                  {showTranscript && (
                    <div className="bg-gray-900 border-t border-gray-700 h-64 flex flex-col">
                      <div className="p-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
                        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Live Transcript
                        </h3>
                        <button
                          onClick={() => setShowTranscript(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 min-h-0">
                        {/* Debug Info - Show on mobile for troubleshooting */}
                        <div className="mb-3 p-2 bg-gray-800 rounded text-xs text-gray-300">
                          <div>Video: {isVideoEnabled ? "ON" : "OFF"}</div>
                          <div>
                            Interview:{" "}
                            {interviewStarted ? "Started" : "Not Started"}
                          </div>
                          <div>
                            Webcam:{" "}
                            {webcamLoading
                              ? "Loading..."
                              : webcamError
                                ? "Error"
                                : "Ready"}
                          </div>
                          <div>
                            Has Video: {videoRef.current ? "Yes" : "No"}
                          </div>
                          <div>
                            Video Mounted: {videoElementMounted ? "Yes" : "No"}
                          </div>
                        </div>

                        {transcript || liveTranscript ? (
                          <div className="space-y-3">
                            {transcript && (
                              <div className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                                {transcript}
                              </div>
                            )}
                            {liveTranscript && (
                              <div className="text-sm text-blue-300 leading-relaxed whitespace-pre-wrap">
                                {liveTranscript}
                                {isTranscribing && (
                                  <span className="inline-block w-2 h-4 bg-blue-300 ml-1 animate-pulse"></span>
                                )}
                              </div>
                            )}
                            <div ref={transcriptEndRef} />
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MessageSquare className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">
                              Start speaking to see your transcript here...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Completed view (mobile)
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-24 h-24 bg-green-600/20 border border-green-600/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Interview Completed
                  </h2>
                  <p className="text-gray-300 mb-6 text-sm">
                    Your interview has ended. View your analysis report.
                  </p>
                  <Button
                    onClick={() => {
                      const currentInterviewId =
                        interviewId ||
                        sessionStorage.getItem("currentInterviewId");
                      if (currentInterviewId) {
                        window.location.href = `/interview-report/${currentInterviewId}`;
                      } else {
                        window.location.href = `/interview/history`;
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Show Analysis
                  </Button>
                </div>
              )}
            </div>

            {/* Error Display */}
            {realtimeError && (
              <div className="absolute bottom-20 left-4 right-4 bg-red-600 text-white p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Connection Error</span>
                </div>
                <p className="text-sm mt-1">{realtimeError}</p>
              </div>
            )}

            {/* Analyzing Overlay (mobile) */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-white mx-auto mb-3" />
                  <div className="text-white font-medium">
                    Saving and analyzing interview...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </BaseInterviewRoom>
    );
  }

  // Desktop Layout (Preserved existing UI)
  return (
    <BaseInterviewRoom config={config} cvText={cvText}>
      {({
        interviewState,
        stateManager,
        messagesEndRef,
        controls,
        metrics,
        messages,
      }) => (
        <div className="fixed inset-0 w-full h-full bg-black z-50 flex flex-col">
          {/* Top Bar - Window Controls */}
          <div className="bg-gray-800 h-6 flex items-center justify-between px-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-white text-sm font-medium">
              {config.position} Interview - {config.candidateName}
            </div>
            <div className="w-16"></div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col h-[calc(100vh-13.5rem)]">
            {/* Participant Thumbnails Row */}
            {interviewStarted && (
              <div className="bg-gray-800 p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <button className="text-white hover:bg-gray-700 p-1 rounded">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex gap-2">
                    {/* AI Interviewer Thumbnail */}
                    <div className="relative w-24 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                      <div className="absolute bottom-1 left-1 w-3 h-3 bg-green-500 rounded-full"></div>
                      {isSpeaking && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    {/* User Thumbnail */}
                    <div className="relative w-24 h-16 bg-gray-700 rounded-lg flex items-center justify-center border-2 border-yellow-400">
                      {isVideoEnabled ? (
                        <>
                          {webcamLoading ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                            </div>
                          ) : webcamError ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            </div>
                          ) : (
                            <video
                              ref={videoRef}
                              autoPlay
                              muted
                              playsInline
                              className="w-full h-full object-cover rounded-lg"
                            />
                          )}
                        </>
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                      <div className="absolute bottom-1 left-1 w-3 h-3 bg-green-500 rounded-full"></div>
                      {!isAudioEnabled && (
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <MicOff className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    {/* Additional placeholder thumbnails */}
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-16 bg-gray-700 rounded-lg flex items-center justify-center"
                      >
                        <User className="w-8 h-8 text-gray-400" />
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <MicOff className="w-2 h-2 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="text-white hover:bg-gray-700 p-1 rounded">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Main Video Area */}
            <div className="flex-1 flex min-h-0">
              {/* Left Sidebar - Status Indicators */}
              <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4 flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Center - Main Video Display */}
              <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
                {!interviewStarted && !interviewCompleted ? (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Video className="w-16 h-16 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Ready to Start Your Interview
                    </h2>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto">
                      Click the button below to begin your {config.type}{" "}
                      interview for {config.position}.
                    </p>
                  </div>
                ) : !isConnected && interviewStarted && !interviewCompleted ? (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
                      <div className="relative z-10 w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Connecting to Interview...
                    </h2>
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="flex space-x-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-gray-300 text-sm">
                        Waiting for AI interviewer to join
                      </span>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-300">
                          Initializing AI connection...
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-300">
                          Loading interview questions...
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-300">
                          Preparing audio system...
                        </span>
                      </div>
                    </div>
                  </div>
                ) : !interviewCompleted ? (
                  <div className="grid grid-cols-2 gap-6 w-full max-w-6xl">
                    {/* AI Interviewer Main Video */}
                    <div className="relative">
                      <div className="bg-gray-700 rounded-lg overflow-hidden w-full aspect-video relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <User className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">
                              AI Interviewer
                            </h3>
                            <p className="text-sm text-white/80">
                              Conducting Interview
                            </p>
                          </div>
                        </div>
                        {isSpeaking && (
                          <div className="absolute bottom-4 left-4 bg-green-500 text-white px-2 py-1 rounded text-xs">
                            Speaking
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-sm text-white">
                          AI Interviewer
                        </span>
                      </div>
                    </div>

                    {/* User Main Video */}
                    <div className="relative">
                      <div className="bg-gray-700 rounded-lg overflow-hidden w-full aspect-video relative border-2 border-yellow-400">
                        {isVideoEnabled ? (
                          <>
                            {webcamLoading ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                <div className="text-center">
                                  <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-2" />
                                  <p className="text-blue-400 text-sm">
                                    Loading webcam...
                                  </p>
                                </div>
                              </div>
                            ) : webcamError ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                <div className="text-center">
                                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                                  <p className="text-red-400 text-sm">
                                    Webcam Error
                                  </p>
                                  <Button
                                    onClick={refreshWebcam}
                                    size="sm"
                                    className="mt-2"
                                  >
                                    Retry
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            )}
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <User className="w-32 h-32 text-gray-400" />
                          </div>
                        )}
                        {!isAudioEnabled && (
                          <div className="absolute top-4 right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <MicOff className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-sm text-white">
                          {config.candidateName}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Completed view (desktop)
                  <div className="text-center">
                    <div className="w-32 h-32 bg-green-600/20 border border-green-600/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-16 h-16 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Interview Completed
                    </h2>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto">
                      Your interview has ended. View your analysis report or
                      start a new interview.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        onClick={() => {
                          const currentInterviewId =
                            interviewId ||
                            sessionStorage.getItem("currentInterviewId");
                          if (currentInterviewId) {
                            window.location.href = `/interview-report/${currentInterviewId}`;
                          } else {
                            window.location.href = `/interview/history`;
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Show Analysis
                      </Button>
                      <Button
                        onClick={handleStartInterview}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Start New Interview
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar - Transcript */}
              {interviewStarted && (
                <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
                  <div className="p-4 border-b border-gray-700 flex-shrink-0">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {isConnected ? "Live Transcript" : "Connecting..."}
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-4 space-y-4">
                      {!isConnected ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <MessageSquare className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-gray-400 text-sm mb-2">
                            Establishing connection...
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      ) : transcript || liveTranscript ? (
                        <>
                          {transcript && (
                            <div className="space-y-3">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">
                                Completed
                              </div>
                              <div className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                                {transcript}
                              </div>
                            </div>
                          )}
                          {liveTranscript && (
                            <div className="space-y-3">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">
                                Live
                              </div>
                              <div className="text-sm text-blue-300 leading-relaxed whitespace-pre-wrap">
                                {liveTranscript}
                                {isTranscribing && (
                                  <span className="inline-block w-2 h-4 bg-blue-300 ml-1 animate-pulse"></span>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">
                            Start speaking to see your transcript here...
                          </p>
                        </div>
                      )}
                      {/* Auto-scroll anchor */}
                      <div ref={transcriptEndRef} />
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-700 flex-shrink-0">
                    <Button
                      onClick={clearTranscript}
                      variant="outline"
                      size="sm"
                      className="w-full text-white border-gray-600 hover:bg-gray-700"
                    >
                      Clear Transcript
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Control Bar */}
            <div className="bg-gray-800 h-16 flex items-center justify-between px-6 border-t border-gray-700">
              {/* Left Controls */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleToggleAudio}
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 h-12 px-3 ${
                    isAudioEnabled
                      ? "text-white hover:bg-gray-700"
                      : "text-red-400 hover:bg-red-500/20"
                  }`}
                >
                  {isAudioEnabled ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                  <span className="text-xs">Mute</span>
                </Button>
                <Button
                  onClick={handleToggleVideo}
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 h-12 px-3 ${
                    isVideoEnabled
                      ? "text-white hover:bg-gray-700"
                      : "text-red-400 hover:bg-red-500/20"
                  }`}
                >
                  {isVideoEnabled ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5" />
                  )}
                  <span className="text-xs">Stop Video</span>
                </Button>

                {/* Refresh Webcam Button - Desktop */}
                {isVideoEnabled && (webcamLoading || webcamError) && (
                  <Button
                    onClick={refreshWebcam}
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-12 px-3 text-blue-400 hover:bg-blue-500/20"
                    title="Refresh webcam"
                  >
                    <Loader2
                      className={`w-5 h-5 ${webcamLoading ? "animate-spin" : ""}`}
                    />
                    <span className="text-xs">Refresh</span>
                  </Button>
                )}

                {/* Manual Refresh Button - Desktop */}
                {isVideoEnabled && interviewStarted && (
                  <Button
                    onClick={refreshWebcam}
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-12 px-3 text-green-400 hover:bg-green-500/20"
                    title="Manual refresh webcam"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span className="text-xs">Refresh</span>
                  </Button>
                )}
              </div>

              {/* Center Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-12 px-3 text-white hover:bg-gray-700"
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs">Invite</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-12 px-3 text-white hover:bg-gray-700"
                >
                  <Users2 className="w-5 h-5" />
                  <span className="text-xs">Manage Participants</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-12 px-3 text-white hover:bg-gray-700 bg-green-600"
                >
                  <Share className="w-5 h-5" />
                  <span className="text-xs">Share</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-12 px-3 text-white hover:bg-gray-700"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs">Chat</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-12 px-3 text-white hover:bg-gray-700"
                >
                  <Circle className="w-5 h-5" />
                  <span className="text-xs">Record</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-12 px-3 text-white hover:bg-gray-700"
                >
                  <Grid3X3 className="w-5 h-5" />
                  <span className="text-xs">Breakout Rooms</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-12 px-3 text-white hover:bg-gray-700"
                >
                  <Smile className="w-5 h-5" />
                  <span className="text-xs">Reactions</span>
                </Button>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-4">
                {interviewStarted && (
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-mono">
                      {Math.floor(duration / 60)}:
                      {(duration % 60).toString().padStart(2, "0")}
                    </span>
                    <span className="text-xs text-gray-300">/ 10:00</span>
                  </div>
                )}
                {!interviewStarted && !interviewCompleted ? (
                  <Button
                    onClick={handleStartInterview}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                    disabled={!!realtimeError}
                  >
                    {realtimeError ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Connection Error
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Start Interview
                      </>
                    )}
                  </Button>
                ) : interviewCompleted ? (
                  <Button
                    onClick={() => {
                      const currentInterviewId =
                        interviewId ||
                        sessionStorage.getItem("currentInterviewId");
                      if (currentInterviewId) {
                        window.location.href = `/interview-report/${currentInterviewId}`;
                      } else {
                        console.error(
                          "No interview ID available for analytics"
                        );
                        // Fallback: redirect to history page
                        window.location.href = `/interview/history`;
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    disabled={
                      !interviewId &&
                      !sessionStorage.getItem("currentInterviewId")
                    }
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Show Analytics
                  </Button>
                ) : showAnalysisButton ? (
                  <Button
                    onClick={() => {
                      const currentInterviewId =
                        interviewId ||
                        sessionStorage.getItem("currentInterviewId");
                      if (currentInterviewId) {
                        window.location.href = `/interview-report/${currentInterviewId}`;
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analysis
                  </Button>
                ) : (
                  <Button
                    onClick={handleEndInterview}
                    variant="destructive"
                    className="px-6 py-2"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Ending interview...
                      </>
                    ) : (
                      <>
                        <PhoneOff className="w-4 h-4 mr-2" />
                        End meeting
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Error Display */}
            {realtimeError && (
              <div className="absolute bottom-20 left-4 right-4 bg-red-600 text-white p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Connection Error</span>
                </div>
                <p className="text-sm mt-1">{realtimeError}</p>
              </div>
            )}
            {/* Analyzing Overlay (desktop) */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-white mx-auto mb-3" />
                  <div className="text-white font-medium">
                    Saving and analyzing interview...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </BaseInterviewRoom>
  );
};
