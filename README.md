# AI Interview Assistant

A comprehensive interview practice application powered by AI, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🤖 **AI-Powered Questions**: Dynamic interview questions generated based on job role and experience level
- 💬 **Real-time Feedback**: Instant AI feedback on your responses with constructive suggestions
- 🎯 **Role-Specific**: Tailored questions for Software Engineer, Data Scientist, and Product Manager roles
- 📊 **Progress Tracking**: Visual progress indicator showing completed questions
- 🎙️ **Voice Recording**: Built-in recording functionality (UI ready for implementation)
- 🌙 **Dark Mode**: Full dark mode support for better user experience
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Icons**: Lucide React
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd hacathon
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_APP_NAME=AI Interview Assistant
   ```

4. **Get your OpenAI API key**
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create an account or sign in
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key and paste it in your `.env.local` file

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Starting an Interview

1. **Select Job Role**: Choose from Software Engineer, Data Scientist, or Product Manager
2. **Choose Experience Level**: Select Entry, Mid, or Senior level
3. **Click "Start Interview"**: The AI will generate relevant questions for your profile

### During the Interview

1. **Read the Question**: Each question is displayed clearly in the main panel
2. **Type Your Response**: Use the text area to write your answer
3. **Submit Response**: Click "Submit Response" to get AI feedback
4. **Review Feedback**: Read the AI-generated feedback and suggestions
5. **Track Progress**: Monitor your progress in the sidebar

### Features

- **AI Question Generation**: Questions are dynamically generated based on your role and experience
- **Real-time Feedback**: Get instant, constructive feedback on your responses
- **Progress Tracking**: Visual indicators show completed questions
- **Reset Functionality**: Start over with a new interview anytime

## API Endpoints

### `/api/questions`
Generates AI-powered interview questions based on job role and experience level.

**POST** `/api/questions`
```json
{
  "jobRole": "software-engineer",
  "experienceLevel": "mid",
  "questionCount": 5
}
```

### `/api/interview`
Provides AI feedback on interview responses.

**POST** `/api/interview`
```json
{
  "question": "What is the difference between synchronous and asynchronous programming?",
  "response": "Your response here...",
  "jobRole": "software-engineer",
  "experienceLevel": "mid"
}
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── interview/
│   │   │   └── route.ts          # AI feedback endpoint
│   │   └── questions/
│   │       └── route.ts          # Question generation endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main interview interface
├── components/                   # Reusable components (future)
└── types/                        # TypeScript type definitions (future)
```

## Customization

### Adding New Job Roles

1. Update the `sampleQuestions` object in `src/app/page.tsx`
2. Add corresponding questions in the API fallback in `src/app/api/questions/route.ts`
3. Update the job role selector in the UI

### Modifying AI Prompts

Edit the prompt templates in:
- `src/app/api/questions/route.ts` for question generation
- `src/app/api/interview/route.ts` for feedback generation

### Styling

The application uses Tailwind CSS. Customize styles by:
- Modifying the `src/app/globals.css` file
- Adding custom Tailwind classes in components
- Updating the `tailwind.config.js` for custom configurations

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## Future Enhancements

- [ ] Voice-to-text transcription
- [ ] Video recording capabilities
- [ ] Interview session recording
- [ ] Performance analytics
- [ ] Custom question banks
- [ ] Multi-language support
- [ ] Interview scheduling
- [ ] Real-time collaboration
- [ ] Advanced AI models integration
- [ ] Mobile app version
