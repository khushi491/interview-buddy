import connectDB from './mongodb';
import Interview from './models/Interview';
import Resume from './models/Resume';

// MongoDB-based storage to replace in-memory functionality
export interface Interview {
    id: string;
    userId: string;
    type: string;
    position: string;
    interviewType: string;
    flow: any;
    cvText?: string;
    mode: string;
    transcript: any;
    status: string;
    currentSectionIndex: number;
    resumeId?: string;
    difficulty?: string;
    jobDescription?: string;
    metadata?: any;
    createdAt: string;
    completedAt?: string;
    duration?: number;
    score?: number;
    feedback?: string;
}

export interface Resume {
    id: string;
    userId: string;
    content: string;
    filename?: string;
    fileSize?: number;
    mimeType?: string;
    createdAt: string;
}

class MongoDBStorage {
    // Interview methods
    async createInterview(data: Omit<Interview, 'id' | 'createdAt'>): Promise<Interview> {
        await connectDB();

        const interview = new Interview({
            userId: data.userId,
            type: data.type,
            position: data.position,
            interviewType: data.interviewType,
            flow: data.flow,
            cvText: data.cvText,
            mode: data.mode,
            transcript: data.transcript,
            status: data.status,
            currentSectionIndex: data.currentSectionIndex,
            resumeId: data.resumeId,
            difficulty: data.difficulty,
            jobDescription: data.jobDescription,
            metadata: data.metadata,
        });

        const savedInterview = await interview.save();

        // Convert to the expected format
        return {
            id: savedInterview._id.toString(),
            userId: savedInterview.userId,
            type: savedInterview.type,
            position: savedInterview.position,
            interviewType: savedInterview.interviewType,
            flow: savedInterview.flow,
            cvText: savedInterview.cvText,
            mode: savedInterview.mode,
            transcript: savedInterview.transcript,
            status: savedInterview.status,
            currentSectionIndex: savedInterview.currentSectionIndex,
            resumeId: savedInterview.resumeId,
            difficulty: savedInterview.difficulty,
            jobDescription: savedInterview.jobDescription,
            metadata: savedInterview.metadata,
            createdAt: savedInterview.createdAt.toISOString(),
            completedAt: savedInterview.completedAt?.toISOString(),
            duration: savedInterview.duration,
            score: savedInterview.score,
            feedback: savedInterview.feedback,
        };
    }

    async getInterviewById(id: string): Promise<Interview | null> {
        await connectDB();

        const interview = await Interview.findById(id);
        if (!interview) return null;

        return {
            id: interview._id.toString(),
            userId: interview.userId,
            type: interview.type,
            position: interview.position,
            interviewType: interview.interviewType,
            flow: interview.flow,
            cvText: interview.cvText,
            mode: interview.mode,
            transcript: interview.transcript,
            status: interview.status,
            currentSectionIndex: interview.currentSectionIndex,
            resumeId: interview.resumeId,
            difficulty: interview.difficulty,
            jobDescription: interview.jobDescription,
            metadata: interview.metadata,
            createdAt: interview.createdAt.toISOString(),
            completedAt: interview.completedAt?.toISOString(),
            duration: interview.duration,
            score: interview.score,
            feedback: interview.feedback,
        };
    }

