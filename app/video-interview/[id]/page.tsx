"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { VideoInterviewRoom } from "@/components/video-interview/video-interview-room";
import { InterviewCompletionState } from "@/components/interview-completion-state";
import { InterviewConfig } from "@/lib/interview-types";
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
}

export default function VideoInterviewPage() {
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
        if (!response.ok) throw new Error("Failed to fetch interview");
        const result = await response.json();
        setInterview(result.interview);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    if (interviewId) fetchInterview();
  }, [interviewId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading interview...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );

  if (!interview)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Interview Not Found</h1>
          <p className="text-gray-400">
            The interview you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );

  const config: InterviewConfig = {
    position: interview.position || "",
    type: interview.interviewType || "",
    candidateName: interview.transcript?.candidateName || "",
    mode: "video",
    difficulty:
      (typeof window !== "undefined"
        ? (sessionStorage.getItem("interviewDifficulty") as
            | "easy"
            | "medium"
            | "hard")
        : "medium") || "medium",
    jobDescription: "",
    interviewId: interview.id,
    flow: interview.flow,
  };

  // If interview is completed, show completion state
  if (interview.status === "completed") {
    return <InterviewCompletionState interview={interview} />;
  }

  return <VideoInterviewRoom config={config} cvText={interview.cvText} />;
}
