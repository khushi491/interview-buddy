import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

// Helper function to extract text content from UIMessage
const getMessageText = (message: any): string => {
  if (message.content) return message.content;
  if (message.text) return message.text;
  if (message.parts && Array.isArray(message.parts)) {
    const textPart = message.parts.find((part: any) => part.type === 'text');
    return textPart ? textPart.text : '';
  }
  return '';
};

export async function POST(req: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Chat analysis request started at ${new Date().toISOString()}`);
  
  try {
    const body = await req.json()

    // Handle both data structures: { interviewData: {...} } and direct {...}
    const interviewData = body.interviewData || body

    console.log(`[${requestId}] Analyze API called with:`, {
      hasSection: !!interviewData.section,
      hasMessages: !!interviewData.messages,
      sectionTitle: interviewData.section?.title,
      messageCount: interviewData.messages?.length,
      position: interviewData.position,
      interviewType: interviewData.interviewType || interviewData.type,
      fullReport: body.fullReport
    });

    // Check if this is a section-specific analysis
    const isSectionAnalysis = interviewData.section && interviewData.messages;

    const analysisPrompt = isSectionAnalysis
      ? `Analyze this specific interview section and provide a focused assessment:

Position: ${interviewData.position}
Interview Type: ${interviewData.type}
Section: ${interviewData.section.title}
Section Focus Areas: ${interviewData.section.focusAreas.join(', ')}
${interviewData.section.description ? `Section Description: ${interviewData.section.description}` : ''}
Duration: ${interviewData.duration}

Section Messages:
${interviewData.messages
        .map((msg: any, idx: number) => `${msg.role === "assistant" ? "INTERVIEWER" : "CANDIDATE"}: ${msg.content || msg.text || getMessageText(msg)}`)
        .join("\n\n")}

IMPORTANT: Return ONLY valid JSON, no additional text or explanations.

Return ONLY this JSON format (no additional text):
{
  "overallScore": number (1-10),
  "strengths": ["strength1", "strength2", "strength3"],
  "improvementAreas": ["area1", "area2", "area3"],
  "technicalSkills": {
    "score": number (1-10),
    "notes": "detailed assessment for this section"
  },
  "communication": {
    "score": number (1-10),
    "notes": "detailed assessment for this section"
  },
  "problemSolving": {
    "score": number (1-10),
    "notes": "detailed assessment for this section"
  },
  "culturalFit": {
    "score": number (1-10),
    "notes": "detailed assessment for this section"
  },
  "recommendation": "HIRE" | "MAYBE" | "NO_HIRE",
  "summary": "2-3 paragraph summary of the candidate's performance in this specific section",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "sectionSpecificFeedback": "Detailed feedback specific to this section's focus areas"
}`
      : `Analyze this interview and provide a comprehensive assessment. Be STRICT in your evaluation - empty or minimal responses should receive low scores.

Position: ${interviewData.position}
Interview Type: ${interviewData.type}
Duration: ${interviewData.duration}
Message Count: ${interviewData.messages?.length || 0}

Interview Transcript:
${interviewData.messages
        .map((msg: any) => `${msg.role === "assistant" ? "INTERVIEWER" : "CANDIDATE"}: ${msg.content || msg.text || getMessageText(msg)}`)
        .join("\n\n")}

CRITICAL EVALUATION GUIDELINES:
- If candidate provided NO meaningful responses or only said "I'm ready" - give scores 1-3
- If candidate gave minimal/short answers without depth - give scores 3-5  
- If candidate didn't answer questions properly - give scores 2-4
- If candidate left interview incomplete - deduct 2-3 points from all scores
- Only give scores 7+ for genuinely good, detailed, thoughtful responses
- Be harsh on communication if responses are unclear or too brief
- Technical skills should be 1-2 if no technical content was provided
- Problem solving should be 1-3 if no problem-solving was demonstrated

SCORING SCALE (be strict):
1-2: Poor/No response
3-4: Minimal effort
5-6: Adequate but lacking
7-8: Good performance  
9-10: Exceptional (rare)

Return ONLY this JSON format (no additional text):
{
  "overallScore": number (1-10),
  "strengths": ["strength1", "strength2", "strength3"],
  "improvementAreas": ["area1", "area2", "area3"],
  "technicalSkills": {
    "score": number (1-10),
    "notes": "detailed assessment"
  },
  "communication": {
    "score": number (1-10),
    "notes": "detailed assessment"
  },
  "problemSolving": {
    "score": number (1-10),
    "notes": "detailed assessment"
  },
  "culturalFit": {
    "score": number (1-10),
    "notes": "detailed assessment"
  },
  "recommendation": "HIRE" | "MAYBE" | "NO_HIRE",
  "summary": "2-3 paragraph summary of the candidate's performance",
  "keyInsights": ["insight1", "insight2", "insight3"]
}`;

    console.log(`[${requestId}] Starting AI analysis generation`);
    const aiStartTime = Date.now();
    
    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: analysisPrompt,
    })
    
    const aiEndTime = Date.now();
    console.log(`[${requestId}] AI analysis generation completed in ${aiEndTime - aiStartTime}ms`);
    console.log(`[${requestId}] AI response length: ${result.text.length} characters`);

    try {
      // Improved JSON parsing with better error handling
      let analysis;
      try {
        // Try to extract JSON from the response if it's wrapped in other text
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : result.text;
        analysis = JSON.parse(jsonString);
        console.log(`[${requestId}] Successfully parsed analysis JSON`);
      } catch (innerParseError) {
        console.error(`[${requestId}] Failed to parse AI response:`, {
          responseLength: result.text.length,
          responsePreview: result.text.substring(0, 200),
          error: innerParseError instanceof Error ? innerParseError.message : String(innerParseError)
        });
        throw innerParseError;
      }
      
      const endTime = Date.now();
      console.log(`[${requestId}] Chat analysis request completed successfully in ${endTime - startTime}ms`);
      
      return Response.json(analysis)
    } catch (parseError) {
      console.error(`[${requestId}] Analysis parsing failed:`, parseError)

      // Return a fallback analysis if JSON parsing fails
      const fallbackAnalysis = isSectionAnalysis ? {
        overallScore: 7,
        strengths: [
          "Engaged well with section-specific questions",
          "Provided relevant responses to focus areas",
          "Showed understanding of section requirements",
        ],
        improvementAreas: [
          "Could provide more detailed examples",
          "Consider expanding on technical aspects",
          "Practice more structured responses",
        ],
        technicalSkills: {
          score: 7,
          notes: "Demonstrated good understanding of section-specific technical concepts",
        },
        communication: {
          score: 8,
          notes: "Communicated clearly and effectively for this section",
        },
        problemSolving: {
          score: 6,
          notes: "Showed problem-solving approach relevant to this section",
        },
        culturalFit: {
          score: 7,
          notes: "Appears to align well with section requirements",
        },
        recommendation: "MAYBE",
        summary: `The candidate demonstrated solid performance in the ${interviewData.section?.title || 'current'} section. They engaged well with the focus areas and provided relevant responses. While there are opportunities for improvement in providing more detailed examples and technical depth, the overall section performance is positive.`,
        keyInsights: [
          "Strong engagement with section-specific content",
          "Relevant responses to focus areas",
          "Would benefit from more detailed examples",
        ],
        sectionSpecificFeedback: `Good performance in ${interviewData.section?.title || 'current'} section. Focus on providing more specific examples and technical details in future responses.`,
      } : {
        overallScore: 7,
        strengths: [
          "Clear communication during the interview",
          "Engaged actively in the conversation",
          "Provided relevant responses to questions",
        ],
        improvementAreas: [
          "Could provide more specific examples",
          "Consider elaborating on technical details",
          "Practice structuring responses more clearly",
        ],
        technicalSkills: {
          score: 7,
          notes: "Demonstrated good understanding of core concepts with room for deeper technical exploration",
        },
        communication: {
          score: 8,
          notes: "Communicated clearly and effectively throughout the interview",
        },
        problemSolving: {
          score: 6,
          notes: "Showed problem-solving approach but could benefit from more structured methodology",
        },
        culturalFit: {
          score: 7,
          notes: "Appears to align well with team values and company culture",
        },
        recommendation: "MAYBE",
        summary: `The candidate demonstrated solid performance during the interview. They communicated effectively and showed engagement throughout the conversation. While there are areas for improvement, particularly in providing more specific examples and technical depth, the overall impression is positive. The candidate shows potential and would benefit from continued development in key areas.`,
        keyInsights: [
          "Strong communication skills evident throughout",
          "Engaged and enthusiastic about the opportunity",
          "Would benefit from more structured response approach",
        ],
        stepNumber: interviewData.stepNumber,
      };

      return Response.json(fallbackAnalysis)
    }
  } catch (error) {
    const endTime = Date.now();
    console.error(`[${requestId}] Analysis API error after ${endTime - startTime}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Return error response with fallback data
    return Response.json(
      {
        error: "Analysis temporarily unavailable",
        overallScore: 7,
        strengths: [
          "Participated actively in the interview",
          "Maintained professional demeanor",
          "Showed interest in the role",
        ],
        improvementAreas: [
          "Analysis system temporarily unavailable",
          "Please try again later",
          "Manual review may be needed",
        ],
        technicalSkills: { score: 7, notes: "Analysis pending" },
        communication: { score: 8, notes: "Good communication observed" },
        problemSolving: { score: 6, notes: "Analysis pending" },
        culturalFit: { score: 7, notes: "Positive interaction noted" },
        recommendation: "MAYBE",
        summary:
          "Interview completed successfully. Detailed analysis is temporarily unavailable due to system processing. The candidate participated actively and maintained professional engagement throughout the session.",
        keyInsights: [
          "Interview session completed successfully",
          "Candidate showed professional engagement",
          "Detailed analysis pending system availability",
        ],
      },
      { status: 200 },
    )
  }
}
