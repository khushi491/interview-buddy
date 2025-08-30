import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { sectionId, role, transcript, audioUrl } = await req.json();

    if (!sectionId || !role || !transcript) {
      return NextResponse.json({ error: "sectionId, role, and transcript are required" }, { status: 400 });
    }

    // For now, just return success since we're not storing interview turns separately
    // In a real app, you might want to add turn storage to the storage service
    const turn = {
      id: `turn-${Date.now()}`,
      sectionId,
      role,
      transcript,
      audioUrl,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ turn }, { status: 201 });
  } catch (error) {
    console.error("Error saving turn:", error);
    return NextResponse.json({ error: "Failed to save turn" }, { status: 500 });
  }
}
