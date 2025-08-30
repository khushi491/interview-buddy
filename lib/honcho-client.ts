import { Honcho } from '@honcho-ai/sdk';

// Initialize Honcho client with demo server
// export const honchoClient = new Honcho({
//     baseURL: process.env.HONCHO_BASE_URL || 'https://demo.honcho.dev',
//     environment: process.env.HONCHO_ENVIRONMENT || 'demo'
// });

export const honchoClient = new Honcho({ baseURL: 'https://demo.honcho.dev', environment: 'demo' });

// Interviewer personas
export const INTERVIEWER_PERSONAS = {
    SOFT: {
        id: 'soft_interviewer',
        name: 'Jordan',
        role: 'Behavioral Interviewer',
        description: 'Empathetic, encouraging, and supportive. Focuses on cultural fit, communication skills, and team dynamics.',
        personality: 'warm, understanding, collaborative',
        color: 'blue',
        avatar: '😊'
    },
    HARD: {
        id: 'hard_interviewer',
        name: 'Alex',
        role: 'Technical Interviewer',
        description: 'Direct, challenging, and analytical. Focuses on technical skills, problem-solving, and critical thinking.',
        personality: 'analytical, direct, challenging',
        color: 'red',
        avatar: '🤔'
    }
} as const;

// Honcho workspace and session management
export class HonchoInterviewManager {
    private workspaceId: string;
    private sessionId: string | null = null;
    private candidatePeerId: string | null = null;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    // Initialize workspace and peers
    async initializeWorkspace() {
        try {
            // Create or get workspace
            const workspace = await honchoClient.apps.workspaces.create({
                name: this.workspaceId
            });

            // Create interviewer peers
            await Promise.all([
                honchoClient.apps.workspaces.peers.create(this.workspaceId, {
                    name: INTERVIEWER_PERSONAS.SOFT.id,
                    persona: `You are ${INTERVIEWER_PERSONAS.SOFT.name}, a ${INTERVIEWER_PERSONAS.SOFT.role}. ${INTERVIEWER_PERSONAS.SOFT.description} Your personality is ${INTERVIEWER_PERSONAS.SOFT.personality}.`
                }),
                honchoClient.apps.workspaces.peers.create(this.workspaceId, {
                    name: INTERVIEWER_PERSONAS.HARD.id,
                    persona: `You are ${INTERVIEWER_PERSONAS.HARD.name}, a ${INTERVIEWER_PERSONAS.HARD.role}. ${INTERVIEWER_PERSONAS.HARD.description} Your personality is ${INTERVIEWER_PERSONAS.HARD.personality}.`
                })
            ]);

            console.log('Honcho workspace initialized:', this.workspaceId);
            return workspace;
        } catch (error) {
            console.error('Error initializing Honcho workspace:', error);
            throw error;
        }
    }

    // Create interview session with candidate
    async createSession(candidateId: string, interviewMetadata: any) {
        try {
            // Create candidate peer if not exists
            this.candidatePeerId = candidateId;
            await honchoClient.apps.workspaces.peers.create(this.workspaceId, {
                name: candidateId,
                persona: `You are a job candidate being interviewed for the position of ${interviewMetadata.position}.`
            });

            // Create session with all peers
            const session = await honchoClient.apps.workspaces.sessions.create(this.workspaceId, {
                metadata: {
                    position: interviewMetadata.position,
                    interviewType: interviewMetadata.interviewType,
                    startTime: new Date().toISOString(),
                    ...interviewMetadata
                }
            });

            this.sessionId = session.id;
            console.log('Honcho session created:', this.sessionId);
            return session;
        } catch (error) {
            console.error('Error creating Honcho session:', error);
            throw error;
        }
    }

    // Add message to session
    async addMessage(peerId: string, content: string, isUser: boolean = false) {
        if (!this.sessionId) {
            throw new Error('Session not initialized');
        }

        try {
            const message = await honchoClient.apps.workspaces.sessions.messages.create(
                this.workspaceId,
                this.sessionId,
                {
                    content,
                    is_user: isUser,
                    metadata: {
                        peer_id: peerId,
                        timestamp: new Date().toISOString()
                    }
                }
            );
            return message;
        } catch (error) {
            console.error('Error adding message to Honcho:', error);
            throw error;
        }
    }

    // Get personalized response using Dialectic API
    async getPersonalizedResponse(peerId: string, query: string) {
        if (!this.sessionId) {
            throw new Error('Session not initialized');
        }

        try {
            const response = await honchoClient.apps.workspaces.sessions.chat(
                this.workspaceId,
                this.sessionId,
                {
                    query,
                    metadata: {
                        peer_id: peerId
                    }
                }
            );
            return response;
        } catch (error) {
            console.error('Error getting personalized response:', error);
            throw error;
        }
    }

    // Get session history
    async getSessionHistory() {
        if (!this.sessionId) {
            throw new Error('Session not initialized');
        }

        try {
            const messages = await honchoClient.apps.workspaces.sessions.messages.list(
                this.workspaceId,
                this.sessionId
            );
            return messages;
        } catch (error) {
            console.error('Error getting session history:', error);
            throw error;
        }
    }

    // Get learned facts about candidate
    async getCandidateFacts() {
        if (!this.candidatePeerId) {
            throw new Error('Candidate peer not initialized');
        }

        try {
            const facts = await honchoClient.apps.workspaces.peers.facts.list(
                this.workspaceId,
                this.candidatePeerId
            );
            return facts;
        } catch (error) {
            console.error('Error getting candidate facts:', error);
            return [];
        }
    }

    // Close session
    async closeSession() {
        if (this.sessionId) {
            try {
                await honchoClient.apps.workspaces.sessions.update(
                    this.workspaceId,
                    this.sessionId,
                    {
                        metadata: {
                            endTime: new Date().toISOString(),
                            status: 'completed'
                        }
                    }
                );
                console.log('Honcho session closed:', this.sessionId);
            } catch (error) {
                console.error('Error closing Honcho session:', error);
            }
        }
    }

    getSessionId() {
        return this.sessionId;
    }
}
