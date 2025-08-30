import { InterviewFlow } from "./interview-state";

export type InterviewMode = "text" | "video";

export interface InterviewConfig {
    position: string;
    type: string;
    candidateName: string;
    mode: InterviewMode;
    difficulty?: "easy" | "medium" | "hard";
    flow?: InterviewFlow;
    jobDescription?: string;
    interviewId?: string;
}

export interface InterviewState {
    isStarted: boolean;
    isEnded: boolean;
    isAnalyzing: boolean;
    analysisError: string | null;
    autoAdvancing: boolean;
    sectionComplete: boolean;
    showContinueButton: boolean;
    chatDisabled: boolean;
    autoTriggerEnabled: boolean;
    autoTriggerDelay: number;
    isRestoring: boolean;
    lastAutoAdvancedSection: number | null;
    hasAutoAdvancedForSection: boolean;
    lastAIContent: string | null;
    startTime: Date;
    autoAdvanceLock: boolean;
    isResumedInterview: boolean;
    flowStateUpdated: boolean;
    isFlowOpen: boolean;
    showAnalysis: boolean;
    analysis: any;
}

export interface InterviewControls {
    startInterview: () => Promise<void>;
    nextStep: () => void;
    continueToNextSection: () => Promise<void>;
    analyzeCurrentSection: () => Promise<void>;
    generateAnalysis: () => Promise<void>;
    handleFullReport: () => Promise<void>;
    setAutoTriggerEnabled: (enabled: boolean) => void;
    setIsFlowOpen: (open: boolean) => void;
}

export interface InterviewMetrics {
    progressPercentage: number;
    timeRemaining: number;
    sectionTimeRemaining: number;
    currentSection: any;
    formatDuration: (minutes: number) => string;
}

export interface InterviewMessages {
    messages: any[];
    input: string;
    isLoading: boolean;
    handleInputChange: (e: any) => void;
    handleSubmit: (e: any) => void;
    setMessages: (messages: any[]) => void;
    append: (message: any) => Promise<void>;
}

export interface BaseInterviewRoomProps {
    config: InterviewConfig;
    cvText?: string;
}

export interface InterviewHeaderProps {
    config: InterviewConfig;
    currentSection: any;
    progressPercentage: number;
    timeRemaining: number;
    sectionTimeRemaining: number;
    interviewStarted: boolean;
    formatDuration: (minutes: number) => string;
    autoTriggerEnabled: boolean;
    setAutoTriggerEnabled: (enabled: boolean) => void;
    analysisError: string | null;
    isAnalyzing: boolean;
    generateAnalysis: () => Promise<void>;
    nextStep: () => void;
}

export interface InterviewFlowPanelProps {
    stateManager: any;
    isOpen: boolean;
    onToggle: (open: boolean) => void;
}

export interface InterviewControlsProps {
    config: InterviewConfig;
    currentSection: any;
    messages: any[];
    analysisError: string | null;
    isAnalyzing: boolean;
    generateAnalysis: () => Promise<void>;
    nextStep: () => void;
    autoTriggerEnabled: boolean;
    setAutoTriggerEnabled: (enabled: boolean) => void;
}

export interface InterviewAnalysisPanelProps {
    analysis: any;
    isVisible: boolean;
    onClose: () => void;
    isAnalyzing: boolean;
    error: string | null;
}

export interface InterviewWelcomeStateProps {
    currentSection: any;
    isResumedInterview: boolean;
    stateManager: any;
    onStart: () => Promise<void>;
}

export interface InterviewLoadingStateProps {
    currentSection: any;
}

export interface InterviewCompleteStateProps {
    onGenerateAnalysis: () => Promise<void>;
    isAnalyzing: boolean;
} 