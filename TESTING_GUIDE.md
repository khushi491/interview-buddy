# 🧪 Testing Guide: Multi-Interviewer System

This guide shows you how to test the improved multi-interviewer system and verify that the static prompt issues are fixed.

## 🚀 Quick Start Testing

### 1. **Environment Check**

```bash
node scripts/verify-setup.js
```

This verifies all components are installed and configured correctly.

### 2. **Run Tests**

```bash
node scripts/test-prompt-improvements.js
```

This tests the response cleaning and collaborative logic.

### 3. **Start Development Server**

```bash
npm run dev
```

Then open http://localhost:3000

## 🎯 Manual Testing Scenarios

### **Scenario 1: First Interaction (Should be Collaborative)**

1. Create new interview with "Collaborative AI Panel" **enabled**
2. Type: `"Hello, I'm excited about this interview!"`

**Expected Response:**

```
**Jordan:** Welcome! I'm Jordan, your behavioral interviewer. I'm here to learn about your background and how you work with teams.

**Alex:** And I'm Alex, focusing on the technical aspects. I'm excited to dive into your technical skills and problem-solving approach.
```

**❌ Should NOT see:**

- `IMPORTANT: Format your response as:`
- `Guidelines:`
- `COLLABORATIVE MODE:`

### **Scenario 2: Technical Response (Alex should lead)**

Type: `"I have 5 years of experience with React, Node.js, and PostgreSQL. I built a microservices architecture that handles 50,000 requests per minute."`

**Expected Response:**

```
**Alex:** That's impressive scale! Can you walk me through the architecture decisions you made for handling that volume? What were the key bottlenecks you encountered?
```

### **Scenario 3: Behavioral Response (Jordan should lead)**

Type: `"I really enjoy collaborating with cross-functional teams. In my last role, I led a project where we had to coordinate between design, product, and engineering teams."`

**Expected Response:**

```
**Jordan:** That sounds like a complex coordination challenge! How did you handle conflicting priorities between the different teams? Can you give me a specific example of how you resolved a disagreement?
```

### **Scenario 4: Complex Response (Should be Collaborative)**

Type: `"In my previous role, I designed a real-time chat system using WebSockets and Redis. The biggest challenge was managing team communication during the project. We had developers in three different time zones, and I had to balance technical decisions with keeping everyone aligned on the architecture choices."`

**Expected Response:**

```
**Jordan:** Managing a distributed team across time zones is quite challenging! How did you ensure everyone stayed aligned and felt included in the decision-making process?

**Alex:** From a technical standpoint, I'm curious about your WebSocket implementation. How did you handle connection management and ensure message delivery reliability with Redis?
```

## 🔍 What to Look For

### ✅ **Good Signs (Fixed Issues)**

1. **Natural Conversation Flow**

   - Responses feel like real interviewers talking
   - Questions build on previous answers organically
   - No repetitive or template-like responses

2. **Proper Formatting**

   - Clean `**Jordan:**` and `**Alex:**` prefixes
   - No leaked formatting instructions
   - No system prompt text in responses

3. **Smart Collaboration**

   - Both interviewers when appropriate (introductions, complex topics)
   - Single interviewer for focused questions
   - Context-aware switching between modes

4. **Response Variety**
   - Different question types and approaches
   - Varied collaborative patterns
   - Natural conversation progression

### ❌ **Red Flags (Problems)**

1. **Static Prompt Leakage**

   - `IMPORTANT:` or `Guidelines:` in responses
   - `Format your response as:` text
   - `COLLABORATIVE MODE:` instructions
   - Any system prompt instructions visible to user

2. **Poor Conversation Flow**
   - Robotic or template responses
   - Repetitive question patterns
   - Ignoring previous context
   - Inappropriate interviewer selection

## 🧪 Advanced Testing

### **API Testing**

```bash
node scripts/test-api-directly.js
```

### **Honcho Integration Testing**

```bash
node scripts/test-honcho-integration.js
```

### **Browser Console Monitoring**

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for:
   - `"Collaborative stream finished"` - Normal operation
   - `"Cleaned response content"` - Response cleaning activated
   - Any error messages

## 📊 Testing Checklist

### Before Testing

- [ ] Environment variables set (OPENAI_API_KEY, HONCHO_BASE_URL)
- [ ] Development server running (`npm run dev`)
- [ ] All verification checks pass (`node scripts/verify-setup.js`)

### During Testing

- [ ] Toggle "Collaborative AI Panel" ON when creating interview
- [ ] Test first message (should be collaborative)
- [ ] Test technical responses (Alex should lead)
- [ ] Test behavioral responses (Jordan should lead)
- [ ] Test complex responses (should be collaborative)
- [ ] Verify no static prompts appear in responses
- [ ] Check conversation flows naturally

### After Testing

- [ ] No leaked prompt instructions seen
- [ ] Both interviewers have distinct personalities
- [ ] Responses feel natural and engaging
- [ ] System switches between modes appropriately

## 🐛 Troubleshooting

### **Issue: Static prompts still appearing**

- Check browser cache (hard refresh: Ctrl+Shift+R)
- Verify you're using the collaborative API endpoint
- Check console for "Cleaned response content" messages

### **Issue: Only one interviewer responding**

- Verify "Collaborative AI Panel" is enabled
- Check if response meets collaboration criteria
- Try more complex/detailed responses

### **Issue: Repetitive responses**

- This should be fixed with the improvements
- Check for variety in question types and approaches
- Report specific patterns you notice

### **Issue: API errors**

- Check OPENAI_API_KEY is valid
- Verify Honcho demo server is accessible
- Check network connectivity

## 📝 Reporting Issues

If you find problems, please note:

1. **What you typed** (exact user input)
2. **What you expected** (desired response format)
3. **What you got** (actual response, including any leaked prompts)
4. **Browser console logs** (any error messages)
5. **Steps to reproduce** (exact sequence to trigger issue)

## 🎉 Success Criteria

The system is working correctly when:

- ✅ No static prompt instructions appear in responses
- ✅ Conversations feel natural and engaging
- ✅ Both interviewers have distinct personalities
- ✅ Collaboration happens at appropriate times
- ✅ Responses build on previous context
- ✅ Question variety and flow feel realistic

---

**Happy Testing!** 🚀 The multi-interviewer system should now provide a smooth, professional interview experience without any technical artifacts.
