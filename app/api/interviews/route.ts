import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { generateInterviewFlow } from "@/lib/generate-interview-flow";

export async function GET(req: NextRequest) {
  try {
    // For demo purposes, return all interviews since we don't have user authentication
    const interviews = await storage.getAllInterviews();
    return NextResponse.json({ interviews });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
      position,
      interviewType,
      flow,
      cvText,
      mode = "text",
      resumeId,
      difficulty = "medium",
      jobDescription,
    } = body;

    // Generate a demo user ID since we don't have authentication
    const demoUserId = `demo-user-${Date.now()}`;

    // Ensure we always have a flow
    let effectiveFlow = flow;
    if (!effectiveFlow) {
      try {
        effectiveFlow = await generateInterviewFlow(
          position,
          interviewType,
          undefined,
          jobDescription,
          cvText,
          difficulty
        );
      } catch (e) {
        console.warn("Flow generation failed, falling back.", e);
        effectiveFlow = { sections: [], totalDuration: 0, difficulty, focus: "mixed" };
      }
    }

    const interview = await storage.createInterview({
      userId: demoUserId,
      type,
      position,
      interviewType,
      flow: effectiveFlow,
      cvText,
      mode,
      transcript: {},
      status: "in_progress",
      currentSectionIndex: 0,
      resumeId: resumeId || null,
      difficulty,
      jobDescription,
    });

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
} 