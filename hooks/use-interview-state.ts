"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { InterviewStateManager } from "@/lib/interview-state";
import { InterviewConfig, InterviewState, InterviewControls, InterviewMetrics } from "@/lib/interview-types";
import { INTERVIEW_CONSTANTS } from "@/lib/interview-constants";
import { formatDuration, calculateProgressPercentage, shouldAutoAdvance } from "@/lib/interview-utils";
import { TRANSITION_REGEX, END_REGEX } from "@/lib/interview/regex";

// Helper function to extract text content from UIMessage
const getMessageText = (message: UIMessage): string => {
    const textPart = message.parts.find(part => part.type === 'text');
    return textPart ? (textPart as any).text : '';
};

export const useInterviewState = (config: InterviewConfig, cvText?: string) => {
    const router = useRouter();

    // Core state
    const [stateManager, setStateManager] = useState<InterviewStateManager | null>(null);
    const [interviewState, setInterviewState] = useState<InterviewState>({
        isStarted: false,
        isEnded: false,
        isAnalyzing: false,
        analysisError: null,
        autoAdvancing: false,
        sectionComplete: false,
        showContinueButton: false,
        chatDisabled: false,
        autoTriggerEnabled: false, // Disabled by default to prevent auto-advance
        autoTriggerDelay: INTERVIEW_CONSTANTS.AUTO_TRIGGER_DELAY,
        isRestoring: false,
        lastAutoAdvancedSection: null,
        hasAutoAdvancedForSection: false,
        lastAIContent: null,
        startTime: new Date(),
        autoAdvanceLock: false,
        isResumedInterview: false,
        flowStateUpdated: false,
        isFlowOpen: true,
        showAnalysis: false,
        analysis: null,
    });

    // Refs
    const lastAdvancedContentRef = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const processedMessageIds = useRef<Set<string>>(new Set());

    // Chat functionality using AI SDK v5
    const {
        messages,
        setMessages,
        sendMessage,
        regenerate,
        stop,
        status,
        error,
        clearError,
    } = useChat({
        transport: new DefaultChatTransport({
            api: INTERVIEW_CONSTANTS.ENDPOINTS.CHAT,
            body: {
                interviewState: stateManager?.getState() || {
                    flow: config.flow || {
                        sections: [],
                        totalDuration: INTERVIEW_CONSTANTS.DEFAULT_INTERVIEW_DURATION,
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
            console.log("Message finished:", options.message);
            handleMessageFinish(options.message);
        },
    });

    // Initialize state manager
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
    }, [config.flow, config.position, config.type, cvText, config.jobDescription]);

    // Smart auto-scroll - always scroll when AI is typing, otherwise only if not visible
    useEffect(() => {
        if (messages.length === 0) return;

        const scrollToBottom = () => {
            if (messagesEndRef.current) {
                const container = messagesEndRef.current.closest('.overflow-y-auto');
                if (container) {
                    // Always scroll when AI is streaming (typing)
                    if (status === 'streaming') {
                        container.scrollTop = container.scrollHeight;
                        return;
                    }

                    // For other cases, only scroll if new message isn't visible
                    const containerRect = container.getBoundingClientRect();
                    const messageEndRect = messagesEndRef.current.getBoundingClientRect();
                    
                    const isVisible = messageEndRect.bottom <= containerRect.bottom;
                    
                    if (!isVisible) {
                        container.scrollTop = container.scrollHeight;
                    }
                }
            }
        };

        setTimeout(scrollToBottom, 0);
    }, [messages, status]);



    // Deduplicate messages at the state level
    useEffect(() => {
        if (messages.length > 0) {
            const uniqueMessages = messages.filter((message, index, self) => {
                const firstIndex = self.findIndex(m =>
                    getMessageText(m) === getMessageText(message) &&
                    m.role === message.role &&
                    m.id === message.id
                );
                return firstIndex === index;
            });

            // Additional check: remove consecutive identical messages
            const finalMessages = uniqueMessages.filter((message, index, array) => {
                if (index === 0) return true;
                const previousMessage = array[index - 1];
                return !(
                    getMessageText(message) === getMessageText(previousMessage) &&
                    message.role === previousMessage.role
                );
            });

            if (finalMessages.length !== messages.length) {
                console.log(`State deduplication: ${messages.length} -> ${finalMessages.length} messages`);
                setMessages(finalMessages);
            }
        }
    }, [messages, setMessages]);

    // Message processing effect
    useEffect(() => {
        if (!stateManager || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "assistant") {
            // Create a unique identifier for this message
            const messageId = `${lastMessage.id || Date.now()}-${getMessageText(lastMessage)}`;

            // Check if we've already processed this message
            if (processedMessageIds.current.has(messageId)) {
                console.log("Skipping duplicate message processing:", messageId);
                return;
            }

            // Mark as processed
            processedMessageIds.current.add(messageId);
            console.log("Processing new message:", messageId);

            processAssistantMessage(lastMessage);
        }
    }, [messages, stateManager]);

    // Auto-advance logic - Disabled by default to prevent unwanted advancement
    useEffect(() => {
        // Only proceed if auto-trigger is explicitly enabled
        if (!interviewState.autoTriggerEnabled) return;

        // Check if user has responded in this section with meaningful content
        const userMessages = messages.filter(msg => msg.role === "user");
        const hasUserResponded = userMessages.some(msg =>
            getMessageText(msg) &&
            getMessageText(msg).trim().length > 10 && // At least 10 characters
            !getMessageText(msg).toLowerCase().includes("i'm ready") // Not just the initial message
        );

        if (shouldAutoAdvance(
            interviewState.autoTriggerEnabled,
            interviewState.hasAutoAdvancedForSection,
            messages.length,
            hasUserResponded
        )) {
            handleAutoAdvance();
        }
    }, [messages.length, interviewState.autoTriggerEnabled, interviewState.hasAutoAdvancedForSection]);

    // Handle message finish
    const handleMessageFinish = useCallback((newMessage: UIMessage) => {
        console.log("handleMessageFinish called with:", newMessage);
        if (interviewState.autoAdvancing) {
            setInterviewState(prev => ({ ...prev, autoAdvancing: false }));
        }

        // Check for interview end
        if (
            newMessage.role === "assistant" &&
            END_REGEX.test(getMessageText(newMessage)) &&
            !interviewState.isEnded
        ) {
            handleInterviewEnd(newMessage);
        }
    }, [interviewState.autoAdvancing, interviewState.isEnded]);

    // Process assistant message
    const processAssistantMessage = useCallback(async (message: UIMessage) => {
        if (!stateManager) return;

        const messageText = getMessageText(message);

        // Prevent duplicate processing by checking if this message was already processed
        if (interviewState.lastAIContent === messageText) {
            return;
        }

        // Store response
        stateManager.addResponse(messageText, "");

        // Check for section transitions - only if we're not already transitioning and it's an assistant message
        if (message.role === "assistant" &&
            TRANSITION_REGEX.test(messageText) &&
            !interviewState.autoAdvancing &&
            messageText !== interviewState.lastAIContent) { // Prevent processing duplicate messages

            console.log("🔍 Transition detected:", messageText);
            console.log("🔍 Current section index:", stateManager.getState().sectionIndex);
            console.log("🔍 Regex match:", TRANSITION_REGEX.test(messageText));

            // Handle section transition inline to avoid dependency issues
            try {
                if (stateManager.progressToNextSection()) {
                    const currentSection = stateManager.getCurrentSection();
                    console.log("🔍 Progressed to section:", currentSection?.title);

                    setInterviewState(prev => ({
                        ...prev,
                        hasAutoAdvancedForSection: true,
                        lastAutoAdvancedSection: stateManager.getState().sectionIndex,
                        autoAdvancing: true // Set flag to prevent double-triggers
                    }));

                    console.log("🔍 Set autoAdvancing to true, will reset in 3 seconds");

                    // Reset the autoAdvancing flag after a delay to prevent rapid transitions
                    setTimeout(() => {
                        setInterviewState(prev => ({ ...prev, autoAdvancing: false }));
                        console.log("🔍 Reset autoAdvancing to false");
                    }, 3000);
                } else {
                    // Interview is complete
                    console.log("🔍 Interview complete");
                    setInterviewState(prev => ({ ...prev, isEnded: true }));
                }
            } catch (error) {
                console.error("Error in section transition:", error);
                // Reset autoAdvancing flag on error
                setInterviewState(prev => ({ ...prev, autoAdvancing: false }));
            }
        }

        // Update last AI content
        setInterviewState(prev => ({ ...prev, lastAIContent: messageText }));
    }, [stateManager, interviewState.lastAIContent, interviewState.autoAdvancing, sendMessage]);

    // Handle interview end
    const handleInterviewEnd = useCallback((finalMessage: UIMessage) => {
        setInterviewState(prev => ({
            ...prev,
            isEnded: true,
            chatDisabled: true
        }));

        if (stateManager && config.interviewId) {
            stateManager.addResponse(getMessageText(finalMessage), "");

            // Save final transcript
            const responses = stateManager.getState().responses;
            fetch(`${INTERVIEW_CONSTANTS.ENDPOINTS.INTERVIEWS}/${config.interviewId}`, {
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
    }, [stateManager, config.interviewId]);

    // Handle section transition
    const handleSectionTransition = useCallback(async () => {
        if (!stateManager) return;

        try {
            if (stateManager.progressToNextSection()) {
                const currentSection = stateManager.getCurrentSection();

                // Send a system message to instruct the AI to start the new section
                await sendMessage({
                    text: `The interview has moved to the "${currentSection?.title}" section. Focus on: ${currentSection?.focusAreas.join(", ")}. Ask your first question for this new section.`,
                });

                setInterviewState(prev => ({
                    ...prev,
                    hasAutoAdvancedForSection: true,
                    lastAutoAdvancedSection: stateManager.getState().sectionIndex
                }));
            } else {
                // Interview is complete
                setInterviewState(prev => ({ ...prev, isEnded: true }));
            }
        } catch (error) {
            console.error("Error in section transition:", error);
        }
    }, [stateManager, sendMessage]);

    // Handle auto-advance
    const handleAutoAdvance = useCallback(() => {
        if (!stateManager || interviewState.autoAdvanceLock) return;

        setInterviewState(prev => ({
            ...prev,
            autoAdvancing: true,
            autoAdvanceLock: true
        }));

        setTimeout(() => {
            continueToNextSection();
            setInterviewState(prev => ({
                ...prev,
                autoAdvanceLock: false
            }));
        }, interviewState.autoTriggerDelay);
    }, [stateManager, interviewState.autoAdvanceLock, interviewState.autoTriggerDelay]);

    // Interview controls
    const startInterview = useCallback(async () => {
        console.log("startInterview called");
        setInterviewState(prev => ({ ...prev, isStarted: true }));

        try {
            console.log("Sending initial message...");
            await sendMessage({
                text: "I'm ready to start the interview.",
            });
            console.log("Initial message sent successfully");
        } catch (error) {
            console.error("Error starting interview:", error);
        }
    }, [sendMessage]);

    const nextStep = useCallback(() => {
        if (!stateManager) return;

        if (!stateManager.isInterviewComplete()) {
            if (stateManager.progressToNextSection()) {
                sendMessage({
                    text: `Moving to next section: ${stateManager.getCurrentSection()?.title}`,
                });
            } else {
                sendMessage({
                    text: "Interview complete. Thank you for your time!",
                });
            }
        }
    }, [stateManager, sendMessage]);

    const continueToNextSection = useCallback(async () => {
        if (!stateManager) return;

        setInterviewState(prev => ({ ...prev, autoAdvancing: true }));

        try {
            if (stateManager.progressToNextSection()) {
                const currentSection = stateManager.getCurrentSection();

                await sendMessage({
                    text: `Moving to next section: ${currentSection?.title}`,
                });

                setInterviewState(prev => ({
                    ...prev,
                    hasAutoAdvancedForSection: false,
                    lastAutoAdvancedSection: stateManager.getState().sectionIndex
                }));
            } else {
                setInterviewState(prev => ({ ...prev, isEnded: true }));
            }
        } catch (error) {
            console.error("Error continuing to next section:", error);
        } finally {
            setInterviewState(prev => ({ ...prev, autoAdvancing: false }));
        }
    }, [stateManager, sendMessage]);

    const analyzeCurrentSection = useCallback(async () => {
        if (!stateManager || interviewState.isAnalyzing) return;

        setInterviewState(prev => ({ ...prev, isAnalyzing: true, analysisError: null }));

        try {
            const currentSection = stateManager.getCurrentSection();
            const sectionMessages = messages.filter(msg =>
                msg.role === "user" || msg.role === "assistant"
            );

            const response = await fetch(INTERVIEW_CONSTANTS.ENDPOINTS.ANALYZE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: sectionMessages,
                    section: currentSection,
                    position: config.position,
                    interviewType: config.type,
                }),
            });

            if (!response.ok) throw new Error("Analysis failed");

            const analysis = await response.json();
            
            // Save section analysis to database if we have an interview ID
            if (config.interviewId) {
                try {
                    const saveResponse = await fetch(`${INTERVIEW_CONSTANTS.ENDPOINTS.INTERVIEWS}/${config.interviewId}/analysis`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ analysis }),
                    });

                    if (!saveResponse.ok) {
                        console.error("Failed to save section analysis to database");
                    } else {
                        console.log("Section analysis saved to database successfully");
                        
                        // Also ensure transcript is saved (but don't mark as completed for section analysis)
                        const updateResponse = await fetch(`${INTERVIEW_CONSTANTS.ENDPOINTS.INTERVIEWS}/${config.interviewId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                transcript: messages.filter(msg =>
                                    msg.role === "user" || msg.role === "assistant"
                                ),
                            }),
                        });
                        
                        if (!updateResponse.ok) {
                            console.error("Failed to save transcript");
                        } else {
                            console.log("Transcript saved successfully");
                        }
                    }
                } catch (saveError) {
                    console.error("Error saving section analysis to database:", saveError);
                }
            }
            
            setInterviewState(prev => ({
                ...prev,
                analysis,
                showAnalysis: true
            }));
        } catch (error) {
            console.error("Analysis error:", error);
            setInterviewState(prev => ({
                ...prev,
                analysisError: error instanceof Error ? error.message : "Analysis failed"
            }));
        } finally {
            setInterviewState(prev => ({ ...prev, isAnalyzing: false }));
        }
    }, [stateManager, messages, config.position, config.type, interviewState.isAnalyzing]);

    const generateAnalysis = useCallback(async () => {
        if (!stateManager || interviewState.isAnalyzing) return;

        setInterviewState(prev => ({ ...prev, isAnalyzing: true, analysisError: null }));

        try {
            const currentSection = stateManager.getCurrentSection();

            // Always analyze the entire interview when generateAnalysis is called
            const response = await fetch(INTERVIEW_CONSTANTS.ENDPOINTS.ANALYZE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interviewData: {
                        position: config.position,
                        type: config.type,
                        duration: stateManager.getState().elapsedTime || 0,
                        messages: messages.filter(msg =>
                            msg.role === "user" || msg.role === "assistant"
                        ),
                        state: stateManager.getState(),
                    },
                }),
            });

            if (!response.ok) throw new Error("Analysis failed");

            const analysis = await response.json();
            
            // Save analysis to database if we have an interview ID
            if (config.interviewId) {
                try {
                    const saveResponse = await fetch(`${INTERVIEW_CONSTANTS.ENDPOINTS.INTERVIEWS}/${config.interviewId}/analysis`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ analysis }),
                    });

                    if (!saveResponse.ok) {
                        console.error("Failed to save analysis to database");
                    } else {
                        console.log("Analysis saved to database successfully");
                        
                        // Also ensure interview is marked as completed and transcript is saved
                        const updateResponse = await fetch(`${INTERVIEW_CONSTANTS.ENDPOINTS.INTERVIEWS}/${config.interviewId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                transcript: messages.filter(msg =>
                                    msg.role === "user" || msg.role === "assistant"
                                ),
                                status: "completed",
                                completedAt: new Date().toISOString(),
                            }),
                        });
                        
                        if (!updateResponse.ok) {
                            console.error("Failed to mark interview as completed");
                        } else {
                            console.log("Interview marked as completed with transcript");
                        }
                    }
                } catch (saveError) {
                    console.error("Error saving analysis to database:", saveError);
                }
            }

            setInterviewState(prev => ({
                ...prev,
                analysis,
                showAnalysis: true
            }));
        } catch (error) {
            console.error("Analysis error:", error);
            setInterviewState(prev => ({
                ...prev,
                analysisError: error instanceof Error ? error.message : "Analysis failed"
            }));
        } finally {
            setInterviewState(prev => ({ ...prev, isAnalyzing: false }));
        }
    }, [stateManager, messages, config.position, config.type, interviewState.isAnalyzing, config.interviewId]);

    const handleFullReport = useCallback(async () => {
        if (interviewState.isAnalyzing) return;

        setInterviewState(prev => ({ ...prev, isAnalyzing: true }));

        try {
            const response = await fetch(INTERVIEW_CONSTANTS.ENDPOINTS.ANALYZE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages,
                    position: config.position,
                    interviewType: config.type,
                    fullReport: true,
                }),
            });

            if (!response.ok) throw new Error("Full report generation failed");

            const report = await response.json();
            console.log("Full report generated:", report);

            // Save full report analysis to database if we have an interview ID
            if (config.interviewId) {
                try {
                    const saveResponse = await fetch(`${INTERVIEW_CONSTANTS.ENDPOINTS.INTERVIEWS}/${config.interviewId}/analysis`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ analysis: report }),
                    });

                    if (!saveResponse.ok) {
                        console.error("Failed to save full report analysis to database");
                    } else {
                        console.log("Full report analysis saved to database successfully");
                        
                        // Also ensure interview is marked as completed and transcript is saved
                        const updateResponse = await fetch(`${INTERVIEW_CONSTANTS.ENDPOINTS.INTERVIEWS}/${config.interviewId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                transcript: messages.filter(msg =>
                                    msg.role === "user" || msg.role === "assistant"
                                ),
                                status: "completed",
                                completedAt: new Date().toISOString(),
                            }),
                        });
                        
                        if (!updateResponse.ok) {
                            console.error("Failed to mark interview as completed");
                        } else {
                            console.log("Interview marked as completed with transcript");
                        }
                    }
                } catch (saveError) {
                    console.error("Error saving full report analysis to database:", saveError);
                }
            }

            // Handle full report - redirect to history page
            router.push(`/interview/history`);
        } catch (error) {
            console.error("Full report error:", error);
        } finally {
            setInterviewState(prev => ({ ...prev, isAnalyzing: false }));
        }
    }, [messages, config.position, config.type, config.interviewId, router, interviewState.isAnalyzing]);

    // State setters
    const setAutoTriggerEnabled = useCallback((enabled: boolean) => {
        setInterviewState(prev => ({ ...prev, autoTriggerEnabled: enabled }));
    }, []);

    const setIsFlowOpen = useCallback((open: boolean) => {
        setInterviewState(prev => ({ ...prev, isFlowOpen: open }));
    }, []);

    // Metrics calculation
    const getCurrentSection = useCallback(() => {
        return stateManager?.getCurrentSection();
    }, [stateManager]);

    const getProgressPercentage = useCallback(() => {
        if (!stateManager) return 0;
        const state = stateManager.getState();
        return calculateProgressPercentage(state.sectionIndex, state.flow.sections.length);
    }, [stateManager]);

    const getTimeRemaining = useCallback(() => {
        return stateManager?.getTotalTimeRemaining() || 0;
    }, [stateManager]);

    const getSectionTimeRemaining = useCallback(() => {
        return stateManager?.getSectionTimeRemaining() || 0;
    }, [stateManager]);

    // Return organized interface
    const interviewControls: InterviewControls = {
        startInterview,
        nextStep,
        continueToNextSection,
        analyzeCurrentSection,
        generateAnalysis,
        handleFullReport,
        setAutoTriggerEnabled,
        setIsFlowOpen,
    };

    const interviewMetrics: InterviewMetrics = {
        progressPercentage: getProgressPercentage(),
        timeRemaining: getTimeRemaining(),
        sectionTimeRemaining: getSectionTimeRemaining(),
        currentSection: getCurrentSection(),
        formatDuration,
    };

    return {
        // State
        interviewState,
        stateManager,
        messagesEndRef,

        // Chat functionality (v5 compatible)
        messages,
        setMessages,
        sendMessage,
        status,
        error,
        clearError,
        isLoading: status === 'streaming',

        // Organized interfaces
        controls: interviewControls,
        metrics: interviewMetrics,

        // Direct access for flexibility
        setInterviewState,
    };
}; 