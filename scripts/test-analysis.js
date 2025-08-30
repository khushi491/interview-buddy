/**
 * Test script for interview analysis endpoints
 * Run with: node scripts/test-analysis.js
 */

const { exec } = require('child_process');

const TEST_CHAT_ANALYSIS_PAYLOAD = {
  interviewData: {
    position: "Software Engineer",
    type: "behavioral",
    candidateName: "Test Candidate",
    duration: 600, // 10 minutes
    messages: [
      {
        role: "assistant",
        content: "Tell me about a challenging project you've worked on recently."
      },
      {
        role: "user", 
        content: "I worked on a React application where I had to integrate multiple APIs and handle complex state management. The biggest challenge was optimizing performance when dealing with large datasets. I used React.memo and useMemo hooks to prevent unnecessary re-renders, and implemented virtualization for long lists."
      },
      {
        role: "assistant",
        content: "How did you handle error scenarios and edge cases?"
      },
      {
        role: "user",
        content: "I implemented comprehensive error boundaries and created fallback UI components. For API errors, I used retry logic with exponential backoff. I also added loading states and handled network failures gracefully by caching data locally when possible."
      }
    ]
  }
};

const TEST_VIDEO_ANALYSIS_PAYLOAD = {
  interviewId: "test-interview-id",
  transcript: [
    {
      speaker: "interviewer",
      text: "What programming languages are you most comfortable with?",
      timestamp: 0
    },
    {
      speaker: "candidate", 
      text: "I'm most comfortable with JavaScript and Python. I've been working with JavaScript for about 5 years, primarily with React and Node.js. With Python, I've done data analysis and backend development using Django and Flask.",
      timestamp: 15000
    },
    {
      speaker: "interviewer",
      text: "Can you describe your experience with databases?",
      timestamp: 45000
    },
    {
      speaker: "candidate",
      text: "I have experience with both SQL and NoSQL databases. I've worked extensively with PostgreSQL and MySQL for relational data, and MongoDB for document storage. I'm comfortable writing complex queries and optimizing database performance.",
      timestamp: 60000
    }
  ],
  duration: 120, // 2 minutes
  position: "Full Stack Developer",
  cvText: "Experienced software developer with 5+ years in web development",
  jobDescription: "Looking for a full stack developer with experience in modern web technologies",
  mode: "video"
};

async function testChatAnalysis() {
  console.log('\n🧪 Testing Chat Analysis Endpoint...');
  console.log('===================================');
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CHAT_ANALYSIS_PAYLOAD)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chat Analysis succeeded!');
      console.log('Response structure:');
      console.log({
        hasOverallScore: typeof data.overallScore === 'number',
        hasStrengths: Array.isArray(data.strengths) && data.strengths.length > 0,
        hasImprovementAreas: Array.isArray(data.improvementAreas) && data.improvementAreas.length > 0,
        hasTechnicalSkills: data.technicalSkills && typeof data.technicalSkills.score === 'number',
        hasCommunication: data.communication && typeof data.communication.score === 'number',
        hasProblemSolving: data.problemSolving && typeof data.problemSolving.score === 'number',
        hasCulturalFit: data.culturalFit && typeof data.culturalFit.score === 'number',
        hasRecommendation: ['HIRE', 'MAYBE', 'NO_HIRE'].includes(data.recommendation),
        hasSummary: typeof data.summary === 'string',
        hasKeyInsights: Array.isArray(data.keyInsights)
      });
      
      // Log scores
      console.log('Scores:');
      console.log(`  Overall: ${data.overallScore}/10`);
      console.log(`  Technical: ${data.technicalSkills?.score || 'N/A'}/10`);
      console.log(`  Communication: ${data.communication?.score || 'N/A'}/10`);
      console.log(`  Problem Solving: ${data.problemSolving?.score || 'N/A'}/10`);
      console.log(`  Cultural Fit: ${data.culturalFit?.score || 'N/A'}/10`);
      console.log(`  Recommendation: ${data.recommendation}`);
      
    } else {
      const error = await response.text();
      console.log('❌ Chat Analysis failed!');
      console.log(`Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Chat Analysis request failed!');
    console.log(`Error: ${error.message}`);
    return false;
  }
  
  return true;
}

async function testVideoAnalysis() {
  console.log('\n🎥 Testing Video Analysis Endpoint...');
  console.log('====================================');
  
  try {
    const response = await fetch('http://localhost:3000/api/interviews/video-analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_VIDEO_ANALYSIS_PAYLOAD)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Video Analysis succeeded!');
      console.log('Response structure:');
      console.log({
        success: data.success,
        hasAnalysis: !!data.analysis,
        hasInterview: !!data.interview,
        shouldEnd: data.shouldEnd,
        timeRemaining: data.timeRemaining
      });
      
      if (data.analysis) {
        const analysis = data.analysis;
        console.log('Analysis structure:');
        console.log({
          hasOverallScore: typeof analysis.overallScore === 'number',
          hasStrengths: Array.isArray(analysis.strengths) && analysis.strengths.length > 0,
          hasImprovementAreas: Array.isArray(analysis.improvementAreas) && analysis.improvementAreas.length > 0,
          hasTechnicalSkills: analysis.technicalSkills && typeof analysis.technicalSkills.score === 'number',
          hasCommunication: analysis.communication && typeof analysis.communication.score === 'number',
          hasProblemSolving: analysis.problemSolving && typeof analysis.problemSolving.score === 'number',
          hasCulturalFit: analysis.culturalFit && typeof analysis.culturalFit.score === 'number',
          hasRecommendation: ['HIRE', 'MAYBE', 'NO_HIRE'].includes(analysis.recommendation),
          hasSummary: typeof analysis.summary === 'string',
          hasKeyInsights: Array.isArray(analysis.keyInsights)
        });
        
        // Log scores
        console.log('Scores:');
        console.log(`  Overall: ${analysis.overallScore}/10`);
        console.log(`  Technical: ${analysis.technicalSkills?.score || 'N/A'}/10`);
        console.log(`  Communication: ${analysis.communication?.score || 'N/A'}/10`);
        console.log(`  Problem Solving: ${analysis.problemSolving?.score || 'N/A'}/10`);
        console.log(`  Cultural Fit: ${analysis.culturalFit?.score || 'N/A'}/10`);
        console.log(`  Recommendation: ${analysis.recommendation}`);
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Video Analysis failed!');
      console.log(`Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Video Analysis request failed!');
    console.log(`Error: ${error.message}`);
    return false;
  }
  
  return true;
}

async function runTests() {
  console.log('🚀 Starting Interview Analysis Tests');
  console.log('=====================================');
  console.log('Note: Make sure the development server is running on localhost:3000');
  console.log('Note: These tests will fail without proper authentication setup');
  
  const results = [];
  
  // Test chat analysis
  results.push(await testChatAnalysis());
  
  // Test video analysis  
  results.push(await testVideoAnalysis());
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  if (passed === total) {
    console.log(`✅ All tests passed! (${passed}/${total})`);
  } else {
    console.log(`❌ Some tests failed! (${passed}/${total} passed)`);
  }
  
  console.log('\n💡 Debugging Tips:');
  console.log('- Check server logs for detailed error information');
  console.log('- Verify OpenAI API key is configured');
  console.log('- Ensure database connection is working');
  console.log('- Check authentication middleware');
  
  process.exit(passed === total ? 0 : 1);
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or a fetch polyfill');
  process.exit(1);
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});