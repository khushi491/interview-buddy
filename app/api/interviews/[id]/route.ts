import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const interview = await storage.getInterviewById(id);

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Add demo user info to the response
    const interviewWithUser = {
      ...interview,
      user: {
        id: interview.userId,
        name: "Interview Candidate",
        email: "candidate@example.com",
      },
      InterviewAnalysis: [], // Empty array for now since we're not storing analysis separately
    };

    return NextResponse.json({ interview: interviewWithUser });
  } catch (error) {
    console.error("Error fetching interview:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // Get interview to check if it exists
    const interview = await storage.getInterviewById(id);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Update the interview
    const updatedInterview = await storage.updateInterview(id, body);
    if (!updatedInterview) {
      return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
    }

    return NextResponse.json({ success: true, interview: updatedInterview });
  } catch (error) {
    console.error("Error updating interview:", error);
    return NextResponse.json(
      { error: "Failed to update interview" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get interview to check if it exists
    const interview = await storage.getInterviewById(id);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Delete the interview
    const deleted = await storage.deleteInterview(id);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete interview" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting interview:", error);
    return NextResponse.json(
      { error: "Failed to delete interview" },
      { status: 500 }
    );
  }
} 