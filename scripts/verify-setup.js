/**
 * Verify that the environment is set up correctly for testing
 * Run with: node scripts/verify-setup.js
 */

const fs = require("fs");
const path = require("path");

function verifySetup() {
  console.log("🔍 Verifying Multi-Interviewer Setup...\n");

  const checks = [
    {
      name: "Environment file exists",
      check: () => fs.existsSync(".env.local") || fs.existsSync(".env"),
      fix: "Create .env.local with OPENAI_API_KEY and Honcho config",
    },
    {
      name: "Honcho client configured",
      check: () => fs.existsSync("lib/honcho-client.ts"),
      fix: "Honcho client file is missing",
    },
    {
      name: "Collaborative API exists",
      check: () => fs.existsSync("app/api/chat/collaborative/route.ts"),
      fix: "Collaborative chat API is missing",
    },
    {
      name: "Multi-interviewer UI exists",
      check: () => fs.existsSync("components/multi-interviewer-display.tsx"),
      fix: "Multi-interviewer UI component is missing",
    },
    {
      name: "Collaborative room exists",
      check: () =>
        fs.existsSync(
          "components/chat-interview/collaborative-chat-interview-room.tsx"
        ),
      fix: "Collaborative interview room is missing",
    },
    {
      name: "Package dependencies",
      check: () => {
        const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
        return (
          packageJson.dependencies["@honcho-ai/sdk"] &&
          packageJson.dependencies["ai"]
        );
      },
      fix: "Run: npm install @honcho-ai/sdk ai",
    },
  ];

  let allPassed = true;

  checks.forEach((check, index) => {
    const passed = check.check();
    const status = passed ? "✅" : "❌";
    console.log(`${index + 1}. ${status} ${check.name}`);

    if (!passed) {
      console.log(`   💡 Fix: ${check.fix}`);
      allPassed = false;
    }
  });

  console.log("\n" + "=".repeat(50));

  if (allPassed) {
    console.log(
      "🎉 All checks passed! You can test the multi-interviewer system."
    );
    console.log("\nNext steps:");
    console.log("1. Run: npm run dev");
    console.log("2. Open: http://localhost:3000");
    console.log('3. Toggle "Collaborative AI Panel" when creating interview');
  } else {
    console.log("❌ Some checks failed. Please fix the issues above.");
  }

  // Check environment variables if .env file exists
  if (fs.existsSync(".env.local")) {
    console.log("\n📋 Environment Variables:");
    const envContent = fs.readFileSync(".env.local", "utf8");
    const hasOpenAI = envContent.includes("OPENAI_API_KEY");
    const hasHoncho = envContent.includes("HONCHO_BASE_URL");

    console.log(`   ${hasOpenAI ? "✅" : "❌"} OPENAI_API_KEY configured`);
    console.log(`   ${hasHoncho ? "✅" : "❌"} HONCHO_BASE_URL configured`);

    if (!hasOpenAI) console.log("   💡 Add: OPENAI_API_KEY=your-key-here");
    if (!hasHoncho)
      console.log("   💡 Add: HONCHO_BASE_URL=https://demo.honcho.dev");
  }
}

// Run verification
verifySetup();
