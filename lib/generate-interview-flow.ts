import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export interface InterviewFlowSection {
    id: string;
    title: string;
    description: string;
    order: number;
    estimatedDuration: number; // in minutes
    focusAreas: string[];
}

export interface InterviewFlow {
    sections: InterviewFlowSection[];
    totalDuration: number;
    difficulty: 'entry' | 'mid' | 'senior';
    focus: string; // e.g., 'technical', 'behavioral', 'mixed'
}

export async function generateInterviewFlow(
    position: string,
    interviewType: string,
    resumeData?: any,
    jobDescription?: string,
    cvText?: string,
    difficulty?: "easy" | "medium" | "hard"
): Promise<InterviewFlow> {
    try {
        const resumeSummary = resumeData
            ? extractResumeSummary(resumeData)
            : cvText
                ? 'CV text provided'
                : 'No resume provided';

        const context = {
            position,
            interviewType,
            resumeSummary,
            jobDescription: jobDescription || 'No job description provided',
            cvText: cvText || 'No CV text provided',
            difficulty: difficulty || 'medium',
        };

        const prompt = `
You are an expert interview designer. Create a personalized interview flow for a ${context.interviewType} interview for a ${context.position} role.

Context:
- Resume Summary: ${context.resumeSummary}
- Job Description: ${context.jobDescription}
- Difficulty Level: ${context.difficulty}

Generate a structured interview flow with 5–7 sections. Each section should:
1. Have a clear, professional title
2. Include a 1–2 sentence description
3. Be relevant to the role
4. Flow logically
5. Match the difficulty level (${context.difficulty})
6. Include: { id, title, description, order, estimatedDuration (in minutes), focusAreas }

Difficulty Guidelines:
- Easy: Basic questions, fundamental concepts, entry-level expectations
- Medium: Standard questions, practical scenarios, mid-level expectations  
- Hard: Advanced questions, complex scenarios, senior-level expectations

Return a single JSON object with this exact format:
{
  "sections": [
    {
      "id": "unique-id",
      "title": "Section Title",
      "description": "What this section covers",
      "order": 1,
      "estimatedDuration": 10,
      "focusAreas": ["area1", "area2"]
    }
  ],
  "totalDuration": 60,
  "difficulty": "${context.difficulty}",
  "focus": "technical|behavioral|mixed"
}
`;

        const { text } = await generateText({
            model: openai('gpt-4'),
            system: "You are an expert interview designer who always returns structured JSON. No explanations. No markdown. JSON only.",
            prompt,
            temperature: 0.7,
        });

        if (!text) throw new Error('No response from AI');

        const flow = JSON.parse(text) as InterviewFlow;

        if (!Array.isArray(flow.sections)) {
            throw new Error('Invalid AI response structure');
        }

        return flow;
    } catch (error) {
        console.error('Interview flow generation failed:', error);
        return generateFallbackFlow(position, interviewType);
    }
}


function extractResumeSummary(resumeData: any): string {
    try {
        // Extract key information from resume data
        const summary = [];

        if (resumeData.basics?.summary) {
            summary.push(`Summary: ${resumeData.basics.summary}`);
        }

        if (resumeData.work && Array.isArray(resumeData.work)) {
            const workExperience = resumeData.work
                .slice(0, 3) // Take first 3 experiences
                .map((work: any) => `${work.position} at ${work.name}`)
                .join(', ');
            summary.push(`Recent Experience: ${workExperience}`);
        }

        if (resumeData.skills && Array.isArray(resumeData.skills)) {
            const skills = resumeData.skills
                .slice(0, 10) // Take first 10 skills
                .map((skill: any) => skill.name || skill)
                .join(', ');
            summary.push(`Key Skills: ${skills}`);
        }

        return summary.join('. ') || 'Resume data available';
    } catch (error) {
        return 'Resume data available';
    }
}

function generateFallbackFlow(position: string, interviewType: string): InterviewFlow {
    // Fallback flow when AI generation fails
    const baseSections = [
        {
            id: "introduction",
            title: "Introduction & Background",
            description: "Getting to know the candidate and their background",
            order: 1,
            estimatedDuration: 5,
            focusAreas: ["communication", "background"]
        },
        {
            id: "experience",
            title: "Experience & Skills",
            description: "Deep dive into relevant experience and technical skills",
            order: 2,
            estimatedDuration: 15,
            focusAreas: ["experience", "skills"]
        },
        {
            id: "problem-solving",
            title: "Problem Solving",
            description: "Assessing problem-solving approach and critical thinking",
            order: 3,
            estimatedDuration: 15,
            focusAreas: ["problem-solving", "critical-thinking"]
        },
        {
            id: "behavioral",
            title: "Behavioral Questions",
            description: "Understanding work style, collaboration, and past experiences",
            order: 4,
            estimatedDuration: 15,
            focusAreas: ["behavioral", "collaboration"]
        },
        {
            id: "closing",
            title: "Closing & Questions",
            description: "Candidate questions and final thoughts",
            order: 5,
            estimatedDuration: 10,
            focusAreas: ["questions", "closing"]
        }
    ];

    return {
        sections: baseSections,
        totalDuration: 60,
        difficulty: "mid",
        focus: "mixed"
    };
} 