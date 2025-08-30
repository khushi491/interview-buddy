import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }

    // Initialize OpenAI client only when needed
    const openai = new (await import("openai")).default({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
    });

    return NextResponse.json({ response: completion.choices[0].message.content });

  } catch (error) {
    console.error("Error generating answer:", error);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
