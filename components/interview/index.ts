// Base components
export { BaseInterviewRoom } from "./base-interview-room";
export { InterviewHeader } from "./interview-header";
export { InterviewFlowPanel } from "./interview-flow-panel";

// Mode-specific components
export { ChatInterviewRoom } from "../chat-interview/chat-interview-room";
export { VideoInterviewRoom } from "../video-interview/video-interview-room";

// Integration test
export { InterviewIntegrationTest } from "./integration-test";

// Types and utilities
export type {
    InterviewConfig,
    InterviewMode,
    InterviewState,
    InterviewControls,
    InterviewMetrics,
    InterviewMessages,
    BaseInterviewRoomProps,
    InterviewHeaderProps,
    InterviewFlowPanelProps,
} from "@/lib/interview-types";

export { INTERVIEW_CONSTANTS, INTERVIEW_MODES, INTERVIEW_STATUS } from "@/lib/interview-constants";

export {
    formatDuration,
    calculateProgressPercentage,
    getRoomGradient,
    shouldAutoAdvance,
    generateInterviewId,
    sanitizeInterviewText,
    truncateText,
    getSectionStatus,
    formatTimestamp,
    calculateTimeElapsed,
    isInterviewEnding,
    getMessageStyling,
    validateInterviewConfig,
    getModeDisplayName,
    debounce,
} from "@/lib/interview-utils";

// Hook
export { useInterviewState } from "@/hooks/use-interview-state"; 