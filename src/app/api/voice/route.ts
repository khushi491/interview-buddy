import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  try {
    const { action, text, audioData, jobRole, experienceLevel } = await request.json();

    switch (action) {
      case 'analyze_speech':
        return await analyzeSpeech(text, jobRole, experienceLevel);
      
      case 'generate_speech_prompt':
        return await generateSpeechPrompt(text, jobRole, experienceLevel);
      
      case 'enhance_transcript':
        return await enhanceTranscript(text);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in voice API:', error);
    return NextResponse.json(
      { error: 'Failed to process voice request' },
      { status: 500 }
    );
  }
}

async function analyzeSpeech(text: string, jobRole: string, experienceLevel: string) {
  if (!openai) {
    return NextResponse.json({
      analysis: {
        clarity: 'Good',
        confidence: 'High',
        suggestions: ['Consider speaking more slowly for better clarity', 'Add more specific examples to strengthen your response']
      },
      message: 'Using fallback analysis (OpenAI API key not configured)'
    });
  }

  try {
    const prompt = `Analyze this interview response for a ${experienceLevel} level ${jobRole} position:

Response: "${text}"

Please provide analysis on:
1. Speech clarity and articulation
2. Confidence level in delivery
3. Technical accuracy
4. Communication effectiveness
5. Suggestions for improvement

Format as JSON with fields: clarity, confidence, suggestions (array of strings)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert speech analyst and interview coach."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    try {
      const analysis = JSON.parse(response);
      return NextResponse.json({ analysis });
    } catch (parseError) {
      return NextResponse.json({
        analysis: {
          clarity: 'Good',
          confidence: 'High',
          suggestions: ['Consider speaking more slowly for better clarity', 'Add more specific examples to strengthen your response']
        },
        message: 'AI response parsing failed, using fallback analysis'
      });
    }
  } catch (error) {
    console.error('Error analyzing speech:', error);
    return NextResponse.json({
      analysis: {
        clarity: 'Good',
        confidence: 'High',
        suggestions: ['Consider speaking more slowly for better clarity', 'Add more specific examples to strengthen your response']
      },
      message: 'Error occurred, using fallback analysis'
    });
  }
}

async function generateSpeechPrompt(text: string, jobRole: string, experienceLevel: string) {
  if (!openai) {
    return NextResponse.json({
      prompt: `You are interviewing for a ${experienceLevel} level ${jobRole} position. Please provide a clear and confident response to: ${text}`,
      message: 'Using fallback speech prompt (OpenAI API key not configured)'
    });
  }

  try {
    const prompt = `Generate a helpful speech prompt for a ${experienceLevel} level ${jobRole} interview question:

Question: "${text}"

Create a brief, encouraging prompt that helps the candidate:
1. Structure their response
2. Include relevant examples
3. Speak with confidence
4. Stay focused on the topic

Keep it under 2 sentences.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach helping candidates prepare their responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    return NextResponse.json({
      prompt: response || `You are interviewing for a ${experienceLevel} level ${jobRole} position. Please provide a clear and confident response to: ${text}`
    });
  } catch (error) {
    console.error('Error generating speech prompt:', error);
    return NextResponse.json({
      prompt: `You are interviewing for a ${experienceLevel} level ${jobRole} position. Please provide a clear and confident response to: ${text}`,
      message: 'Error occurred, using fallback speech prompt'
    });
  }
}

async function enhanceTranscript(text: string) {
  if (!openai) {
    return NextResponse.json({
      enhanced: text,
      message: 'Using original transcript (OpenAI API key not configured)'
    });
  }

  try {
    const prompt = `Enhance this interview response transcript by:
1. Fixing grammar and punctuation
2. Improving clarity and flow
3. Maintaining the original meaning and tone
4. Making it more professional

Original: "${text}"

Return only the enhanced version.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert editor improving interview response transcripts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const enhanced = completion.choices[0]?.message?.content || text;
    
    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error('Error enhancing transcript:', error);
    return NextResponse.json({
      enhanced: text,
      message: 'Error occurred, using original transcript'
    });
  }
} 