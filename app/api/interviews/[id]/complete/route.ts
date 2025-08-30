import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get the interview
        const interview = await storage.getInterviewById(id);

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // Mark interview as completed
        const updatedInterview = await storage.updateInterview(id, {
            status: "completed",
            completedAt: new Date().toISOString(),
        });

        if (!updatedInterview) {
            return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
        }

        // Generate analysis if transcript exists
        let analysis = null;
        if (interview.transcript) {
            try {
                analysis = await generateVideoInterviewAnalytics({
                    transcript: interview.transcript,
                    position: interview.position,
                    cvText: interview.cvText || undefined,
                    jobDescription: interview.jobDescription || "",
                    duration: interview.duration || 0,
                });
            } catch (error) {
                console.error("Error generating analysis:", error);
                // Continue without analysis
            }
        }

        return NextResponse.json({
            success: true,
            interview: updatedInterview,
            analysis,
        });

    } catch (error) {
        console.error("Error completing interview:", error);
        return NextResponse.json(
            { error: "Failed to complete interview" },
            { status: 500 }
        );
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
        const transcriptText = JSON.stringify(transcript);

        const analysisPrompt = `
    Analyze this video interview and provide comprehensive feedback.
    
    Position: ${position}
    Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}
    CV: ${cvText || "Not provided"}
    Job Description: ${jobDescription || "Not provided"}
    
    IMPORTANT: This interview was conducted in English only. Analyze the English content.
    
    Interview Transcript: ${transcriptText.substring(0, 3000)}
    
    Provide analysis in the following JSON format:
    {
      "overallScore": 8,
      "strengths": ["Clear communication", "Good technical knowledge"],
      "improvementAreas": ["Could provide more examples", "Technical depth"],
      "technicalSkills": {"score": 8, "details": "Strong technical foundation"},
      "communication": {"score": 9, "details": "Excellent communication skills"},
      "problemSolving": {"score": 7, "details": "Good problem-solving approach"},
      "culturalFit": {"score": 8, "details": "Good cultural alignment"},
      "recommendation": "HIRE",
      "summary": "Overall strong candidate with good technical skills and communication",
      "keyInsights": ["Strong technical background", "Good communication skills", "Shows initiative"]
    }
    
    Scoring: 1-10 scale where 10 is excellent
    Recommendation: HIRE, MAYBE, or NO_HIRE
    Language: English only
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

        // Parse the JSON response
        const analysis = JSON.parse(analysisText);

        return {
            overallScore: analysis.overallScore || 7,
            strengths: analysis.strengths || [],
            improvementAreas: analysis.improvementAreas || [],
            technicalSkills: analysis.technicalSkills || { score: 7, details: "" },
            communication: analysis.communication || { score: 7, details: "" },
            problemSolving: analysis.problemSolving || { score: 7, details: "" },
            culturalFit: analysis.culturalFit || { score: 7, details: "" },
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
            technicalSkills: { score: 7, details: "Analysis pending" },
            communication: { score: 7, details: "Analysis pending" },
            problemSolving: { score: 7, details: "Analysis pending" },
            culturalFit: { score: 7, details: "Analysis pending" },
            recommendation: "MAYBE",
            summary: "Interview completed. Detailed analysis will be available shortly.",
            keyInsights: ["Interview completed successfully"],
        };
    }
} 