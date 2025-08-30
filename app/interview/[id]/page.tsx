"use client";

import { useParams } from "next/navigation";
import {
  ChatInterviewRoom,
  VideoInterviewRoom,
  InterviewConfig,
} from "@/components/interview";
import { InterviewCompletionState } from "@/components/interview-completion-state";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface InterviewData {
  id: string;
  userId: string;
  resumeId?: string;
  type: "TEXT" | "AUDIO";
  position: string;
  interviewType: string;
  flow: any;
  transcript: any;
  feedback?: string;
  score?: number;
  cvText?: string;
  status: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  InterviewAnalysis?: any[];
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
  resume?: {
    id: string;
    profile: string;
    company: string;
  };
}

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await fetch(`/api/interviews/${interviewId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch interview");
        }

        const result = await response.json();
        setInterview(result.interview);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Interview Not Found
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Interview Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The interview you're looking for doesn't exist.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Extract interview configuration from interview data
  const config: InterviewConfig = {
    position: interview.position || "",
    type: interview.interviewType || "",
    candidateName: interview.transcript?.candidateName || "",
    mode: interview.type === "AUDIO" ? "video" : "text",
    jobDescription: "", // This is now stored separately in the flow
    interviewId: interview.id,
    flow: interview.flow,
  };

  // If interview is completed, show completion state
  if (interview.status === "completed") {
    return <InterviewCompletionState interview={interview} />;
  }

  // Render the appropriate interview component based on mode
  switch (config.mode) {
    case "video":
      return <VideoInterviewRoom config={config} cvText={interview.cvText} />;
    case "text":
    default:
      return <ChatInterviewRoom config={config} cvText={interview.cvText} />;
  }
}
