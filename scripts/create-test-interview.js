/**
 * Create a test interview with multi-interviewer enabled
 * This simulates what happens when you create an interview via the UI
 */

async function createTestInterview() {
  console.log("🧪 Creating Test Interview with Multi-Interviewer...\n");

  const testPayload = {
    type: "TEXT", // Important: Must be TEXT, not AUDIO/VIDEO
    position: "Software Engineer",
    interviewType: "technical",
    difficulty: "medium",
    jobDescription:
      "Looking for a full-stack developer with React and Node.js experience",
    cvText: "Experienced software engineer with 5 years in web development",
    useMultiInterviewers: true, // This is the key flag!
    transcript: {
      candidateName: "Test Candidate",
      startTime: new Date().toISOString(),
    },
  };

  try {
    console.log("📤 Sending interview creation request...");
    console.log("Payload:", JSON.stringify(testPayload, null, 2));

    const response = await fetch("http://localhost:3000/api/interviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Interview created successfully!");
    console.log("Interview ID:", result.interview.id);
    console.log("Metadata:", result.interview.metadata);

    // Check if useMultiInterviewers was stored
    if (result.interview.metadata?.useMultiInterviewers) {
      console.log("🤝 ✅ Multi-interviewer flag is set!");
      console.log(
        `🔗 Test URL: http://localhost:3000/interview/${result.interview.id}`
      );
      console.log("\n💡 Open this URL to see the multi-interviewer interface");
    } else {
      console.log("❌ Multi-interviewer flag was not stored properly");
      console.log("Check the API implementation");
    }
  } catch (error) {
    console.error("❌ Failed to create test interview:", error.message);
    console.log("\n💡 Make sure:");
    console.log("1. Development server is running (npm run dev)");
    console.log("2. Database is connected");
    console.log("3. OPENAI_API_KEY is set in .env.local");
  }
}

// Check if server is running first
console.log("Checking if development server is running...");
fetch("http://localhost:3000")
  .then(() => {
    console.log("✅ Server is running\n");
    return createTestInterview();
  })
  .catch(() => {
    console.log("❌ Server is not running");
    console.log("Please run: npm run dev");
    console.log("Then try this script again");
  });
