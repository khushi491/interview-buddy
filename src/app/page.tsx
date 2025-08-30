'use client';

import { useState } from 'react';
import { Mic, MicOff, Play, Square, Send, Brain, Users, Clock, CheckCircle } from 'lucide-react';
import FeedbackCard from '@/components/FeedbackCard';
import ProgressCard from '@/components/ProgressCard';

interface InterviewState {
  isRecording: boolean;
  isInterviewStarted: boolean;
  currentQuestion: string;
  userResponse: string;
  questions: string[];
  responses: Array<{ question: string; response: string; feedback: string }>;
  aiFeedback: string;
  interviewDuration: number;
}

export default function Home() {
  const [interviewState, setInterviewState] = useState<InterviewState>({
    isRecording: false,
    isInterviewStarted: false,
    currentQuestion: '',
    userResponse: '',
    questions: [],
    responses: [],
    aiFeedback: '',
    interviewDuration: 0
  });

  const [jobRole, setJobRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('entry');
  const [isLoading, setIsLoading] = useState(false);

  const sampleQuestions = {
    'software-engineer': [
      "Can you explain the difference between synchronous and asynchronous programming?",
      "What is the time complexity of a binary search algorithm?",
      "How would you handle a memory leak in a web application?",
      "Explain the concept of dependency injection.",
      "What are the advantages of using TypeScript over JavaScript?"
    ],
    'data-scientist': [
      "What is the difference between supervised and unsupervised learning?",
      "How would you handle missing data in a dataset?",
      "Explain the concept of overfitting and how to prevent it.",
      "What is cross-validation and why is it important?",
      "How would you explain a complex machine learning model to a non-technical stakeholder?"
    ],
    'product-manager': [
      "How do you prioritize features in a product roadmap?",
      "What metrics would you track for a social media app?",
      "How do you handle conflicting requirements from different stakeholders?",
      "Describe a time when you had to make a difficult product decision.",
      "How do you measure the success of a product launch?"
    ]
  };

  const startInterview = async () => {
    if (!jobRole) return;
    
    setIsLoading(true);
    
    try {
      // Try to get AI-generated questions first
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobRole,
          experienceLevel,
          questionCount: 5
        }),
      });

      let questions;
      if (response.ok) {
        const data = await response.json();
        questions = data.questions;
      } else {
        // Fallback to sample questions if API fails
        questions = sampleQuestions[jobRole as keyof typeof sampleQuestions] || sampleQuestions['software-engineer'];
      }

      setInterviewState(prev => ({
        ...prev,
        isInterviewStarted: true,
        questions,
        currentQuestion: questions[0] || ''
      }));
    } catch (error) {
      console.error('Error starting interview:', error);
      // Fallback to sample questions
      const fallbackQuestions = sampleQuestions[jobRole as keyof typeof sampleQuestions] || sampleQuestions['software-engineer'];
      setInterviewState(prev => ({
        ...prev,
        isInterviewStarted: true,
        questions: fallbackQuestions,
        currentQuestion: fallbackQuestions[0] || ''
      }));
    }
    
    setIsLoading(false);
  };

  const toggleRecording = () => {
    setInterviewState(prev => ({
      ...prev,
      isRecording: !prev.isRecording
    }));
  };

  const submitResponse = async () => {
    if (!interviewState.userResponse.trim()) return;

    setIsLoading(true);
    
    // Simulate AI feedback generation
    const feedback = await generateAIFeedback(interviewState.currentQuestion, interviewState.userResponse);
    
    setInterviewState(prev => ({
      ...prev,
      responses: [...prev.responses, {
        question: prev.currentQuestion,
        response: prev.userResponse,
        feedback
      }],
      userResponse: '',
      currentQuestion: prev.questions[prev.responses.length + 1] || '',
      aiFeedback: feedback
    }));
    
    setIsLoading(false);
  };

  const generateAIFeedback = async (question: string, response: string): Promise<string> => {
    try {
      const apiResponse = await fetch('/api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          response,
          jobRole,
          experienceLevel
        }),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return data.feedback;
      } else {
        // Fallback to sample feedback if API fails
        const feedbacks = [
          "Excellent answer! You demonstrated strong technical knowledge and clear communication skills.",
          "Good response, but consider providing more specific examples to strengthen your answer.",
          "Your answer shows understanding of the concept. Try to elaborate more on the practical applications.",
          "Well-structured response. You might want to mention industry best practices as well.",
          "Good foundation, but consider discussing potential challenges and solutions."
        ];
        return feedbacks[Math.floor(Math.random() * feedbacks.length)];
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      // Fallback to sample feedback
      const feedbacks = [
        "Excellent answer! You demonstrated strong technical knowledge and clear communication skills.",
        "Good response, but consider providing more specific examples to strengthen your answer.",
        "Your answer shows understanding of the concept. Try to elaborate more on the practical applications.",
        "Well-structured response. You might want to mention industry best practices as well.",
        "Good foundation, but consider discussing potential challenges and solutions."
      ];
      return feedbacks[Math.floor(Math.random() * feedbacks.length)];
    }
  };

  const resetInterview = () => {
    setInterviewState({
      isRecording: false,
      isInterviewStarted: false,
      currentQuestion: '',
      userResponse: '',
      questions: [],
      responses: [],
      aiFeedback: '',
      interviewDuration: 0
    });
    setJobRole('');
    setExperienceLevel('entry');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI Interview Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Practice interviews with AI-powered feedback and guidance
          </p>
        </div>

        {!interviewState.isInterviewStarted ? (
          /* Interview Setup */
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              Start Your Interview
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Role
                </label>
                <select
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select a job role</option>
                  <option value="software-engineer">Software Engineer</option>
                  <option value="data-scientist">Data Scientist</option>
                  <option value="product-manager">Product Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                </select>
              </div>

              <button
                onClick={startInterview}
                disabled={!jobRole || isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Play className="h-5 w-5" />
                )}
                Start Interview
              </button>
            </div>
          </div>
        ) : (
          /* Interview Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Question Panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Current Question
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    Question {interviewState.responses.length + 1} of {interviewState.questions.length}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                  <p className="text-gray-900 dark:text-white text-lg">
                    {interviewState.currentQuestion}
                  </p>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={interviewState.userResponse}
                    onChange={(e) => setInterviewState(prev => ({ ...prev, userResponse: e.target.value }))}
                    placeholder="Type your response here..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={toggleRecording}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                        interviewState.isRecording 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      {interviewState.isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {interviewState.isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                    
                    <button
                      onClick={submitResponse}
                      disabled={!interviewState.userResponse.trim() || isLoading}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Submit Response
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Feedback */}
              <FeedbackCard 
                feedback={interviewState.aiFeedback} 
                isLoading={isLoading && interviewState.userResponse.trim() !== ''}
              />
            </div>

                         {/* Sidebar */}
             <div className="space-y-6">
               {/* Progress */}
               <ProgressCard 
                 questions={interviewState.questions}
                 completedCount={interviewState.responses.length}
               />

              {/* Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Actions
                </h3>
                <button
                  onClick={resetInterview}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Reset Interview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
