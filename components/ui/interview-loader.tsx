"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Coffee,
  Clock,
  Heart,
  Brain,
  Eye,
  Target,
  CheckCircle,
} from "lucide-react";

interface InterviewLoaderProps {
  state?:
    | "pre_interview"
    | "waiting_room"
    | "interviewer_prep"
    | "first_impression"
    | "deep_dive"
    | "evaluation"
    | "decision_making";
  message?: string;
  subMessage?: string;
  duration?: number;
  showProgress?: boolean;
  className?: string;
}

export function InterviewLoader({
  state = "pre_interview",
  message,
  subMessage,
  duration = 3000,
  showProgress = false,
  className = "",
}: InterviewLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [heartbeat, setHeartbeat] = useState(1);
  const [breathingPhase, setBreathingPhase] = useState("inhale");

  const stateConfig = {
    pre_interview: {
      icon: Coffee,
      color: "from-amber-500 to-orange-600",
      bgColor: "from-amber-50 to-orange-50",
      messages: [
        "Taking a deep breath before we begin...",
        "Reviewing your resume one last time...",
        "Adjusting your posture and confidence...",
        "Remember, they already like you on paper...",
        "You've prepared for this moment...",
      ],
      subMessages: [
        "That flutter in your stomach? That's excitement, not fear",
        "Every expert was once a beginner - you belong here",
        "Your unique experience is exactly what they're looking for",
        "Confidence comes from preparation, and you're prepared",
        "This conversation could change everything - in a good way",
      ],
      animation: "nervous_energy",
      tips: "💡 Pro tip: Smile before you speak - it changes your voice tone",
    },
    waiting_room: {
      icon: Clock,
      color: "from-blue-500 to-indigo-600",
      bgColor: "from-blue-50 to-indigo-50",
      messages: [
        "Settling into the interview space...",
        "The interviewer is reviewing your profile...",
        "Taking a moment to center yourself...",
        "Organizing thoughts and key examples...",
        "Almost time - you've got this...",
      ],
      subMessages: [
        "That quiet moment before greatness begins",
        "Even seasoned professionals feel this anticipation",
        "Your story is worth telling - they want to hear it",
        "Every successful person sat in this exact moment once",
        "The hardest part is over - you got the interview",
      ],
      animation: "waiting",
      tips: "🎯 Remember: They want you to succeed as much as you do",
    },
    interviewer_prep: {
      icon: Users,
      color: "from-purple-500 to-pink-600",
      bgColor: "from-purple-50 to-pink-50",
      messages: [
        "Your interviewer is getting ready...",
        "They're excited to meet you...",
        "Reviewing the role requirements...",
        "Preparing thoughtful questions...",
        "Creating a welcoming environment...",
      ],
      subMessages: [
        "Behind every interview is someone rooting for the right fit",
        "Interviewers are people too - they want this to go well",
        "They're hoping you're the solution to their challenge",
        "Good interviewers are as invested in your success as you are",
        "This is a conversation, not an interrogation",
      ],
      animation: "preparation",
      tips: "🤝 Remember: Interviews are two-way conversations",
    },
    first_impression: {
      icon: Eye,
      color: "from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50",
      messages: [
        "Making that crucial first connection...",
        "Your authentic self is your best asset...",
        "Building rapport naturally...",
        "Finding common ground...",
        "Setting a positive tone...",
      ],
      subMessages: [
        "Authenticity beats perfection every single time",
        "The best interviews feel like great conversations",
        "Your personality is part of your professional value",
        "Genuine enthusiasm is impossible to fake - and irresistible",
        "They're evaluating fit, not just skills",
      ],
      animation: "connection",
      tips: "✨ Be genuinely curious about them and the role",
    },
    deep_dive: {
      icon: Brain,
      color: "from-teal-500 to-cyan-600",
      bgColor: "from-teal-50 to-cyan-50",
      messages: [
        "Diving deep into your experience...",
        "Connecting your skills to their needs...",
        "Sharing specific examples and stories...",
        "Demonstrating your problem-solving approach...",
        "Showing your thought process...",
      ],
      subMessages: [
        "This is where your preparation pays off",
        "Specific examples are worth a thousand generic statements",
        "Your unique perspective is your competitive advantage",
        "It's okay to think before you speak - thoughtfulness is valued",
        "Every challenge you've faced has prepared you for this role",
      ],
      animation: "thinking_deep",
      tips: "🧠 Use the STAR method: Situation, Task, Action, Result",
    },
    evaluation: {
      icon: Target,
      color: "from-rose-500 to-red-600",
      bgColor: "from-rose-50 to-red-50",
      messages: [
        "Analyzing your responses and fit...",
        "Evaluating technical and cultural alignment...",
        "Considering your potential impact...",
        "Weighing your unique strengths...",
        "Assessing mutual compatibility...",
      ],
      subMessages: [
        "Great candidates make evaluators excited about possibilities",
        "Your passion and competence are being carefully considered",
        "The right role will recognize and value what you bring",
        "Evaluation is about finding the perfect match, not perfection",
        "Your authentic responses are creating a clear picture",
      ],
      animation: "evaluation",
      tips: "📊 Quality over quantity - depth beats breadth in answers",
    },
    decision_making: {
      icon: CheckCircle,
      color: "from-violet-500 to-purple-600",
      bgColor: "from-violet-50 to-purple-50",
      messages: [
        "Weighing all the factors...",
        "Considering team dynamics and role fit...",
        "Evaluating mutual enthusiasm...",
        "Making thoughtful decisions...",
        "Preparing comprehensive feedback...",
      ],
      subMessages: [
        "Great interviews create win-win scenarios",
        "The best decisions consider both skill and cultural fit",
        "Your interview performance is just one piece of the puzzle",
        "Regardless of outcome, you've gained valuable experience",
        "The right opportunity will recognize your value",
      ],
      animation: "decision",
      tips: "🎯 Focus on what you can control - your effort and authenticity",
    },
  };

  const config = stateConfig[state];
  const Icon = config.icon;

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % config.messages.length);
    }, 10000);

    return () => clearInterval(messageInterval);
  }, [config.messages.length]);

  useEffect(() => {
    if (showProgress) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 100 / (duration / 100);
        });
      }, 100);

      return () => clearInterval(progressInterval);
    }
  }, [duration, showProgress]);

  // Heartbeat animation for nervous states
  useEffect(() => {
    if (state === "pre_interview" || state === "first_impression") {
      const heartbeatInterval = setInterval(() => {
        setHeartbeat((prev) => (prev === 1 ? 1.1 : 1));
      }, 1200);

      return () => clearInterval(heartbeatInterval);
    }
  }, [state]);

  // Breathing animation for calming
  useEffect(() => {
    if (state === "pre_interview" || state === "waiting_room") {
      const breathingInterval = setInterval(() => {
        setBreathingPhase((prev) => (prev === "inhale" ? "exhale" : "inhale"));
      }, 3000);

      return () => clearInterval(breathingInterval);
    }
  }, [state]);

  const getAnimationElements = () => {
    switch (config.animation) {
      case "nervous_energy":
        return (
          <div className="absolute inset-0 pointer-events-none">
            {/* Floating coffee steam */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-8 bg-gradient-to-t from-amber-400 to-transparent rounded-full animate-pulse opacity-60"
                style={{
                  top: `${10 + i * 5}%`,
                  left: `${45 + i * 5}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: "2s",
                }}
              />
            ))}
          </div>
        );

      case "waiting":
        return (
          <div className="absolute inset-0 pointer-events-none">
            {/* Clock ticking dots */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-primary rounded-full animate-ping"
                style={{
                  top: `${30 + (i % 2) * 40}%`,
                  left: `${30 + Math.floor(i / 2) * 40}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: "2s",
                }}
              />
            ))}
          </div>
        );

      case "connection":
        return (
          <div className="absolute inset-0 pointer-events-none">
            {/* Connection ripples */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 border-2 border-green-300 rounded-2xl animate-ping opacity-30"
                style={{
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: "3s",
                }}
              />
            ))}
          </div>
        );

      case "thinking_deep":
        return (
          <div className="absolute inset-0 pointer-events-none">
            {/* Thought bubbles */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-teal-300 rounded-full animate-bounce opacity-70"
                style={{
                  top: `${20 + i * 10}%`,
                  left: `${25 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "1.5s",
                }}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}
    >
      <Card className="max-w-lg w-full mx-4 border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
        <div className={`h-3 bg-gradient-to-r ${config.color}`}>
          {showProgress && (
            <div
              className="h-full bg-white/40 transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          )}
        </div>

        <div className={`p-8 bg-gradient-to-br ${config.bgColor} relative`}>
          <div className="text-center space-y-6">
            {/* Main Icon with Interview-specific Animation */}
            <div className="relative">
              <div
                className={`w-24 h-24 mx-auto bg-gradient-to-r ${config.color} rounded-3xl flex items-center justify-center shadow-lg`}
                style={{
                  transform:
                    state === "pre_interview" || state === "first_impression"
                      ? `scale(${heartbeat})`
                      : undefined,
                  transition: "transform 0.3s ease-in-out",
                }}
              >
                <Icon className="w-12 h-12 text-white" />
              </div>

              {getAnimationElements()}
            </div>

            {/* Interview Messages */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 transition-all duration-500">
                {message || config.messages[currentMessageIndex]}
              </h3>

              <p className="text-sm text-gray-600 leading-relaxed transition-all duration-500 italic">
                "{subMessage || config.subMessages[currentMessageIndex]}"
              </p>

              {/* Interview Tip */}
              <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-700 font-medium">
                  {config.tips}
                </p>
              </div>
            </div>

            {/* Interview State Badge */}
            <Badge
              className={`bg-gradient-to-r ${config.color} text-white border-0 px-4 py-2 text-sm`}
            >
              {state
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>

            {/* Breathing Exercise for Nervous States */}
            {(state === "pre_interview" || state === "waiting_room") && (
              <div className="space-y-3">
                <div className="text-xs text-gray-600 font-medium">
                  Breathing Exercise
                </div>
                <div className="flex justify-center items-center space-x-4">
                  <div
                    className={`w-16 h-16 rounded-full border-4 transition-all duration-3000 ease-in-out ${
                      breathingPhase === "inhale"
                        ? `border-primary scale-110`
                        : `border-primary/50 scale-90`
                    }`}
                  >
                    <div
                      className={`w-full h-full rounded-full bg-blue-100 transition-all duration-3000 ease-in-out ${
                        breathingPhase === "inhale"
                          ? "bg-blue-200"
                          : "bg-blue-50"
                      }`}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">
                      {breathingPhase === "inhale"
                        ? "Breathe In..."
                        : "Breathe Out..."}
                    </div>
                    <div className="text-xs opacity-75">
                      {breathingPhase === "inhale"
                        ? "Fill your confidence"
                        : "Release the tension"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interview Progress Indicators */}
            <div className="flex justify-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i <= currentMessageIndex
                      ? `bg-gradient-to-r ${config.color}`
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Encouraging Footer */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-3 h-3 text-red-400" />
                <span>You're exactly where you need to be</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