    async getInterviewsByUserId(userId: string): Promise<Interview[]> {
        await connectDB();

        const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });

        return interviews.map(interview => ({
            id: interview._id.toString(),
            userId: interview.userId,
            type: interview.type,
            position: interview.position,
            interviewType: interview.interviewType,
            flow: interview.flow,
            cvText: interview.cvText,
            mode: interview.mode,
            transcript: interview.transcript,
            status: interview.status,
            currentSectionIndex: interview.currentSectionIndex,
            resumeId: interview.resumeId,
            difficulty: interview.difficulty,
            jobDescription: interview.jobDescription,
            metadata: interview.metadata,
            createdAt: interview.createdAt.toISOString(),
            completedAt: interview.completedAt?.toISOString(),
            duration: interview.duration,
            score: interview.score,
            feedback: interview.feedback,
        }));
    }

    async getAllInterviews(): Promise<Interview[]> {
        await connectDB();

        const interviews = await Interview.find().sort({ createdAt: -1 });

        return interviews.map(interview => ({
            id: interview._id.toString(),
            userId: interview.userId,
            type: interview.type,
            position: interview.position,
            interviewType: interview.interviewType,
            flow: interview.flow,
            cvText: interview.cvText,
            mode: interview.mode,
            transcript: interview.transcript,
            status: interview.status,
            currentSectionIndex: interview.currentSectionIndex,
            resumeId: interview.resumeId,
            difficulty: interview.difficulty,
            jobDescription: interview.jobDescription,
            metadata: interview.metadata,
            createdAt: interview.createdAt.toISOString(),
            completedAt: interview.completedAt?.toISOString(),
            duration: interview.duration,
            score: interview.score,
            feedback: interview.feedback,
        }));
    }

    async updateInterview(id: string, data: Partial<Interview>): Promise<Interview | null> {
        await connectDB();

        const interview = await Interview.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true }
        );

        if (!interview) return null;

        return {
            id: interview._id.toString(),
            userId: interview.userId,
            type: interview.type,
            position: interview.position,
            interviewType: interview.interviewType,
            flow: interview.flow,
            cvText: interview.cvText,
            mode: interview.mode,
            transcript: interview.transcript,
            status: interview.status,
            currentSectionIndex: interview.currentSectionIndex,
            resumeId: interview.resumeId,
            difficulty: interview.difficulty,
            jobDescription: interview.jobDescription,
            metadata: interview.metadata,
            createdAt: interview.createdAt.toISOString(),
            completedAt: interview.completedAt?.toISOString(),
            duration: interview.duration,
            score: interview.score,
            feedback: interview.feedback,
        };
    }

    async deleteInterview(id: string): Promise<boolean> {
        await connectDB();

        const result = await Interview.findByIdAndDelete(id);
        return !!result;
    }

    // Resume methods
    async createResume(userId: string, content: string, filename?: string, fileSize?: number, mimeType?: string): Promise<Resume> {
        await connectDB();

        const resume = new Resume({
            userId,
            content,
            filename,
            fileSize,
            mimeType,
        });

        const savedResume = await resume.save();

        return {
            id: savedResume._id.toString(),
            userId: savedResume.userId,
            content: savedResume.content,
            filename: savedResume.filename,
            fileSize: savedResume.fileSize,
            mimeType: savedResume.mimeType,
            createdAt: savedResume.createdAt.toISOString(),
        };
    }

    async getResumeById(id: string): Promise<Resume | null> {
        await connectDB();

        const resume = await Resume.findById(id);
        if (!resume) return null;

        return {
            id: resume._id.toString(),
            userId: resume.userId,
            content: resume.content,
            filename: resume.filename,
            fileSize: resume.fileSize,
            mimeType: resume.mimeType,
            createdAt: resume.createdAt.toISOString(),
        };
    }

    async getResumesByUserId(userId: string): Promise<Resume[]> {
        await connectDB();

        const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });

        return resumes.map(resume => ({
            id: resume._id.toString(),
            userId: resume.userId,
            content: resume.content,
            filename: resume.filename,
            fileSize: resume.fileSize,
            mimeType: resume.mimeType,
            createdAt: resume.createdAt.toISOString(),
        }));
    }

    // Utility methods
    async clearUserData(userId: string): Promise<void> {
        await connectDB();

        await Interview.deleteMany({ userId });
        await Resume.deleteMany({ userId });
    }

    // Get storage stats (for debugging)
    async getStats() {
        await connectDB();

        const [totalInterviews, totalResumes, totalUsers] = await Promise.all([
            Interview.countDocuments(),
            Resume.countDocuments(),
            Interview.distinct('userId').then(users => users.length),
        ]);

        return {
            totalInterviews,
            totalResumes,
            totalUsers,
        };
    }
}

// Export singleton instance
export const storage = new MongoDBStorage();
