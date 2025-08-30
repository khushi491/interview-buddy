import { openai } from "@ai-sdk/openai"
import { streamText, convertToModelMessages } from "ai"
import { InterviewStateManager } from "@/lib/interview-state"
import { HonchoInterviewManager, INTERVIEWER_PERSONAS } from "@/lib/honcho-client"

export const maxDuration = 30

export async function POST(req: Request) {
    const { messages, interviewState, honchoWorkspaceId, candidateId } = await req.json()

    console.log("Collaborative Chat API called with:", {
        messages: messages?.length,
        interviewState: !!interviewState,
        honchoWorkspaceId,
        candidateId
    });

    // Initialize Honcho manager
    let honchoManager: HonchoInterviewManager | null = null;
    if (honchoWorkspaceId) {
        try {
            honchoManager = new HonchoInterviewManager(honchoWorkspaceId);
            await honchoManager.initializeWorkspace();

            // Create or resume session
            if (!honchoManager.getSessionId()) {
                await honchoManager.createSession(candidateId || `candidate-${Date.now()}`, {
                    position: interviewState.position,
                    interviewType: interviewState.interviewType,
                    mode: 'collaborative',
                    cvText: interviewState.cvText,
                    jobDescription: interviewState.jobDescription
                });
            }
        } catch (error) {
            console.error("Error initializing Honcho:", error);
            // Continue without Honcho if it fails
            honchoManager = null;
        }
    }

    // Reconstruct the state manager from the provided state
    const stateManager = new InterviewStateManager(
        interviewState.flow,
        interviewState.position,
        interviewState.interviewType,
        interviewState.cvText,
        interviewState.jobDescription
    );

    // Update the state with current data
    Object.assign(stateManager, { state: interviewState });
    stateManager.updateElapsedTime();

    const currentSection = stateManager.getCurrentSection();
    const isFirstMessage = messages.length === 1 && messages[0].role === 'user';
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Get candidate facts from Honcho if available
    let candidateFacts = '';
    if (honchoManager) {
        try {
            const facts = await honchoManager.getCandidateFacts();
            if (facts && facts.length > 0) {
                candidateFacts = `\nCandidate Facts Learned:\n${facts.map(f => `- ${f.content}`).join('\n')}`;
            }
        } catch (error) {
            console.error("Error getting candidate facts:", error);
        }
    }

    // Determine which interviewer should respond or if it should be collaborative
    const shouldBeCollaborative = determineCollaborativeResponse(lastUserMessage, currentSection, messages);
    const primaryInterviewer = determinePrimaryInterviewer(currentSection, messages);

    let systemPrompt = '';

    if (shouldBeCollaborative) {
        // Both interviewers collaborate on the response
        systemPrompt = `You are part of a collaborative AI interview panel for a ${interviewState.position} position. There are two interviewers working together:

Jordan (Behavioral Interviewer): Empathetic and supportive, focuses on cultural fit and communication skills.
Alex (Technical Interviewer): Analytical and challenging, focuses on technical skills and problem-solving.

${stateManager.getInterviewContext()}

${stateManager.getSectionContext()}

${candidateFacts}

IMPORTANT: You must respond as BOTH interviewers in a natural conversation. Use this exact format:

**Jordan:** [Jordan's empathetic, supportive response]

**Alex:** [Alex's analytical, challenging response]

Guidelines:
- Jordan focuses on soft skills, team dynamics, and encouragement
- Alex focuses on technical depth and challenging questions
- Build on each other's points naturally
- Keep responses conversational and engaging
- Don't repeat the formatting instructions

${isFirstMessage ? `This is the start of the interview. Both interviewers should introduce themselves warmly and professionally.` : 'Both interviewers should respond to the candidate\'s answer with follow-up questions or comments.'}`;

    } else {
        // Single interviewer response
        const interviewer = primaryInterviewer === 'soft' ? INTERVIEWER_PERSONAS.SOFT : INTERVIEWER_PERSONAS.HARD;

        systemPrompt = `You are ${interviewer.name}, a ${interviewer.role} conducting an interview for a ${interviewState.position} position.

Your personality: ${interviewer.personality}
Your focus: ${interviewer.description}

${stateManager.getInterviewContext()}

${stateManager.getSectionContext()}

${candidateFacts}

${interviewer.id === 'soft_interviewer' ? `
As Jordan, you focus on:
- Cultural fit and team dynamics
- Communication and collaboration skills
- Work-life balance and values
- Leadership and conflict resolution
- Be supportive and encouraging while thorough
` : `
As Alex, you focus on:
- Technical skills and problem-solving
- Analytical thinking and methodology
- System design and architecture
- Challenge assumptions and push for details
- Be direct and analytical while professional
`}

${isFirstMessage ? `Introduce yourself professionally and ask your first question.` : 'Respond naturally to the candidate based on their answer.'}

IMPORTANT: Format your response as:
**${interviewer.name}:** [Your natural response]

Do not include any formatting instructions in your response.`;
    }

    // Add section transition logic
    if (stateManager.shouldAutoAdvance()) {
        systemPrompt += `\n\nIMPORTANT - Section Transitions:
The current section appears complete. Use one of these phrases to transition to the next section:
- "Let's move on to the next section"
- "Let's continue to the next section"  
- "Are you ready to continue to the next section?"`;
    }

    // Add CV and job description context
    if (interviewState.cvText) {
        systemPrompt += `\n\nCandidate Background:\n${interviewState.cvText.substring(0, 1000)}...`;
    }

    if (interviewState.jobDescription) {
        systemPrompt += `\n\nRole Requirements:\n${interviewState.jobDescription.substring(0, 1000)}...`;
    }

    // Add conversation variety instructions
    systemPrompt += `\n\nConversation Guidelines:
- Keep responses natural and conversational
- Avoid repeating similar questions or phrases
- Build on previous answers organically
- Show genuine interest in the candidate's responses
- Use varied question types (open-ended, scenario-based, specific)`;

    console.log("System prompt for collaborative interview:", systemPrompt.substring(0, 500) + "...");

    // Store the user message in Honcho
    if (honchoManager && lastUserMessage) {
        try {
            await honchoManager.addMessage(candidateId || 'candidate', lastUserMessage, true);
        } catch (error) {
            console.error("Error storing user message in Honcho:", error);
        }
    }

    // Convert UIMessages to ModelMessages for the AI SDK
    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        messages: modelMessages,
    });

    return result.toUIMessageStreamResponse({
        originalMessages: messages,
        onFinish: async ({ messages, responseMessage }) => {
            console.log("Collaborative stream finished");

            // Validate and clean the response
            if (responseMessage?.content) {
                let cleanedContent = responseMessage.content;

                // Remove any leaked formatting instructions
                const instructionPatterns = [
                    /IMPORTANT:.*?(?=\*\*|$)/gs,
                    /Format your response as:.*?(?=\*\*|$)/gs,
                    /Do not include.*?(?=\*\*|$)/gs,
                    /Guidelines:.*?(?=\*\*|$)/gs,
                    /COLLABORATIVE MODE:.*?(?=\*\*|$)/gs,
                ];

                instructionPatterns.forEach(pattern => {
                    cleanedContent = cleanedContent.replace(pattern, '');
                });

                // Clean up extra whitespace
                cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

                // Update the message content if it was cleaned
                if (cleanedContent !== responseMessage.content) {
                    console.log("Cleaned response content to remove formatting instructions");
                    responseMessage.content = cleanedContent;
                }
            }

            // Store the AI response in Honcho
            if (honchoManager && responseMessage?.content) {
                try {
                    const interviewerId = shouldBeCollaborative ? 'collaborative' : primaryInterviewer === 'soft' ? 'soft_interviewer' : 'hard_interviewer';
                    await honchoManager.addMessage(interviewerId, responseMessage.content, false);
                } catch (error) {
                    console.error("Error storing AI response in Honcho:", error);
                }
            }
        },
    });
}

