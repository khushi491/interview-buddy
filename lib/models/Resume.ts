import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    content: {
        type: String,
        required: true,
    },
    filename: {
        type: String,
    },
    fileSize: {
        type: Number,
    },
    mimeType: {
        type: String,
    },
}, {
    timestamps: true,
});

// Create indexes for better query performance
ResumeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);
