/**
 * Debug script to check multi-interviewer setup
 * Run with: node scripts/debug-multi-interviewer.js
 */

const fs = require("fs");

function debugMultiInterviewer() {
  console.log("🔍 Debugging Multi-Interviewer Setup...\n");

  // Check if the collaborative room component exists and is properly exported
  console.log("1. Checking Collaborative Chat Interview Room...");
  const collaborativeRoomPath =
    "components/chat-interview/collaborative-chat-interview-room.tsx";

  if (fs.existsSync(collaborativeRoomPath)) {
    const content = fs.readFileSync(collaborativeRoomPath, "utf8");
    const hasExport = content.includes(
      "export function CollaborativeChatInterviewRoom"
    );
    const hasMultiInterviewerDisplay = content.includes(
      "MultiInterviewerDisplay"
    );
    const hasInterviewerMessage = content.includes("InterviewerMessage");

    console.log(`   ✅ File exists: ${collaborativeRoomPath}`);
    console.log(
      `   ${hasExport ? "✅" : "❌"} Exports CollaborativeChatInterviewRoom`
    );
    console.log(
      `   ${
        hasMultiInterviewerDisplay ? "✅" : "❌"
      } Uses MultiInterviewerDisplay`
    );
    console.log(
      `   ${hasInterviewerMessage ? "✅" : "❌"} Uses InterviewerMessage`
    );
  } else {
    console.log(`   ❌ File missing: ${collaborativeRoomPath}`);
  }

  // Check if the interview page imports the collaborative room
  console.log("\n2. Checking Interview Page Import...");
  const interviewPagePath = "app/interview/[id]/page.tsx";

  if (fs.existsSync(interviewPagePath)) {
    const content = fs.readFileSync(interviewPagePath, "utf8");
    const hasImport = content.includes("CollaborativeChatInterviewRoom");
    const hasRouting = content.includes(
      'if (config.useMultiInterviewers && config.mode === "text")'
    );
    const hasMetadataAccess = content.includes(
      "interview.metadata?.useMultiInterviewers"
    );

    console.log(`   ✅ File exists: ${interviewPagePath}`);
    console.log(
      `   ${hasImport ? "✅" : "❌"} Imports CollaborativeChatInterviewRoom`
    );
    console.log(
      `   ${hasRouting ? "✅" : "❌"} Has routing logic for multi-interviewer`
    );
    console.log(
      `   ${
        hasMetadataAccess ? "✅" : "❌"
      } Accesses metadata.useMultiInterviewers`
    );
  } else {
    console.log(`   ❌ File missing: ${interviewPagePath}`);
  }

  // Check if the start dialog has the toggle
  console.log("\n3. Checking Start Interview Dialog...");
  const dialogPath = "components/start-interview-dialog.tsx";

  if (fs.existsSync(dialogPath)) {
    const content = fs.readFileSync(dialogPath, "utf8");
    const hasToggleState = content.includes(
      "useMultiInterviewers, setUseMultiInterviewers"
    );
    const hasToggleUI = content.includes("Collaborative AI Panel");
    const hasToggleInConfig = content.includes("useMultiInterviewers,");

    console.log(`   ✅ File exists: ${dialogPath}`);
    console.log(
      `   ${hasToggleState ? "✅" : "❌"} Has useMultiInterviewers state`
    );
    console.log(`   ${hasToggleUI ? "✅" : "❌"} Has toggle UI`);
    console.log(
      `   ${
        hasToggleInConfig ? "✅" : "❌"
      } Passes useMultiInterviewers in config`
    );
  } else {
    console.log(`   ❌ File missing: ${dialogPath}`);
  }

  // Check if the API stores the flag
  console.log("\n4. Checking API Storage...");
  const apiPath = "app/api/interviews/route.ts";

  if (fs.existsSync(apiPath)) {
    const content = fs.readFileSync(apiPath, "utf8");
    const hasDestructure = content.includes("useMultiInterviewers = false");
    const hasMetadata = content.includes("metadata: {");
    const hasMetadataStorage = content.includes("useMultiInterviewers,");

    console.log(`   ✅ File exists: ${apiPath}`);
    console.log(
      `   ${hasDestructure ? "✅" : "❌"} Destructures useMultiInterviewers`
    );
    console.log(`   ${hasMetadata ? "✅" : "❌"} Has metadata object`);
    console.log(
      `   ${
        hasMetadataStorage ? "✅" : "❌"
      } Stores useMultiInterviewers in metadata`
    );
  } else {
    console.log(`   ❌ File missing: ${apiPath}`);
  }

  // Check collaborative API
  console.log("\n5. Checking Collaborative API...");
  const collaborativeApiPath = "app/api/chat/collaborative/route.ts";

  if (fs.existsSync(collaborativeApiPath)) {
    const content = fs.readFileSync(collaborativeApiPath, "utf8");
    const hasPersonas = content.includes("INTERVIEWER_PERSONAS");
    const hasCollaborativeLogic = content.includes(
      "determineCollaborativeResponse"
    );
    const hasResponseCleaning = content.includes("cleanedContent");

    console.log(`   ✅ File exists: ${collaborativeApiPath}`);
    console.log(`   ${hasPersonas ? "✅" : "❌"} Uses INTERVIEWER_PERSONAS`);
    console.log(
      `   ${hasCollaborativeLogic ? "✅" : "❌"} Has collaborative logic`
    );
    console.log(
      `   ${hasResponseCleaning ? "✅" : "❌"} Has response cleaning`
    );
  } else {
    console.log(`   ❌ File missing: ${collaborativeApiPath}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🔧 TROUBLESHOOTING STEPS:");
  console.log(
    '1. Make sure to toggle "Collaborative AI Panel" ON when creating interview'
  );
  console.log("2. Check browser console for any JavaScript errors");
  console.log(
    '3. Verify the interview is created with mode="text" (not video)'
  );
  console.log(
    "4. Check if interview.metadata.useMultiInterviewers is true in database"
  );
  console.log("\n💡 To test:");
  console.log("1. npm run dev");
  console.log('2. Create interview with "Collaborative AI Panel" enabled');
  console.log("3. Look for Jordan and Alex personas in the UI");
}

// Run debug
debugMultiInterviewer();
