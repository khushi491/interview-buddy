import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a temporary file-like object for OpenAI
    const file = new Blob([buffer], { type: audioFile.type });

    // Initialize OpenAI client only when needed
    const openai = new (await import("openai")).default({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Send to OpenAI for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: file as any,
      model: "whisper-1",
      response_format: "text",
      language: "en",
      temperature: 0,
      prompt: "This is an interview conversation. Please transcribe accurately.",
    });

    return NextResponse.json({
      success: true,
      transcription: transcription
    });

  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}
