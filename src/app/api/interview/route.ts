import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  try {
    const { question, response, jobRole, experienceLevel } = await request.json();

    if (!question || !response) {
      return NextResponse.json(
        { error: 'Question and response are required' },
        { status: 400 }
      );
    }

    // If OpenAI is not configured, use fallback feedback
    if (!openai) {
      const fallbackFeedback = getFallbackFeedback();
      return NextResponse.json({ 
        feedback: fallbackFeedback,
        message: 'Using fallback feedback (OpenAI API key not configured)'
      });
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
    // Use fallback feedback on any error
    const fallbackFeedback = getFallbackFeedback();
    return NextResponse.json({ 
      feedback: fallbackFeedback,
      message: 'Error occurred, using fallback feedback'
    });
  }
}

function getFallbackFeedback(): string {
  const feedbacks = [
    "Excellent answer! You demonstrated strong technical knowledge and clear communication skills.",
    "Good response, but consider providing more specific examples to strengthen your answer.",
    "Your answer shows understanding of the concept. Try to elaborate more on the practical applications.",
    "Well-structured response. You might want to mention industry best practices as well.",
    "Good foundation, but consider discussing potential challenges and solutions.",
    "Your response shows good technical understanding. Consider adding real-world examples to make it more compelling.",
    "Nice work! You've covered the basics well. Try to dive deeper into the technical details next time.",
    "Good start! Your answer demonstrates knowledge of the topic. Consider expanding on implementation details."
  ];
  
  return feedbacks[Math.floor(Math.random() * feedbacks.length)];
} 