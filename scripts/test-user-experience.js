/**
 * Test script to simulate user experience and identify issues
 * Run with: node scripts/test-user-experience.js
 */

async function testUserExperience() {
  console.log("🧪 Testing User Experience...\n");

  try {
    // Test 1: Check if server is running
    console.log("1. Checking server status...");
    const serverResponse = await fetch("http://localhost:3000");
    if (serverResponse.ok) {
      console.log("   ✅ Server is running");
    } else {
      console.log("   ❌ Server error:", serverResponse.status);
      return;
    }

    // Test 2: Create interview with multi-interviewer
    console.log("\n2. Creating multi-interviewer interview...");
    const createResponse = await fetch("http://localhost:3000/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "TEXT",
        position: "Software Engineer",
        interviewType: "technical",
        useMultiInterviewers: true,
        transcript: { candidateName: "Test User" },
      }),
    });

    if (!createResponse.ok) {
      console.log("   ❌ Failed to create interview:", createResponse.status);
      const errorText = await createResponse.text();
      console.log("   Error:", errorText);
      return;
    }

    const interview = await createResponse.json();
    console.log("   ✅ Interview created:", interview.interview.id);
    console.log("   Metadata:", interview.interview.metadata);

    // Test 3: Test collaborative chat API
    console.log("\n3. Testing collaborative chat...");
    const chatResponse = await fetch(
      "http://localhost:3000/api/chat/collaborative",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "Hello, I'm excited about this interview!",
            },
          ],
          interviewState: {
            position: "Software Engineer",
            interviewType: "technical",
            flow: {
              sections: [
                {
                  id: "intro",
                  title: "Introduction",
                  focusAreas: ["background"],
                },
              ],
            },
            currentSectionId: "intro",
            sectionIndex: 0,
            responses: [],
            startTime: Date.now(),
          },
          honchoWorkspaceId: "test-workspace",
          candidateId: "test-candidate",
        }),
      }
    );

    if (chatResponse.ok) {
      console.log("   ✅ Collaborative chat API responding");
      console.log(
        "   Response type:",
        chatResponse.headers.get("content-type")
      );
    } else {
      console.log("   ❌ Chat API error:", chatResponse.status);
      const errorText = await chatResponse.text();
      console.log("   Error:", errorText);
    }

    // Test 4: Check for common issues
    console.log("\n4. Checking for common issues...");

    // Check if Honcho SDK is accessible
    try {
      const { honchoClient } = await import("../lib/honcho-client.js");
      console.log("   ✅ Honcho client accessible");
    } catch (error) {
      console.log("   ❌ Honcho client error:", error.message);
    }

    console.log("\n🎉 User experience test completed!");
    console.log("\n💡 If users are experiencing issues:");
    console.log("1. Check browser console for JavaScript errors");
    console.log("2. Verify OPENAI_API_KEY is set correctly");
    console.log("3. Make sure to toggle 'Collaborative AI Panel' ON");
    console.log("4. Use TEXT mode (not video) for multi-interviewer");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n🔧 Common fixes:");
    console.log("1. Run: npm run dev");
    console.log("2. Check .env.local has OPENAI_API_KEY");
    console.log("3. Restart the development server");
  }
}

// Run the test
testUserExperience();
