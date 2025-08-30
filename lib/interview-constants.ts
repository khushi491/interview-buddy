export const INTERVIEW_CONSTANTS = {
    // Timing
    DEFAULT_INTERVIEW_DURATION: 25, // minutes
    AUTO_TRIGGER_DELAY: 10000, // milliseconds (increased to 10 seconds)
    SECTION_TIMEOUT: 10, // minutes per section

    // UI
    FLOW_PANEL_WIDTH: 256, // pixels
    MESSAGE_MAX_WIDTH: "75%",
    HEADER_HEIGHT: 80, // pixels

    // Animation
    TRANSITION_DURATION: 300, // milliseconds
    FADE_DURATION: 200, // milliseconds

    // Colors
    COLORS: {
        PRIMARY: "from-blue-500 to-purple-600",
        SUCCESS: "from-green-500 to-emerald-600",
        WARNING: "from-yellow-500 to-orange-600",
        ERROR: "from-red-500 to-pink-600",
        NEUTRAL: "from-gray-500 to-slate-600",
    },

    // Gradients
    GRADIENTS: {
        LOADING: "from-indigo-900/20 via-slate-900/10 to-blue-900/20",
        WELCOME: "from-blue-900/20 via-slate-900/10 to-purple-900/20",
        ACTIVE: "from-emerald-900/20 via-slate-900/10 to-teal-900/20",
        DEFAULT: "from-slate-900/20 via-gray-900/10 to-slate-900/20",
    },

    // Steps
    STEPS: [
        { name: "Opening", icon: "Coffee", color: "amber" },
        { name: "Background", icon: "User", color: "blue" },
        { name: "Technical", icon: "Lightbulb", color: "purple" },
        { name: "Problem Solving", icon: "Settings", color: "green" },
        { name: "Closing", icon: "Building", color: "indigo" },
    ],

    // Messages
    MESSAGES: {
        WELCOME: "Take a moment to collect your thoughts. When you're ready, we'll begin this section.",
        LOADING: "Preparing your personalized interview questions.",
        COMPLETE: "Interview complete! You can view your analysis report.",
        SECTION_COMPLETE: "Section complete! Use the buttons above to continue or review your performance.",
        ANALYSIS_FAILED: "Analysis failed",
        THINKING: "Thinking about your response...",
        MOVING_NEXT: "Moving to next section...",
        CONTINUING: "Continuing...",
        GENERATING: "Generating...",
        ANALYZING: "Analyzing...",
    },

    // API Endpoints
    ENDPOINTS: {
        CHAT: "/api/chat",
        ANALYZE: "/api/analyze",
        INTERVIEWS: "/api/interviews",
        AUDIO_TRANSCRIBE: "/api/audio/transcribe",
    },
} as const;

export const INTERVIEW_MODES = {
    TEXT: "text",
    VIDEO: "video",
} as const;

export const INTERVIEW_STATUS = {
    PENDING: "pending",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
} as const; 