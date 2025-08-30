# AI Interview Assistant - Setup Guide

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Create the environment file
touch .env.local
```

Add the following content to `.env.local`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Configuration
NEXT_PUBLIC_APP_NAME=AI Interview Assistant
```

### 2. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in the sidebar
4. Click "Create new secret key"
5. Copy the generated key
6. Replace `your_openai_api_key_here` in `.env.local` with your actual API key

### 3. Start the Application

```bash
# Install dependencies (if not already done)
pnpm install

# Start the development server
pnpm dev
```

### 4. Access the Application

Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

## Features Available

### Without API Key (Fallback Mode)
- ✅ Pre-defined interview questions
- ✅ Mock AI feedback
- ✅ Full UI functionality
- ✅ Progress tracking
- ✅ Responsive design

### With API Key (Full AI Mode)
- ✅ Dynamic AI-generated questions
- ✅ Real AI feedback and analysis
- ✅ Role-specific question generation
- ✅ Experience-level appropriate questions
- ✅ All fallback features

## Troubleshooting

### Common Issues

1. **"Failed to generate questions" error**
   - Check if your OpenAI API key is correct
   - Verify the API key has sufficient credits
   - The app will fallback to sample questions

2. **"Failed to generate feedback" error**
   - Same as above - check API key
   - App will use mock feedback as fallback

3. **Environment variables not loading**
   - Restart the development server after adding `.env.local`
   - Ensure the file is in the root directory
   - Check for typos in variable names

### API Key Security

- Never commit your `.env.local` file to version control
- The file is already in `.gitignore`
- For production, use environment variables in your hosting platform

## Testing the Application

1. **Select a job role** (Software Engineer, Data Scientist, or Product Manager)
2. **Choose experience level** (Entry, Mid, or Senior)
3. **Click "Start Interview"**
4. **Answer questions** by typing in the text area
5. **Submit responses** to get AI feedback
6. **Track progress** in the sidebar

## Next Steps

- Customize questions for your specific needs
- Add more job roles
- Implement voice recording functionality
- Add interview session recording
- Deploy to production

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify your API key is working
3. Restart the development server
4. Check the README.md for more detailed information 