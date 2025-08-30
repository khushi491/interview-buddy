import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const MAX_INTERVIEW_DURATION = 10 * 60; // 10 minutes in seconds

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    console.log(`[${requestId}] Video analytics request started at ${new Date().toISOString()}`);

    try {
        const body = await request.json();
        const {
            interviewId,
            transcript,
            duration,
            position,
            cvText,
            jobDescription,
            mode = "video",
            forceComplete = false
        } = body;

        console.log(`[${requestId}] Processing video analytics:`, {
            interviewId,
            position,
            duration,
            transcriptType: typeof transcript,
            transcriptLength: transcript ? (typeof transcript === 'string' ? transcript.length : JSON.stringify(transcript).length) : 0,
            mode,
            forceComplete
        });

        // Validate required fields
        if (!interviewId) {
            return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });
        }

        // Check if interview duration exceeds 10 minutes
        if (duration > MAX_INTERVIEW_DURATION) {
            return NextResponse.json({
                error: "Interview duration exceeded 10 minutes",
                shouldEnd: true
            }, { status: 400 });
        }

        // Check if interview should end based on AI analysis or force completion
        const shouldEndInterview = forceComplete || await checkIfInterviewShouldEnd(transcript, duration);

        // Generate analytics
        console.log(`[${requestId}] Starting analytics generation`);
        const analyticsStartTime = Date.now();
        const analytics = await generateVideoInterviewAnalytics({
            transcript,
            position,
            cvText,
            jobDescription,
            duration
        });
        const analyticsEndTime = Date.now();
        console.log(`[${requestId}] Analytics generation completed in ${analyticsEndTime - analyticsStartTime}ms`);

        console.log(`[${requestId}] Analytics result:`, {
            overallScore: analytics.overallScore,
            hasStrengths: analytics.strengths?.length > 0,
            hasImprovementAreas: analytics.improvementAreas?.length > 0,
            recommendation: analytics.recommendation,
            hasKeyInsights: analytics.keyInsights?.length > 0
        });

        // Update interview in storage
        const updatedInterview = await storage.updateInterview(interviewId, {
            transcript,
            duration,
            mode,
            status: shouldEndInterview ? "completed" : "in_progress",
            completedAt: shouldEndInterview ? new Date().toISOString() : undefined,
        });

        if (!updatedInterview) {
            return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
        }

        const endTime = Date.now();
        console.log(`[${requestId}] Video analytics request completed successfully in ${endTime - startTime}ms`);

        return NextResponse.json({
            success: true,
            interview: updatedInterview,
            analysis: analytics,
            shouldEnd: shouldEndInterview,
            timeRemaining: Math.max(0, MAX_INTERVIEW_DURATION - duration),
        });

    } catch (error) {
        const endTime = Date.now();
        console.error(`[${requestId}] Video analytics error after ${endTime - startTime}ms:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return NextResponse.json(
            { error: "Failed to process video analytics" },
            { status: 500 }
        );
    }
}

async function checkIfInterviewShouldEnd(transcript: any, duration: number) {
    try {
        // Check if duration is close to limit
        if (duration >= MAX_INTERVIEW_DURATION - 30) { // 30 seconds buffer
            return true;
        }

        // If transcript is empty or very short, don't end yet
        if (!transcript || (Array.isArray(transcript) && transcript.length < 2)) {
            return false;
        }

        // Analyze transcript for interview completion indicators
        const transcriptText = JSON.stringify(transcript);

        const completionPrompt = `
    Analyze this interview transcript and determine if the interview should end.
    Look for indicators like:
    - "Thank you for your time"
    - "Do you have any questions for us?"
    - "We'll be in touch"
    - "This concludes our interview"
    - "Is there anything else you'd like to know?"
    - "Thank you for coming in today"
    - Natural conversation endings
    - Long pauses or awkward silences
    - Both parties saying goodbye
    
    IMPORTANT: This interview is conducted in English only. Analyze the English content.
    
    Transcript: ${transcriptText.substring(0, 2000)}
    Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}
    
    Respond with only "YES" if the interview should end, or "NO" if it should continue.
    Be conservative - only end if there are clear completion indicators.
    `;

        // Initialize OpenAI client only when needed
        const openai = new (await import("openai")).default({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: completionPrompt }],
            max_tokens: 10,
            temperature: 0.1,
        });

        const shouldEnd = response.choices[0]?.message?.content?.trim().toUpperCase() === "YES";
        return shouldEnd;

    } catch (error) {
        console.error("Error checking interview end:", error);
        // Default to ending if duration is close to limit
        return duration >= MAX_INTERVIEW_DURATION - 60;
    }
}

async function generateVideoInterviewAnalytics({
    transcript,
    position,
    cvText,
    jobDescription,
    duration
}: {
    transcript: any;
    position: string;
    cvText?: string;
    jobDescription?: string;
    duration: number;
}) {
    try {
        // Handle empty or invalid transcripts
        if (!transcript || (typeof transcript === 'string' && transcript.trim() === '') ||
            (Array.isArray(transcript) && transcript.length === 0)) {
            return {
                overallScore: 7,
                strengths: ["Interview session completed"],
                improvementAreas: ["No conversation data available for analysis"],
                technicalSkills: { score: 7, notes: "No transcript available" },
                communication: { score: 7, notes: "No transcript available" },
                problemSolving: { score: 7, notes: "No transcript available" },
                culturalFit: { score: 7, notes: "No transcript available" },
                recommendation: "MAYBE",
                summary: "Interview completed but no conversation data was recorded.",
                keyInsights: ["Interview session completed successfully"],
            };
        }

        const transcriptText = JSON.stringify(transcript);

        const analysisPrompt = `
    Analyze this video interview and provide comprehensive feedback.
    
    Position: ${position}
    Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}
    CV: ${cvText || "Not provided"}
    Job Description: ${jobDescription || "Not provided"}
    
    IMPORTANT: 
    - This interview was conducted in English only. Analyze the English content.
    - Return ONLY valid JSON, no additional text or explanations.
    - Follow the exact format provided below.
    
    Interview Transcript: ${transcriptText.substring(0, 3000)}
    
    Return ONLY this JSON format (no additional text):
    {
      "overallScore": 8,
      "strengths": ["Clear communication", "Good technical knowledge"],
      "improvementAreas": ["Could provide more examples", "Technical depth"],
      "technicalSkills": {"score": 8, "notes": "Strong technical foundation"},
      "communication": {"score": 9, "notes": "Excellent communication skills"},
      "problemSolving": {"score": 7, "notes": "Good problem-solving approach"},
      "culturalFit": {"score": 8, "notes": "Good cultural alignment"},
      "recommendation": "HIRE",
      "summary": "Overall strong candidate with good technical skills and communication",
      "keyInsights": ["Strong technical background", "Good communication skills", "Shows initiative"]
    }
    
    Rules:
    - Scoring: 1-10 scale where 10 is excellent
    - Recommendation: Must be exactly "HIRE", "MAYBE", or "NO_HIRE"
    - Return valid JSON only
    `;

        // Initialize OpenAI client only when needed
        const openai = new (await import("openai")).default({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: analysisPrompt }],
            max_tokens: 1000,
            temperature: 0.3,
        });

        const analysisText = response.choices[0]?.message?.content;
        if (!analysisText) {
            throw new Error("No analysis generated");
        }

        // Parse the JSON response with improved error handling
        let analysis;
        try {
            // Try to extract JSON from the response if it's wrapped in other text
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : analysisText;
            analysis = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Failed to parse AI analysis response:", analysisText);
            throw new Error("Failed to parse analysis response");
        }

        return {
            overallScore: analysis.overallScore || 7,
            strengths: analysis.strengths || [],
            improvementAreas: analysis.improvementAreas || [],
            technicalSkills: analysis.technicalSkills || { score: 7, notes: "" },
            communication: analysis.communication || { score: 7, notes: "" },
            problemSolving: analysis.problemSolving || { score: 7, notes: "" },
            culturalFit: analysis.culturalFit || { score: 7, notes: "" },
            recommendation: analysis.recommendation || "MAYBE",
            summary: analysis.summary || "Interview completed successfully",
            keyInsights: analysis.keyInsights || [],
        };

    } catch (error) {
        console.error("Error generating analytics:", error);

        // Return default analytics if AI analysis fails
        return {
            overallScore: 7,
            strengths: ["Interview completed successfully"],
            improvementAreas: ["Analysis could not be generated"],
            technicalSkills: { score: 7, notes: "Analysis pending" },
            communication: { score: 7, notes: "Analysis pending" },
            problemSolving: { score: 7, notes: "Analysis pending" },
            culturalFit: { score: 7, notes: "Analysis pending" },
            recommendation: "MAYBE",
            summary: "Interview completed. Detailed analysis will be available shortly.",
            keyInsights: ["Interview completed successfully"],
        };
    }
} 