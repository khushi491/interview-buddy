import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            model = "gpt-4o-realtime-preview-2025-06-03",
            voice = "alloy"
        } = body;

        // Validate required fields
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        console.log('Creating Realtime session:', { model, voice });

        // Initialize OpenAI client only when needed
        const openai = new (await import("openai")).default({
            apiKey: process.env.OPENAI_API_KEY!,
        });

        // Create a session with OpenAI Realtime API
        const session = await openai.beta.realtime.sessions.create({
            model,
            voice,
        });

        console.log('Created Realtime session:', {
            sessionId: session.client_secret?.value ? 'created' : 'failed',
            model,
            voice
        });

        return NextResponse.json(session);
    } catch (error) {
        console.error('Error creating Realtime session:', error);

        // Handle specific OpenAI errors
        if (error instanceof Error && 'status' in error) {
            return NextResponse.json(
                {
                    error: 'OpenAI API error',
                    details: error.message,
                    status: (error as any).status
                },
                { status: (error as any).status || 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
} 