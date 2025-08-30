export interface InterviewSection {
    id: string;
    title: string;
    order: number;
    estimatedDuration: number; // in minutes
    focusAreas: string[];
}

export interface InterviewFlow {
    sections: InterviewSection[];
    totalDuration: number;
    difficulty: 'entry' | 'mid' | 'senior';
    focus: string;
}

export interface InterviewResponse {
    question: string;
    answer: string;
    timestamp: number;
    sectionId: string;
}

export interface InterviewState {
    currentSectionId: string;
    sectionIndex: number;
    elapsedTime: number; // in minutes
    startTime: number; // timestamp
    finished: boolean;
    responses: InterviewResponse[];
    flow: InterviewFlow;
    position: string;
    interviewType: string;
    cvText?: string;
    jobDescription?: string;
}

export class InterviewStateManager {
    private state: InterviewState;

    constructor(
        flow: InterviewFlow,
        position: string,
        interviewType: string,
        cvText?: string,
        jobDescription?: string
    ) {
        this.state = {
            currentSectionId: flow.sections[0]?.id || '',
            sectionIndex: 0,
            elapsedTime: 0,
            startTime: Date.now(),
            finished: false,
            responses: [],
            flow,
            position,
            interviewType,
            cvText,
            jobDescription,
        };
    }

    // Get current section
    getCurrentSection(): InterviewSection | null {
        return this.state.flow.sections[this.state.sectionIndex] || null;
    }

    // Get next section
    getNextSection(): InterviewSection | null {
        return this.state.flow.sections[this.state.sectionIndex + 1] || null;
    }

    // Check if interview is complete
    isInterviewComplete(): boolean {
        const now = Date.now();
        const elapsedMinutes = (now - this.state.startTime) / (1000 * 60);

        return (
            this.state.finished ||
            elapsedMinutes >= 25 || // Max 25 minutes
            this.state.sectionIndex >= this.state.flow.sections.length - 1
        );
    }

    // Check if current section is complete
    isSectionComplete(): boolean {
        const currentSection = this.getCurrentSection();
        if (!currentSection) return true;

        const sectionResponses = this.state.responses.filter(
            r => r.sectionId === currentSection.id
        );

        const now = Date.now();
        const elapsedMinutes = (now - this.state.startTime) / (1000 * 60);
        const sectionStartTime = this.getSectionStartTime();
        const sectionElapsedMinutes = (now - sectionStartTime) / (1000 * 60);

        // Section is complete if:
        // 1. We have enough responses (at least 2 Q&A pairs)
        // 2. We've spent enough time (at least 80% of estimated duration)
        // 3. Or we've exceeded the estimated duration
        return (
            sectionResponses.length >= 4 && // 2 Q&A pairs
            (sectionElapsedMinutes >= currentSection.estimatedDuration * 0.8 ||
                sectionElapsedMinutes >= currentSection.estimatedDuration)
        );
    }

    // Get section start time
    private getSectionStartTime(): number {
        const sectionResponses = this.state.responses.filter(
            r => r.sectionId === this.state.currentSectionId
        );

        if (sectionResponses.length > 0) {
            return sectionResponses[0].timestamp;
        }

        return this.state.startTime;
    }

    // Add a response
    addResponse(question: string, answer: string): void {
        const currentSection = this.getCurrentSection();
        if (!currentSection) return;

        const trimmedQ = question.trim();
        const trimmedA = answer.trim();

        // Check if this exact question-answer pair already exists
        const isDuplicate = this.state.responses.some(
            r => r.question === trimmedQ && r.answer === trimmedA
        );
        
        if (isDuplicate) {
            return; // Don't add duplicates
        }

        // Check if this question already exists but is unanswered
        const existingResponseIndex = this.state.responses.findIndex(
            (r) => r.question === trimmedQ && r.answer === ""
        );

        if (existingResponseIndex !== -1 && trimmedA) {
            // If the question exists and we now have an answer, update it
            this.state.responses[existingResponseIndex].answer = trimmedA;
            this.state.responses[existingResponseIndex].timestamp = Date.now();
        } else {
            // Otherwise, add a new response entry
            this.state.responses.push({
                question: trimmedQ,
                answer: trimmedA,
                timestamp: Date.now(),
                sectionId: currentSection.id,
            });
        }
    }


    // Progress to next section
    progressToNextSection(): boolean {
        const nextSection = this.getNextSection();
        if (!nextSection || this.isInterviewComplete()) {
            this.state.finished = true;
            return false;
        }

        this.state.sectionIndex++;
        this.state.currentSectionId = nextSection.id;
        return true;
    }


