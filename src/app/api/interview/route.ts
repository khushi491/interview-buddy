import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { question, response, jobRole, experienceLevel } = await request.json();

    if (!question || !response) {
      return NextResponse.json(
        { error: 'Question and response are required' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert interview coach conducting a ${experienceLevel} level interview for a ${jobRole} position.

Question: "${question}"

Candidate's Response: "${response}"

Please provide constructive feedback on the candidate's response. Consider:
1. Technical accuracy and depth of knowledge
2. Communication clarity and structure
3. Relevance to the question asked
4. Areas for improvement
5. Overall assessment

Provide feedback in 2-3 sentences that is encouraging but constructive.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach providing constructive feedback to job candidates."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const feedback = completion.choices[0]?.message?.content || "Unable to generate feedback at this time.";

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
} 