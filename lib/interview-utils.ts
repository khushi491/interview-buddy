import { INTERVIEW_CONSTANTS } from "./interview-constants";

/**
 * Format duration in minutes to MM:SS format
 */
export const formatDuration = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Calculate progress percentage based on current section and total sections
 */
export const calculateProgressPercentage = (currentIndex: number, totalSections: number): number => {
    if (totalSections === 0) return 0;
    return ((currentIndex + 1) / totalSections) * 100;
};

/**
 * Get room gradient based on interview state
 */
export const getRoomGradient = (isLoading: boolean, messagesCount: number): string => {
    if (isLoading) return INTERVIEW_CONSTANTS.GRADIENTS.LOADING;
    if (messagesCount === 0) return INTERVIEW_CONSTANTS.GRADIENTS.WELCOME;
    if (messagesCount > 6) return INTERVIEW_CONSTANTS.GRADIENTS.ACTIVE;
    return INTERVIEW_CONSTANTS.GRADIENTS.DEFAULT;
};

/**
 * Check if interview should auto-advance
 */
export const shouldAutoAdvance = (
    autoTriggerEnabled: boolean,
    hasAutoAdvancedForSection: boolean,
    messagesCount: number,
    hasUserResponded: boolean = false
): boolean => {
    // Only auto-advance if:
    // 1. Auto-trigger is enabled
    // 2. Hasn't already auto-advanced for this section
    // 3. Has enough messages (at least 3: initial + AI response + user response)
    // 4. User has provided a response
    return autoTriggerEnabled && 
           !hasAutoAdvancedForSection && 
           messagesCount >= 3 && 
           hasUserResponded;
};

/**
 * Generate unique ID for interview elements
 */
export const generateInterviewId = (): string => {
    return `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitize interview text for display
 */
export const sanitizeInterviewText = (text: string): string => {
    return text
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .trim();
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Get section status (active, completed, upcoming)
 */
export const getSectionStatus = (currentIndex: number, sectionIndex: number) => {
    if (sectionIndex === currentIndex) return 'active';
    if (sectionIndex < currentIndex) return 'completed';
    return 'upcoming';
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Calculate time elapsed since start
 */
export const calculateTimeElapsed = (startTime: Date): number => {
    return Math.floor((Date.now() - startTime.getTime()) / 1000);
};

/**
 * Check if interview is in final stages
 */
export const isInterviewEnding = (messagesCount: number, timeRemaining: number): boolean => {
    return messagesCount > 10 || timeRemaining < 5; // 5 minutes remaining
};

/**
 * Get appropriate message styling based on role
 */
export const getMessageStyling = (role: 'user' | 'assistant') => {
    return {
        container: role === 'user'
            ? 'justify-end'
            : 'justify-start',
        bubble: role === 'user'
            ? 'bg-primary text-primary-foreground shadow-lg'
            : 'bg-gray-50 text-gray-800 border border-gray-100',
        label: role === 'user'
            ? 'text-blue-100'
            : 'text-gray-500',
        labelText: role === 'user' ? 'You' : 'Interviewer'
    };
};

/**
 * Validate interview configuration
 */
export const validateInterviewConfig = (config: any): boolean => {
    const requiredFields = ['position', 'type', 'candidateName', 'mode'];
    return requiredFields.every(field => config[field]);
};

/**
 * Get interview mode display name
 */
export const getModeDisplayName = (mode: string): string => {
    const modeNames = {
        text: 'Text Interview',
        audio: 'Voice Interview',
        video: 'Video Interview'
    };
    return modeNames[mode as keyof typeof modeNames] || 'Interview';
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}; 