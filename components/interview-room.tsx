"use client";

import React from "react";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";

// Helper function to extract text content from UIMessage
const getMessageText = (message: UIMessage): string => {
  const textPart = message.parts.find((part) => part.type === "text");
  return textPart ? (textPart as any).text : "";
};

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InterviewAnalysis } from "@/components/interview-analysis";
import { PageLoader } from "@/components/ui/page-loader";
import { useInterviewLoader } from "@/hooks/use-interview-loader";
import { InterviewStateManager, InterviewFlow } from "@/lib/interview-state";
import { VideoCallInterface } from "@/components/video-call-interface";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  MoreHorizontal,
  Clock,
  User,
  Building,
  Coffee,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TRANSITION_REGEX, END_REGEX } from "@/lib/interview/regex";
import { hydrateMessagesFromResponses } from "@/lib/interview/hydrate";
import { useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";

interface InterviewRoomProps {
  config: {
    position: string;
    type: string;
    candidateName: string;
    mode: "text" | "audio";
    flow?: InterviewFlow;
    jobDescription?: string;
    interviewId?: string; // Added interviewId to config
  };
  cvText?: string;
}

export function InterviewRoom({ config, cvText }: InterviewRoomProps) {
  const router = useRouter();
  const [stateManager, setStateManager] =
    useState<InterviewStateManager | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [sectionComplete, setSectionComplete] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [chatDisabled, setChatDisabled] = useState(false);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);
  const [autoTriggerDelay, setAutoTriggerDelay] = useState(3000); // 3 seconds
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastAutoAdvancedSection, setLastAutoAdvancedSection] = useState<
    number | null
  >(null);
  const [hasAutoAdvancedForSection, setHasAutoAdvancedForSection] =
    useState(false);
  const [lastAIContent, setLastAIContent] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(new Date());

  const [interviewEnded, setInterviewEnded] = useState(false);
  const [autoAdvanceLock, setAutoAdvanceLock] = useState(false);
  const [isResumedInterview, setIsResumedInterview] = useState(false);
  const [flowStateUpdated, setFlowStateUpdated] = useState(false);
  const lastAdvancedContentRef = useRef<string | null>(null);
  const [isFlowOpen, setIsFlowOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle page unload/abandonment
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (interviewStarted && !interviewEnded) {
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
        !interviewEnded
      ) {
        // Mark interview as abandoned when user leaves the page
        if (config.interviewId) {
          fetch(`/api/interviews/${config.interviewId}`, {
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
  }, [interviewStarted, interviewEnded, config.interviewId]);
  const {
    isLoading: isPageLoading,
    loaderState,
    showLoader,
    hideLoader,
  } = useInterviewLoader();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        interviewState: stateManager?.getState() || {
          flow: config.flow || {
            sections: [],
            totalDuration: 25,
            difficulty: "mid",
            focus: "mixed",
          },
          position: config.position,
          interviewType: config.type,
          cvText,
          jobDescription: config.jobDescription,
          currentSectionId: "",
          sectionIndex: 0,
          elapsedTime: 0,
          startTime: Date.now(),
          finished: false,
          responses: [],
        },
      },
    }),
    onFinish: (options: { message: UIMessage }) => {
      const newMessage = options.message;
      // Only process complete messages, not streaming parts
      if (autoAdvancing) {
        setAutoAdvancing(false);
      }

      // Regex-based end-of-interview detection
      if (
        newMessage.role === "assistant" &&
        END_REGEX.test(getMessageText(newMessage)) &&
        !interviewEnded
      ) {
        setInterviewEnded(true);
        setChatDisabled(true);

        // Store the final AI message and mark interview as finished
        if (stateManager && config.interviewId) {
          // Add the final AI message with empty answer
          stateManager.addResponse(getMessageText(newMessage), "");

          // Save final transcript and mark interview as finished
          const responses = stateManager.getState().responses;
          fetch(`/api/interviews/${config.interviewId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: responses,
              status: "completed",
              completedAt: new Date().toISOString(),
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("Interview marked as completed:", data);
            })
            .catch((err) => {
              console.error("Failed to mark interview as completed:", err);
            });
        }
      }
    },
  });

  // Initialize state manager when component mounts
  useEffect(() => {
    if (config.flow) {
      const manager = new InterviewStateManager(
        config.flow,
        config.position,
        config.type,
        cvText,
        config.jobDescription
      );
      setStateManager(manager);
    }
  }, [
    config.flow,
    config.position,
    config.type,
    cvText,
    config.jobDescription,
  ]);

  const steps = [
    { name: "Opening", icon: Coffee, color: "amber" },
    { name: "Background", icon: User, color: "blue" },
    { name: "Technical", icon: Lightbulb, color: "purple" },
    { name: "Problem Solving", icon: Settings, color: "green" },
    { name: "Closing", icon: Building, color: "indigo" },
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Single, clean message processing effect
  useEffect(() => {
    if (!stateManager || messages.length === 0) return;

    // Get the last two messages to check for Q&A pairs
    const lastMessages = messages.slice(-2);

    // Only process if we have at least 2 messages and they form a Q&A pair
    if (
      lastMessages.length === 2 &&
      lastMessages[0].role === "assistant" &&
      lastMessages[1].role === "user"
    ) {
      const assistantMessage = lastMessages[0];
      const userMessage = lastMessages[1];

      // Check if this Q&A pair is already stored
      const existingResponses = stateManager.getState().responses;
      const isDuplicate = existingResponses.some(
        (r) =>
          r.question === getMessageText(assistantMessage) &&
          r.answer === getMessageText(userMessage)
      );

      if (!isDuplicate) {
        // Store the complete Q&A pair
        stateManager.addResponse(
          getMessageText(assistantMessage),
          getMessageText(userMessage)
        );

        // Save to backend immediately
        if (config.interviewId) {
          const responses = stateManager.getState().responses;
          const currentState = stateManager.getState();
          fetch(`/api/interviews/${config.interviewId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: responses,
              currentSectionIndex: currentState.sectionIndex,
              currentFlowState: {
                sectionIndex: currentState.sectionIndex,
                currentSectionId: currentState.currentSectionId,
                elapsedTime: currentState.elapsedTime,
                responses: responses.length,
                lastUpdated: new Date().toISOString(),
              },
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("Transcript and flow state saved:", data);
            })
            .catch((err) => {
              console.error("Failed to save transcript and flow state:", err);
            });
        }
      }
    }

    // Check for auto-advancement on the last assistant message
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === "assistant" &&
      !isLoading &&
      !autoAdvancing &&
      getMessageText(lastMessage) !== lastAdvancedContentRef.current
    ) {
      if (
        stateManager.shouldAutoAdvanceBasedOnResponse(
          getMessageText(lastMessage)
        )
      ) {
        console.log(
          "Auto-advancement triggered for message:",
          getMessageText(lastMessage)
        );
        setSectionComplete(true);
        setChatDisabled(true);
        lastAdvancedContentRef.current = getMessageText(lastMessage);

        if (autoTriggerEnabled) {
          setTimeout(() => {
            continueToNextSection();
          }, autoTriggerDelay);
        }
      }
    }
  }, [
    messages,
    stateManager,
    isLoading,
    autoAdvancing,
    autoTriggerEnabled,
    config.interviewId,
  ]);

  // Reset auto-advance state when section changes
  useEffect(() => {
    if (stateManager) {
      setSectionComplete(false);
      setShowContinueButton(false);
      setChatDisabled(false);
      setAutoAdvancing(false);
      setHasAutoAdvancedForSection(false);
      // Reset the ref when the section changes to allow advancement in the new section
      lastAdvancedContentRef.current = null;
    }
  }, [stateManager?.getState().sectionIndex]);

  // Force UI update when flow state is restored
  useEffect(() => {
    if (stateManager && isResumedInterview) {
      // Trigger a re-render by updating a state variable
      const currentSection = stateManager.getCurrentSection();
      if (currentSection) {
        // This will trigger UI updates to reflect the current section
        console.log(
          "Flow state restored, current section:",
          currentSection.title
        );
      }
    }
  }, [stateManager, isResumedInterview]);

  // Debug messages
  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

  // Restore state on mount if interviewId is present
  useEffect(() => {
    async function fetchInterview() {
      if (!config.interviewId) return;
      setIsRestoring(true);
      try {
        const res = await fetch(`/api/interviews/${config.interviewId}`);
        const data = await res.json();
        if (data.success && data.interview) {
          // Hydrate responses as chat messages
          const raw =
            data.interview.transcript || data.interview.responses || [];
          const responses = Array.isArray(raw) ? raw : [];
          const hydratedMessages = hydrateMessagesFromResponses(responses);
          if (hydratedMessages.length > 0) {
            setMessages(hydratedMessages);
          }
          // Optionally hydrate stateManager's responses
          if (stateManager) {
            stateManager.getState().responses = responses;
          }
          if (stateManager && responses.length > 0) {
            // Set responses
            stateManager.getState().responses = responses;

            // Restore section index and current section using stored flow state
            if (data.interview.currentSectionIndex !== undefined) {
              // Use the stored section index if available
              stateManager.getState().sectionIndex =
                data.interview.currentSectionIndex;

              // Set the current section ID based on the stored index
              const currentSection =
                stateManager.getState().flow.sections[
                  data.interview.currentSectionIndex
                ];
              if (currentSection) {
                stateManager.getState().currentSectionId = currentSection.id;
              }
            } else {
              // Fallback to the old method using last response sectionId
              const lastSectionId = responses[responses.length - 1]?.sectionId;
              if (lastSectionId) {
                const sectionIdx = stateManager
                  .getState()
                  .flow.sections.findIndex((s) => s.id === lastSectionId);
                if (sectionIdx !== -1) {
                  stateManager.getState().sectionIndex = sectionIdx;
                  stateManager.getState().currentSectionId = lastSectionId;
                }
              }
            }

            // Restore additional flow state if available
            if (data.interview.currentFlowState) {
              const flowState = data.interview.currentFlowState;
              if (flowState.elapsedTime) {
                stateManager.getState().elapsedTime = flowState.elapsedTime;
              }
            }

            // Mark interview as started if we have responses
            setInterviewStarted(true);

            // Mark as resumed interview if we have existing data
            if (responses.length > 0) {
              setIsResumedInterview(true);
            }

            // Force a UI update to reflect the restored state
            setStateManager((prevManager) => {
              if (prevManager) {
                // Create a new instance to trigger re-renders
                const newManager = new InterviewStateManager(
                  prevManager.getState().flow,
                  prevManager.getState().position,
                  prevManager.getState().interviewType,
                  prevManager.getState().cvText,
                  prevManager.getState().jobDescription
                );

                // Copy the restored state
                const restoredState = prevManager.getState();
                newManager.getState().sectionIndex = restoredState.sectionIndex;
                newManager.getState().currentSectionId =
                  restoredState.currentSectionId;
                newManager.getState().responses = restoredState.responses;
                newManager.getState().elapsedTime = restoredState.elapsedTime;

                return newManager;
              }
              return prevManager;
            });
          }

          // Check if interview was already completed
          if (data.interview.status === "completed") {
            setInterviewEnded(true);
            setChatDisabled(true);

            // Check if analysis exists and show the analysis button
            if (
              data.interview.InterviewAnalysis &&
              data.interview.InterviewAnalysis.length > 0
            ) {
              setAnalysis(data.interview.InterviewAnalysis[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch interview for hydration:", err);
      } finally {
        setIsRestoring(false);
      }
    }
    fetchInterview();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.interviewId]);

  const generateAnalysis = async () => {
    setAnalysisError(null);
    showLoader("evaluation", 3000);
    setIsAnalyzing(true);

    try {
      // Check if we have messages to analyze
      if (messages.length === 0) {
        throw new Error("No conversation data available for analysis");
      }

      const state = stateManager?.getState();
      console.log("Sending analysis request with data:", {
        position: config.position,
        type: config.type,
        candidateName: config.candidateName,
        duration: state?.elapsedTime || 0,
        messagesCount: messages.length,
        state: state,
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewData: {
            position: config.position,
            type: config.type,
            candidateName: config.candidateName,
            duration: state?.elapsedTime || 0,
            messages: messages,
            state: state,
          },
        }),
      });

      console.log("Analysis response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Analysis API error response:", errorText);
        throw new Error(
          `Analysis failed: ${response.status} ${response.statusText}`
        );
      }

      const analysisData = await response.json();
      console.log("Analysis data received:", analysisData);

      setAnalysis(analysisData);
      setShowAnalysis(true);
    } catch (error) {
      console.error("Failed to generate analysis:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Analysis failed"
      );

      // Show error message to user
      alert(
        `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`
      );
    } finally {
      hideLoader();
      setIsAnalyzing(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCurrentSection = () => {
    return stateManager?.getCurrentSection();
  };

  const getProgressPercentage = () => {
    if (!stateManager) return 0;
    const state = stateManager.getState();
    return ((state.sectionIndex + 1) / state.flow.sections.length) * 100;
  };

  const getTimeRemaining = () => {
    return stateManager?.getTotalTimeRemaining() || 0;
  };

  const getSectionTimeRemaining = () => {
    return stateManager?.getSectionTimeRemaining() || 0;
  };

  const startInterview = async () => {
    setInterviewStarted(true);

    console.log("Starting interview...");

    // Trigger the first AI question by sending an initial user message
    try {
      await append({
        role: "user",
        content: "I'm ready to start the interview.",
      });
      console.log("Initial message sent successfully");
    } catch (error) {
      console.error("Error starting interview:", error);
    }
  };

  const nextStep = () => {
    if (!stateManager) return;
    if (!stateManager.isInterviewComplete()) {
      if (stateManager.progressToNextSection()) {
        // Auto-advance to next section
        append({
          role: "system",
          content: `Moving to next section: ${stateManager.getCurrentSection()?.title}`,
        });
      } else {
        // Interview is complete
        append({
          role: "system",
          content: "Interview complete. Thank you for your time!",
        });
      }
    }
  };

  const continueToNextSection = async () => {
    if (!stateManager || autoAdvancing) return;

    // 1. Lock the state to prevent loops
    setAutoAdvancing(true);
    setSectionComplete(false);
    setShowContinueButton(false);

    if (stateManager.progressToNextSection()) {
      const currentSection = stateManager.getCurrentSection();

      // 2. Use a neutral, instructional prompt that won't re-trigger the advance logic.
      await append({
        role: "system",
        content: `The previous section is concluded. Use this exact sentence at the end of your response to transition: \"That approach fosters transparency and accountability. Are you ready to continue to the next section?\". Then start the \"${currentSection?.title}\" section focused on: ${currentSection?.focusAreas.join(", ")}. Ask the first question for this new section.`,
      });

      // The `autoAdvancing` state will be set to false in the `onFinish` callback.
    } else {
      // Interview is complete
      setInterviewEnded(true);
      setChatDisabled(true);

      // Store the final completion message and mark interview as finished
      if (config.interviewId) {
        const finalMessage =
          "Excellent! We've completed all sections of the interview. Thank you for your thoughtful responses.";

        // Add the final AI message with empty answer
        if (stateManager) {
          stateManager.addResponse(finalMessage, "");
        }

        // Save final transcript and mark interview as finished
        const responses = stateManager?.getState().responses || [];
        fetch(`/api/interviews/${config.interviewId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: responses,
            status: "completed",
            completedAt: new Date().toISOString(),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("Interview marked as completed:", data);
          })
          .catch((err) => {
            console.error("Failed to mark interview as completed:", err);
          });
      }

      await append({
        role: "system",
        content:
          "Excellent! We've completed all sections of the interview. Thank you for your thoughtful responses.",
      });
      setAutoAdvancing(false); // Unlock here if the interview ends.
    }
  };

  const analyzeCurrentSection = async () => {
    if (!stateManager) return;

    const currentSection = stateManager.getCurrentSection();
    if (!currentSection) return;

    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const sectionResponses = stateManager
        .getState()
        .responses.filter((r) => r.sectionId === currentSection.id);

      if (sectionResponses.length === 0) {
        throw new Error("No responses available for this section");
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewData: {
            position: config.position,
            type: config.type,
            candidateName: config.candidateName,
            duration: stateManager.getState().elapsedTime,
            // For analysis, consider the entire interview (user and assistant only)
            messages: messages.filter(
              (m) =>
                (m as any).role === "user" || (m as any).role === "assistant"
            ),
            section: currentSection,
            sectionResponses,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const analysisData = await response.json();
      setAnalysis(analysisData);
      setShowAnalysis(true);
    } catch (error) {
      console.error("Failed to analyze section:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Analysis failed"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFullReport = async () => {
    try {
      // showLoader({ message: "Generating full report...", progress: 0 });
      setIsAnalyzing(true);

      // Generate analysis if not already done
      if (!analysis) {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewData: {
              position: config.position,
              type: config.type,
              candidateName: config.candidateName,
              duration: stateManager?.getState().elapsedTime || 0,
              messages: messages,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate analysis");
        }

        const analysisData = await response.json();

        // Save analysis to database
        await fetch(`/api/interviews/${config.interviewId}/analysis`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysis: analysisData }),
        });
      }

      // Navigate to analysis page
      router.push(`/interview/${config.interviewId}/analysis`);
    } catch (error) {
      console.error("Failed to generate full report:", error);
      alert(
        `Failed to generate report: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      // hideLoader();
      setIsAnalyzing(false);
    }
  };

  if (showAnalysis && analysis) {
    return (
      <>
        <PageLoader
          isLoading={isPageLoading}
          state={loaderState}
          showProgress={true}
        />
        <InterviewAnalysis
          analysis={analysis}
          config={config}
          messages={messages}
          onBack={() => setShowAnalysis(false)}
          cvText={cvText}
          section={stateManager?.getCurrentSection()}
        />
      </>
    );
  }

  // In the render, show a loading indicator if isRestoring is true
  if (isRestoring) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary animate-pulse flex items-center justify-center">
            <span className="text-primary-foreground text-2xl font-bold">
              ⏳
            </span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            Restoring your interview...
          </div>
        </div>
      </div>
    );
  }

  const getRoomGradient = () => {
    if (isLoading) return "from-indigo-900/20 via-slate-900/10 to-blue-900/20";
    if (messages.length === 0)
      return "from-blue-900/20 via-slate-900/10 to-purple-900/20";
    if (messages.length > 6)
      return "from-emerald-900/20 via-slate-900/10 to-teal-900/20";
    return "from-slate-900/20 via-gray-900/10 to-slate-900/20";
  };

  const currentSection = getCurrentSection();
  const progressPercentage = getProgressPercentage();
  const timeRemaining = getTimeRemaining();
  const sectionTimeRemaining = getSectionTimeRemaining();

  return (
    <>
      <PageLoader
        isLoading={isPageLoading}
        state={loaderState}
        showProgress={true}
      />

      {/* Fullscreen Video Call Environment */}
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
        {/* Professional Video Call Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getRoomGradient()} transition-all duration-1000`}
        />

        {/* Subtle Professional Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
            backgroundSize: "30px 30px",
          }}
        />

        {/* Main Video Call Interface */}
        <div className="relative h-full w-full flex flex-col">
          {/* Video Call Header - Professional & Minimal */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/20 to-transparent sm:backdrop-blur-sm">
            <div className="flex items-center justify-between px-8 py-4">
              {/* Call Info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
                  <span className="text-white font-medium text-lg">
                    {config.candidateName}
                  </span>
                  <div className="w-px h-6 bg-white/30" />
                  <span className="text-white/80 text-sm">
                    {config.position}
                  </span>
                  {currentSection && (
                    <>
                      <div className="w-px h-6 bg-white/30" />
                      <span className="text-white/80 text-sm">
                        {currentSection.title}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex items-center gap-4">
                {/* Progress */}
                <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
                  <div className="flex items-center gap-3 text-white/90">
                    <div className="flex-1 bg-white/20 rounded-full h-2 min-w-[100px]">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300 shadow-sm"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                </div>

                {/* Timer */}
                <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
                  <div className="flex items-center gap-2 text-white/90">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-sm">
                      {interviewStarted
                        ? formatDuration(timeRemaining)
                        : "25:00"}
                    </span>
                  </div>
                </div>

                {/* Section Timer */}
                {currentSection && (
                  <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
                    <div className="flex items-center gap-2 text-white/90">
                      <span className="text-xs">Section:</span>
                      <span className="font-mono text-sm">
                        {formatDuration(sectionTimeRemaining)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Auto-trigger */}
                <div className="bg-black/30 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10">
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="text-xs">Auto:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAutoTriggerEnabled(!autoTriggerEnabled)}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                        autoTriggerEnabled
                          ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                          : "bg-white/10 text-white/60 hover:bg-white/20"
                      }`}
                    >
                      {autoTriggerEnabled ? "ON" : "OFF"}
                    </Button>
                  </div>
                </div>

                {/* Settings */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0 bg-black/30 backdrop-blur-md rounded-xl border border-white/10 hover:bg-black/50"
                >
                  <Settings className="w-4 h-4 text-white/80" />
                </Button>
              </div>
            </div>
          </div>

          {/* Interview Progress - Floating Steps */}
          <div className="hidden md:block fixed top-24 left-6 z-20">
            <div className="relative">
              {/* Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFlowOpen(!isFlowOpen)}
                className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 p-0 hover:bg-gray-50 z-30"
              >
                {isFlowOpen ? (
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </Button>

              {/* Flow Panel */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isFlowOpen
                    ? "opacity-100 max-w-xs w-64"
                    : "opacity-0 max-w-0 w-0 overflow-hidden"
                }`}
              >
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/20">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Interview Flow
                    </div>
                    <div className="space-y-2">
                      {stateManager
                        ?.getState()
                        .flow.sections.map((section, index) => {
                          const isActive =
                            index === stateManager.getState().sectionIndex;
                          const isCompleted =
                            index < stateManager.getState().sectionIndex;
                          const isUpcoming =
                            index > stateManager.getState().sectionIndex;

                          return (
                            <div
                              key={section.id}
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                                isActive
                                  ? "bg-muted border border-border shadow-sm"
                                  : isCompleted
                                    ? "bg-green-50 border border-green-200"
                                    : "hover:bg-gray-50 border border-transparent"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isActive
                                    ? "bg-primary text-primary-foreground"
                                    : isCompleted
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <span className="text-xs font-medium">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-sm font-medium flex-1 min-w-0 ${
                                  isActive
                                    ? "text-primary"
                                    : isCompleted
                                      ? "text-green-700"
                                      : "text-gray-600"
                                }`}
                              >
                                {section.title}
                              </span>
                              {isActive && (
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/20 text-primary text-xs ml-auto flex-shrink-0"
                                >
                                  Active
                                </Badge>
                              )}
                              {isCompleted && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700 text-xs ml-auto flex-shrink-0"
                                >
                                  ✓
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Video Call Area */}
          <div
            className={`flex-1 flex items-center justify-center px-8 pt-20 pb-8 transition-all duration-300 ${
              isFlowOpen ? "md:pl-80" : "md:pl-20"
            }`}
          >
            <div className="w-full max-w-6xl">
              {/* Video Call Container */}
              <div className="h-[700px] bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
                {/* Video Call Header */}
                <div className="bg-gradient-to-r from-black/40 to-gray-900/40 px-8 py-6 border-b border-white/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {currentSection?.title} Discussion
                      </h2>
                      <p className="text-white/70 text-sm mt-1">
                        {currentSection?.focusAreas.join(", ")}
                      </p>
                    </div>

                    {messages.length >= 2 && (
                      <div className="flex items-center gap-3">
                        {analysisError && (
                          <div className="flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Analysis failed</span>
                          </div>
                        )}

                        <Button
                          onClick={() => generateAnalysis()}
                          variant="outline"
                          size="sm"
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? "Analyzing..." : "Get Feedback"}
                        </Button>

                        {currentSection && (
                          <Button
                            onClick={nextStep}
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          >
                            Continue →
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Call Messages Area */}
                <div
                  className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-black/20 to-transparent"
                  style={{ height: "calc(100% - 240px)" }}
                >
                  {/* Welcome State */}
                  {messages.length === 0 && !interviewStarted && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {isResumedInterview
                          ? `Continue ${currentSection?.title || "Interview"} Section`
                          : `Ready for ${currentSection?.title || "Interview"}?`}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {isResumedInterview
                          ? `Welcome back! You're currently on step ${stateManager?.getState().sectionIndex + 1} of ${stateManager?.getState().flow.sections.length || 0}. Let's continue from where you left off.`
                          : "Take a moment to collect your thoughts. When you're ready, we'll begin this section."}
                      </p>
                      <Button
                        onClick={startInterview}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {isResumedInterview
                          ? "Continue Interview"
                          : "I'm Ready"}
                      </Button>
                    </div>
                  )}

                  {/* Loading State - when interview started but waiting for first message */}
                  {messages.length === 0 && interviewStarted && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Starting {currentSection?.title}...
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Preparing your personalized interview questions.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.1}s` }}
                            />
                          ))}
                        </div>
                        <span className="text-gray-600 text-sm">
                          Loading questions...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Conversation Messages */}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div
                        className={`max-w-[75%] p-6 rounded-3xl ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                            : "bg-gray-50 text-gray-800 border border-gray-100"
                        }`}
                      >
                        <div className="space-y-2">
                          <div
                            className={`text-xs font-medium opacity-75 ${
                              message.role === "user"
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {message.role === "user" ? "You" : "Interviewer"}
                          </div>
                          <div className="leading-relaxed">
                            {getMessageText(message)}
                          </div>
                        </div>
                      </div>

                      {message.role === "user" && (
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Thinking Indicator */}
                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.1}s` }}
                              />
                            ))}
                          </div>
                          <span className="text-gray-600 text-sm">
                            Thinking about your response...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section Complete State */}
                  {sectionComplete && showContinueButton && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-3xl p-6 max-w-[75%]">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-800">
                              Section Complete!
                            </span>
                            {autoTriggerEnabled && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs ml-auto">
                                Auto-continue in{" "}
                                {Math.ceil(autoTriggerDelay / 1000)}s
                              </Badge>
                            )}
                          </div>
                          <p className="text-green-700">
                            Great work! We've covered the{" "}
                            {currentSection?.title} section thoroughly. You can
                            review your performance or continue to the next
                            section.
                            {autoTriggerEnabled && (
                              <span className="block mt-2 text-sm text-blue-600">
                                ⏰ Auto-continuing in{" "}
                                {Math.ceil(autoTriggerDelay / 1000)} seconds...
                              </span>
                            )}
                          </p>
                          <div className="flex gap-3 pt-2">
                            <Button
                              onClick={analyzeCurrentSection}
                              variant="outline"
                              size="sm"
                              className="bg-white/80 backdrop-blur-sm border-green-300 text-green-700 hover:bg-green-50"
                              disabled={isAnalyzing}
                            >
                              {isAnalyzing
                                ? "Analyzing..."
                                : "Review Performance"}
                            </Button>
                            <Button
                              onClick={continueToNextSection}
                              size="sm"
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                              disabled={autoAdvancing}
                            >
                              {autoAdvancing
                                ? "Continuing..."
                                : "Continue to Next Section"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto-advancing State */}
                  {autoAdvancing && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.1}s` }}
                              />
                            ))}
                          </div>
                          <span className="text-blue-700 text-sm">
                            Moving to next section...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {interviewEnded && (
                    <div className="text-center py-8">
                      <div className="text-2xl font-bold text-green-700 mb-2">
                        Interview Complete!
                      </div>
                      <div className="text-gray-600 mb-4">
                        Thank you for participating. You can now view your
                        analysis report.
                      </div>
                      <Button
                        onClick={generateAnalysis}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        Show Analysis
                      </Button>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Video Call Input Area */}
                {config.mode === "audio" ? (
                  <VideoCallInterface
                    messages={messages}
                    input={input}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                    currentStep={stateManager?.getState().sectionIndex + 1 || 1}
                    disabled={chatDisabled || interviewEnded}
                    onEndCall={() => {
                      // Handle end call - could navigate to analysis or summary
                      console.log("Call ended");
                    }}
                    duration={Math.floor(
                      (Date.now() - startTime.getTime()) / 1000
                    )}
                    isInterviewComplete={interviewEnded}
                    interviewType={config.type}
                  />
                ) : (
                  <div className="border-t border-white/10 p-6 bg-black/20 backdrop-blur-sm">
                    {chatDisabled || interviewEnded ? (
                      <div className="text-center py-4">
                        <p className="text-white/70 text-sm">
                          {interviewEnded
                            ? "Interview complete! You can view your analysis report."
                            : "Section complete! Use the buttons above to continue or review your performance."}
                        </p>
                      </div>
                    ) : (
                      <ChatInterface
                        messages={messages}
                        input={input}
                        handleInputChange={handleInputChange}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                        mode={config.mode}
                        isRecording={false}
                        currentStep={
                          stateManager?.getState().sectionIndex + 1 || 1
                        }
                        disabled={chatDisabled || interviewEnded}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video Call Floating Action Panel */}
          {stateManager && (
            <div className="absolute bottom-6 right-6 z-10">
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-white/80">
                    {stateManager.getState().sectionIndex + 1} of{" "}
                    {stateManager.getState().flow.sections.length} sections
                  </div>
                  <Button
                    onClick={handleFullReport}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? "Generating..." : "Full Report"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
