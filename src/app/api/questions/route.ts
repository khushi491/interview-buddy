import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  try {
    const { jobRole, experienceLevel, questionCount = 5 } = await request.json();

    if (!jobRole || !experienceLevel) {
      return NextResponse.json(
        { error: 'Job role and experience level are required' },
        { status: 400 }
      );
    }

    // If OpenAI is not configured, use fallback questions
    if (!openai) {
      const fallbackQuestions = getFallbackQuestions(jobRole, experienceLevel);
      return NextResponse.json({ 
        questions: fallbackQuestions,
        message: 'Using fallback questions (OpenAI API key not configured)'
      });
    }

    const prompt = `Generate ${questionCount} interview questions for a ${experienceLevel} level ${jobRole} position. 

The questions should be:
- Appropriate for the experience level (entry/mid/senior)
- Relevant to the specific job role
- Mix of technical and behavioral questions
- Challenging but fair for the level
- Focused on practical skills and problem-solving

Format the response as a JSON array of strings, each containing one question.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional and technical interviewer who creates relevant interview questions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    // Try to parse JSON response, fallback to sample questions if parsing fails
    try {
      const questions = JSON.parse(response);
      return NextResponse.json({ questions });
    } catch (parseError) {
      // Fallback to sample questions if AI response parsing fails
      const fallbackQuestions = getFallbackQuestions(jobRole, experienceLevel);
      return NextResponse.json({ 
        questions: fallbackQuestions,
        message: 'AI response parsing failed, using fallback questions'
      });
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    // Use fallback questions on any error
    const { jobRole, experienceLevel } = await request.json();
    const fallbackQuestions = getFallbackQuestions(jobRole, experienceLevel);
    return NextResponse.json({ 
      questions: fallbackQuestions,
      message: 'Error occurred, using fallback questions'
    });
  }
}

function getFallbackQuestions(jobRole: string, experienceLevel: string): string[] {
  const questionBank = {
    'software-engineer': {
      entry: [
        "What is the difference between let, const, and var in JavaScript?",
        "Explain what a REST API is and how it works.",
        "What is version control and why is it important?",
        "How would you debug a simple JavaScript error?",
        "What is the difference between synchronous and asynchronous code?"
      ],
      mid: [
        "Explain the concept of dependency injection and its benefits.",
        "How would you optimize a slow database query?",
        "What is the difference between microservices and monolithic architecture?",
        "How do you handle state management in a large React application?",
        "Explain the concept of CI/CD and its importance."
      ],
      senior: [
        "How would you design a scalable system architecture?",
        "What strategies would you use to mentor junior developers?",
        "How do you approach technical debt in a legacy codebase?",
        "Explain your experience with system design and trade-offs.",
        "How would you handle a production outage?"
      ]
    },
    'data-scientist': {
      entry: [
        "What is the difference between supervised and unsupervised learning?",
        "How would you handle missing data in a dataset?",
        "What is overfitting and how can you prevent it?",
        "Explain the concept of cross-validation.",
        "What is the difference between correlation and causation?"
      ],
      mid: [
        "How would you explain a complex model to a non-technical stakeholder?",
        "What is feature engineering and why is it important?",
        "How do you evaluate the performance of a classification model?",
        "Explain the concept of bias-variance tradeoff.",
        "How would you handle imbalanced datasets?"
      ],
      senior: [
        "How would you design an ML pipeline for production?",
        "What strategies would you use for model interpretability?",
        "How do you approach A/B testing for ML models?",
        "Explain your experience with big data technologies.",
        "How would you handle model drift in production?"
      ]
    },
    'product-manager': {
      entry: [
        "How do you prioritize features in a product roadmap?",
        "What metrics would you track for a social media app?",
        "How do you gather user requirements?",
        "What is the difference between a product manager and a project manager?",
        "How do you handle conflicting requirements from stakeholders?"
      ],
      mid: [
        "How do you measure the success of a product launch?",
        "What is your approach to user research and validation?",
        "How do you handle scope creep in a project?",
        "Explain your experience with agile methodologies.",
        "How do you balance user needs with business goals?"
      ],
      senior: [
        "How would you develop a product strategy for a new market?",
        "What is your approach to building and leading product teams?",
        "How do you handle product-market fit challenges?",
        "Explain your experience with go-to-market strategies.",
        "How do you approach product innovation and experimentation?"
      ]
    }
  };

  return questionBank[jobRole as keyof typeof questionBank]?.[experienceLevel as keyof typeof questionBank['software-engineer']] || 
         questionBank['software-engineer'].entry;
} 