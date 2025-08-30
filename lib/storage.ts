// Simple in-memory storage to replace database functionality
interface Interview {
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
    createdAt: string;
    completedAt?: string;
    duration?: number;
    score?: number;
    feedback?: string;
}

interface Resume {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
}

class InMemoryStorage {
    private interviews: Map<string, Interview> = new Map();
    private resumes: Map<string, Resume> = new Map();
    private userInterviews: Map<string, string[]> = new Map(); // userId -> interviewIds[]
    private userResumes: Map<string, Resume[]> = new Map(); // userId -> resumeIds[]

    // Interview methods
    async createInterview(data: Omit<Interview, 'id' | 'createdAt'>): Promise<Interview> {
        const id = `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const interview: Interview = {
            ...data,
            id,
            createdAt: new Date().toISOString(),
        };

        this.interviews.set(id, interview);

        // Track user's interviews
        if (!this.userInterviews.has(data.userId)) {
            this.userInterviews.set(data.userId, []);
        }
        this.userInterviews.get(data.userId)!.push(id);

        return interview;
    }

    async getInterviewById(id: string): Promise<Interview | null> {
        return this.interviews.get(id) || null;
    }

    async getInterviewsByUserId(userId: string): Promise<Interview[]> {
        const interviewIds = this.userInterviews.get(userId) || [];
        return interviewIds
            .map(id => this.interviews.get(id))
            .filter(Boolean) as Interview[];
    }

    async getAllInterviews(): Promise<Interview[]> {
        return Array.from(this.interviews.values());
    }

    async updateInterview(id: string, data: Partial<Interview>): Promise<Interview | null> {
        const interview = this.interviews.get(id);
        if (!interview) return null;

        const updatedInterview = { ...interview, ...data };
        this.interviews.set(id, updatedInterview);
        return updatedInterview;
    }

    async deleteInterview(id: string): Promise<boolean> {
        const interview = this.interviews.get(id);
        if (!interview) return false;

        // Remove from user's interview list
        const userInterviews = this.userInterviews.get(interview.userId);
        if (userInterviews) {
            const index = userInterviews.indexOf(id);
            if (index > -1) {
                userInterviews.splice(index, 1);
            }
        }

        this.interviews.delete(id);
        return true;
    }

    // Resume methods
    async createResume(userId: string, content: string): Promise<Resume> {
        const id = `resume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const resume: Resume = {
            id,
            userId,
            content,
            createdAt: new Date().toISOString(),
        };

        this.resumes.set(id, resume);

        // Track user's resumes
        if (!this.userResumes.has(userId)) {
            this.userResumes.set(userId, []);
        }
        this.userResumes.get(userId)!.push(resume);

        return resume;
    }

    async getResumeById(id: string): Promise<Resume | null> {
        return this.resumes.get(id) || null;
    }

    async getResumesByUserId(userId: string): Promise<Resume[]> {
        const resumeIds = this.userResumes.get(userId) || [];
        return resumeIds
            .map(id => this.resumes.get(id))
            .filter(Boolean) as Resume[];
    }

    // Utility methods
    async clearUserData(userId: string): Promise<void> {
        // Remove user's interviews
        const interviewIds = this.userInterviews.get(userId) || [];
        interviewIds.forEach(id => this.interviews.delete(id));
        this.userInterviews.delete(userId);

        // Remove user's resumes
        const resumeIds = this.userResumes.get(userId) || [];
        resumeIds.forEach(id => this.resumes.delete(id));
        this.userResumes.delete(userId);
    }

    // Get storage stats (for debugging)
    getStats() {
        return {
            totalInterviews: this.interviews.size,
            totalResumes: this.resumes.size,
            totalUsers: this.userInterviews.size,
        };
    }
}

// Export singleton instance
export const storage = new InMemoryStorage();

// Export types for use in other files
export type { Interview, Resume };
