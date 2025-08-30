import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create a basic interview structure
    const interview = await storage.createInterview({
      userId,
      type: "TEXT",
      position: "General",
      interviewType: "General",
      flow: { sections: [], totalDuration: 0, difficulty: "medium", focus: "mixed" },
      mode: "text",
      transcript: {},
      status: "in_progress",
      currentSectionIndex: 0,
    });

    return NextResponse.json({ interview }, { status: 201 });
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
  }
}