// Determine if response should be collaborative (both interviewers)
function determineCollaborativeResponse(userMessage: string, currentSection: any, messages: any[]): boolean {
    // Always collaborative for first interaction
    if (messages.length <= 2) return true;

    const assistantMessages = messages.filter(m => m.role === 'assistant').length;

    // Collaborative every 4-5 exchanges to maintain engagement
    if (assistantMessages > 0 && assistantMessages % 4 === 0) return true;

    // Check message complexity and content
    const messageLength = userMessage.length;
    const isDetailedResponse = messageLength > 200;

    // Technical and behavioral keyword detection
    const technicalKeywords = ['algorithm', 'architecture', 'design', 'implementation', 'solution', 'approach', 'methodology', 'code', 'system', 'database', 'api'];
    const behavioralKeywords = ['team', 'collaboration', 'leadership', 'conflict', 'communication', 'challenge', 'project', 'experience', 'worked', 'managed'];

    const hasTechnical = technicalKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
    const hasBehavioral = behavioralKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));

    // Collaborative if both aspects are present or response is detailed
    if ((hasTechnical && hasBehavioral) || isDetailedResponse) return true;

    // Random collaborative responses to keep it natural (20% chance)
    return Math.random() < 0.2;
}

// Determine which interviewer should take the lead
function determinePrimaryInterviewer(currentSection: any, messages: any[]): 'soft' | 'hard' {
    if (!currentSection) return 'soft';

    // Analyze section focus areas
    const focusAreas = currentSection.focusAreas || [];
    const technicalAreas = ['technical', 'coding', 'algorithms', 'architecture', 'problem-solving', 'programming'];
    const behavioralAreas = ['communication', 'teamwork', 'leadership', 'cultural-fit', 'background', 'experience'];

    const isTechnicalSection = focusAreas.some(area =>
        technicalAreas.some(tech => area.toLowerCase().includes(tech))
    );

    const isBehavioralSection = focusAreas.some(area =>
        behavioralAreas.some(behavioral => area.toLowerCase().includes(behavioral))
    );

    // Default alternating pattern if section is unclear
    if (!isTechnicalSection && !isBehavioralSection) {
        const assistantMessages = messages.filter(m => m.role === 'assistant').length;
        return assistantMessages % 2 === 0 ? 'soft' : 'hard';
    }

    return isTechnicalSection ? 'hard' : 'soft';
}
