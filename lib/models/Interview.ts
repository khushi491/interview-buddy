import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['TEXT', 'AUDIO', 'VIDEO'],
    },
    position: {
        type: String,
        required: true,
    },
    interviewType: {
        type: String,
        required: true,
        enum: ['technical', 'behavioral', 'system-design', 'cultural-fit', 'leadership'],
    },
    flow: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    cvText: {
        type: String,
    },
    mode: {
        type: String,
        required: true,
        enum: ['text', 'video'],
    },
    transcript: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    status: {
        type: String,
        required: true,
        enum: ['in_progress', 'completed', 'paused'],
        default: 'in_progress',
    },
    currentSectionIndex: {
        type: Number,
        default: 0,
    },
    resumeId: {
        type: String,
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    jobDescription: {
        type: String,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: {
        type: Date,
    },
    duration: {
        type: Number,
    },
    score: {
        type: Number,
    },
    feedback: {
        type: String,
    },
}, {
    timestamps: true,
});

// Create indexes for better query performance
InterviewSchema.index({ userId: 1, createdAt: -1 });
InterviewSchema.index({ status: 1 });

export default mongoose.models.Interview || mongoose.model('Interview', InterviewSchema);
