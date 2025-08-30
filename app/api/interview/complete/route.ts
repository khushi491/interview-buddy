import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { interviewId } = await req.json();

    if (!interviewId) {
      return NextResponse.json({ error: "interviewId is required" }, { status: 400 });
    }

    const interview = await storage.updateInterview(interviewId, {
      completedAt: new Date().toISOString(),
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("Error completing interview:", error);
    return NextResponse.json({ error: "Failed to complete interview" }, { status: 500 });
  }
}
