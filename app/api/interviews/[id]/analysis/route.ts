import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const interview = await storage.getInterviewById(id);

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // For now, return null analysis since we're not storing it separately
        // In a real app, you might want to add analysis storage to the storage service
        return NextResponse.json({ analysis: null });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { analysis } = body;

        if (!analysis) {
            return NextResponse.json({ error: "Missing analysis" }, { status: 400 });
        }

        // Get interview to check if it exists
        const interview = await storage.getInterviewById(id);
        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // For now, just return the analysis since we're not storing it separately
        // In a real app, you might want to add analysis storage to the storage service
        return NextResponse.json({ analysis });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 