    // Get current state
    getState(): InterviewState {
        return { ...this.state };
    }

    // Update elapsed time
    updateElapsedTime(): void {
        const now = Date.now();
        this.state.elapsedTime = (now - this.state.startTime) / (1000 * 60);
    }

    // Get section-specific context for AI
    getSectionContext(): string {
        const currentSection = this.getCurrentSection();
        if (!currentSection) return '';

        const sectionResponses = this.state.responses.filter(
            r => r.sectionId === currentSection.id
        );

        return `
Current Section: ${currentSection.title}
Focus Areas: ${currentSection.focusAreas.join(', ')}
Section Progress: ${sectionResponses.length} responses
Estimated Duration: ${currentSection.estimatedDuration} minutes
Section Responses: ${sectionResponses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}
    `.trim();
    }

    // Get overall interview context
    getInterviewContext(): string {
        return `
Position: ${this.state.position}
Interview Type: ${this.state.interviewType}
Total Progress: ${this.state.sectionIndex + 1}/${this.state.flow.sections.length} sections
Elapsed Time: ${Math.round(this.state.elapsedTime)} minutes
Total Responses: ${this.state.responses.length}
CV Available: ${this.state.cvText ? 'Yes' : 'No'}
Job Description Available: ${this.state.jobDescription ? 'Yes' : 'No'}
    `.trim();
    }

    // Check if we should auto-advance
    shouldAutoAdvance(): boolean {
        return this.isSectionComplete() && !this.isInterviewComplete();
    }

    // Get time remaining for current section
    getSectionTimeRemaining(): number {
        const currentSection = this.getCurrentSection();
        if (!currentSection) return 0;

        const sectionStartTime = this.getSectionStartTime();
        const now = Date.now();
        const sectionElapsedMinutes = (now - sectionStartTime) / (1000 * 60);

        return Math.max(0, currentSection.estimatedDuration - sectionElapsedMinutes);
    }

    // Get overall time remaining
    getTotalTimeRemaining(): number {
        const now = Date.now();
        const elapsedMinutes = (now - this.state.startTime) / (1000 * 60);
        return Math.max(0, 25 - elapsedMinutes); // 25 minute max
    }

    // Detect if AI response indicates section completion
    detectTransitionPhrases(content: string): boolean {
        const transitionPhrases = [
            "let's move on to the next section",
            "let's move to the next section",
            "let's continue to the next section",
            "let's proceed to the next section",
            "let's move forward to the next section",
            "let's advance to the next section",
            "let's move on to the next part",
            "let's move to the next part",
            "let's continue to the next part",
            "let's proceed to the next part",
            "let's move forward to the next part",
            "let's advance to the next part",
            "let's move on to the next step",
            "let's move to the next step",
            "let's continue to the next step",
            "let's proceed to the next step",
            "let's move forward to the next step",
            "let's advance to the next step",
            "are you ready to continue",
            "shall we move on",
            "shall we continue",
            "shall we proceed",
            "ready to move on",
            "ready to continue",
            "ready to proceed",
            "let's move on",
            "let's continue",
            "let's proceed",
            "moving to the next",
            "continuing to the next",
            "proceeding to the next",
            "let's move on",
            "let's move to the next section",
            "shall we move on",
            "ready to move on",
            "let's continue to the next section",
            "moving on to",
            "now, for the next part",
            "great, let's proceed", "let's move on",
            "let's move to the next section",
            "shall we move on",
            "ready to move on",
            "let's continue to the next section",
            "moving on to",
            "now, for the next part",
            "great, let's proceed",
        ];

        // Remove punctuation, trim, and lowercase
        const normalize = (str: string) => str.replace(/[.,!?]/g, '').trim().toLowerCase();
        const normalizedContent = normalize(content);
        const found = transitionPhrases.some(phrase => normalizedContent.includes(normalize(phrase)));
        if (found) {
            console.log('[Transition Detection] Matched phrase in:', content);
        } else {
            console.log('[Transition Detection] No match in:', content);
        }
        return found;
    }

    // Check if current section should auto-advance based on AI response
    shouldAutoAdvanceBasedOnResponse(aiResponse: string): boolean {
        if (this.isInterviewComplete()) {
            return false;
        }

        // If the AI response contains a transition phrase, we should advance.
        const containsTransition = this.detectTransitionPhrases(aiResponse);

        if (containsTransition) {
            console.log('[Transition Detection] Matched phrase, signaling to advance.');
        }

        return containsTransition;
    }


} 