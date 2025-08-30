import { openai } from "@ai-sdk/openai"
import { streamText, convertToModelMessages } from "ai"
import { InterviewStateManager } from "@/lib/interview-state"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, interviewState } = await req.json()

  console.log("Chat API called with:", { messages, interviewState });

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

  let systemPrompt = `You are an expert interviewer conducting a professional interview for a ${interviewState.position} position.

${stateManager.getInterviewContext()}

${stateManager.getSectionContext()}

Guidelines:
- Ask thoughtful, relevant questions based on the candidate's previous responses
- Build upon their answers to dive deeper into their experience
- Maintain a professional yet conversational tone
- Ask follow-up questions that reveal problem-solving skills, experience, and cultural fit
- Keep questions focused and avoid being too lengthy
- Reference their previous answers when relevant to show you're listening
- Stay within the focus areas of the current section: ${currentSection?.focusAreas.join(', ') || 'general'}

${isFirstMessage ? 'This is the beginning of the interview. Start with a welcoming introduction and your first question.' : 'Continue the conversation based on the candidate\'s response.'}

${stateManager.isInterviewComplete() ? 'The interview is complete. Thank the candidate and provide a brief summary of what was covered.' : ''}
 
IMPORTANT - Section Transitions:
When the current section is complete and you need to move to the next section, use one of these specific phrases:
- "Let's move on to the next section"
- "Let's move to the next section"
- "Let's continue to the next section"
- "Let's proceed to the next section"
- "Are you ready to continue to the next section?"

CRITICAL: When you conclude a section, end your response with this exact sentence to signal the transition:
"That approach fosters transparency and accountability. Are you ready to continue to the next section?"
 
${stateManager.shouldAutoAdvance() ? 'The current section appears complete. Use the sentence above to transition to the next section.' : ''}
 
IMPORTANT - Section Advancement Guidelines:
- After asking 2-3 questions in the current section, assess if the candidate has provided sufficient responses
- If the candidate has given detailed answers covering the focus areas, use a transition phrase to move to the next section
- Don\'t stay in one section too long - aim for 2-3 meaningful exchanges per section
- If the candidate\'s responses are brief or unclear, ask follow-up questions before transitioning
- Use transition phrases naturally within your response, not as standalone messages`;

  // Add CV context if available
  if (interviewState.cvText) {
    systemPrompt += `\n\nCandidate CV Context:\n${interviewState.cvText.substring(0, 1000)}...`;
  }

  // Add job description context if available
  if (interviewState.jobDescription) {
    systemPrompt += `\n\nJob Description Context:\n${interviewState.jobDescription.substring(0, 1000)}...`;
  }

  console.log("System prompt:", systemPrompt);
  console.log("Messages to send:", messages);

  // Convert UIMessages to ModelMessages for the AI SDK
  const modelMessages = convertToModelMessages(messages);

  console.log("Model messages:", modelMessages);

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: modelMessages,
  });

  console.log("Streaming response...");
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages, responseMessage }) => {
      console.log("Stream finished, response message:", responseMessage);
    },
  });
}
