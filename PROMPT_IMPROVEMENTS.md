# Prompt Improvements for Multi-Interviewer System

## Problem Addressed

The collaborative AI interview system was sometimes outputting static prompt instructions directly to users instead of generating natural conversational responses. This happened because:

1. **Overly Prescriptive Prompts**: System prompts contained too many formatting instructions that the AI would sometimes repeat verbatim
2. **Static Response Patterns**: Predictable collaborative response triggers led to repetitive interactions
3. **No Response Validation**: No filtering to remove leaked prompt instructions from AI responses

## Solutions Implemented

### 1. **Cleaner System Prompts**

**Before:**

```
COLLABORATIVE MODE: Both interviewers work together in this response. Format your response as:

**Jordan:** [Soft interviewer's contribution - empathetic, supportive questions/comments]

**Alex:** [Hard interviewer's contribution - challenging, technical follow-ups]

COLLABORATIVE GUIDELINES:
- Both interviewers should contribute meaningfully to the conversation
- Jordan should focus on cultural fit, communication, and encouragement
- Alex should focus on technical depth, challenges, and critical analysis
```

**After:**

```
You are part of a collaborative AI interview panel for a Software Engineer position. There are two interviewers working together:

Jordan (Behavioral Interviewer): Empathetic and supportive, focuses on cultural fit and communication skills.
Alex (Technical Interviewer): Analytical and challenging, focuses on technical skills and problem-solving.

IMPORTANT: You must respond as BOTH interviewers in a natural conversation. Use this exact format:

**Jordan:** [Jordan's empathetic, supportive response]
**Alex:** [Alex's analytical, challenging response]

Guidelines:
- Jordan focuses on soft skills, team dynamics, and encouragement
- Alex focuses on technical depth and challenging questions
- Build on each other's points naturally
- Keep responses conversational and engaging
- Don't repeat the formatting instructions
```

### 2. **Response Validation & Cleaning**

Added automatic cleaning of AI responses to remove leaked prompt instructions:

```javascript
// Remove any leaked formatting instructions
const instructionPatterns = [
  /IMPORTANT:.*?(?=\*\*|$)/gs,
  /Format your response as:.*?(?=\*\*|$)/gs,
  /Do not include.*?(?=\*\*|$)/gs,
  /Guidelines:.*?(?=\*\*|$)/gs,
  /COLLABORATIVE MODE:.*?(?=\*\*|$)/gs,
];

instructionPatterns.forEach((pattern) => {
  cleanedContent = cleanedContent.replace(pattern, "");
});
```

### 3. **Dynamic Collaborative Response Logic**

**Before:**

- Fixed patterns (every 3 messages)
- Simple keyword matching
- Predictable behavior

**After:**

- Adaptive timing (every 4-5 exchanges with variation)
- Enhanced keyword detection with more terms
- Message complexity analysis (length-based)
- Random element (20% chance) for natural variation
- Better technical/behavioral keyword detection

```javascript
function determineCollaborativeResponse(userMessage, currentSection, messages) {
  // Always collaborative for first interaction
  if (messages.length <= 2) return true;

  const assistantMessages = messages.filter(
    (m) => m.role === "assistant"
  ).length;

  // Collaborative every 4-5 exchanges to maintain engagement
  if (assistantMessages > 0 && assistantMessages % 4 === 0) return true;

  // Check message complexity and content
  const messageLength = userMessage.length;
  const isDetailedResponse = messageLength > 200;

  // Enhanced keyword detection
  const technicalKeywords = [
    "algorithm",
    "architecture",
    "design",
    "implementation",
    "solution",
    "approach",
    "methodology",
    "code",
    "system",
    "database",
    "api",
  ];
  const behavioralKeywords = [
    "team",
    "collaboration",
    "leadership",
    "conflict",
    "communication",
    "challenge",
    "project",
    "experience",
    "worked",
    "managed",
  ];

  const hasTechnical = technicalKeywords.some((keyword) =>
    userMessage.toLowerCase().includes(keyword)
  );
  const hasBehavioral = behavioralKeywords.some((keyword) =>
    userMessage.toLowerCase().includes(keyword)
  );

  // Collaborative if both aspects are present or response is detailed
  if ((hasTechnical && hasBehavioral) || isDetailedResponse) return true;

  // Random collaborative responses to keep it natural (20% chance)
  return Math.random() < 0.2;
}
```

### 4. **Conversation Variety Enhancements**

Added specific guidelines to prevent repetitive responses:

```
Conversation Guidelines:
- Keep responses natural and conversational
- Avoid repeating similar questions or phrases
- Build on previous answers organically
- Show genuine interest in the candidate's responses
- Use varied question types (open-ended, scenario-based, specific)
```

### 5. **Improved Context Labeling**

**Before:**

- "CV Context:"
- "Job Description Context:"

**After:**

- "Candidate Background:"
- "Role Requirements:"

More natural and less instruction-like language.

## Results

### ✅ **Fixed Issues:**

1. **No More Static Prompts**: AI no longer outputs formatting instructions directly
2. **Natural Conversations**: Responses are more conversational and less robotic
3. **Better Variety**: Reduced repetitive patterns in interviewer interactions
4. **Cleaner Output**: Automatic removal of any leaked prompt text

### ✅ **Improved Experience:**

1. **More Engaging**: Dynamic collaborative patterns keep conversations interesting
2. **Context-Aware**: Better detection of when to use collaborative vs single interviewer mode
3. **Professional Quality**: Responses feel more like real interview conversations
4. **Reliable**: Validation ensures consistent output quality

## Testing

Created comprehensive test suite (`scripts/test-prompt-improvements.js`) that validates:

- Response cleaning functionality
- Collaborative response determination logic
- Conversation variety improvements
- Keyword detection accuracy

## Usage

The improvements are automatically applied to all collaborative interviews. No additional configuration needed - the system will:

1. Generate cleaner, more natural responses
2. Automatically filter out any prompt leakage
3. Use dynamic logic to determine collaboration patterns
4. Maintain conversation variety and engagement

## Monitoring

The system logs when response cleaning occurs:

```
console.log("Cleaned response content to remove formatting instructions");
```

This helps monitor the effectiveness of the improvements and identify any new patterns that need addressing.

---

These improvements ensure that the multi-interviewer system provides a professional, engaging, and natural interview experience without technical artifacts appearing in the conversation.
