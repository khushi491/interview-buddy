"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { InterviewAnalysis } from "@/components/interview-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  Video,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  MessageSquare,
  Mic,
} from "lucide-react";
import Link from "next/link";

interface InterviewData {
  id: string;
  type: string;
  position: string;
  interviewType: string;
  status: string;
  duration?: number;
  mode?: string;
  createdAt: string;
  completedAt?: string;
  transcript: any;
  cvText?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  InterviewAnalysis?: any;
}

export default function InterviewReportPage() {
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInterviewData();
  }, [interviewId]);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchInterviewData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interviews/${interviewId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch interview data");
      }

      const data = await response.json();
      setInterview(data.interview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case "TEXT":
        return MessageSquare;
      case "AUDIO":
        return Mic;
      case "VIDEO":
        return Video;
      default:
        return Video;
    }
  };

  const getInterviewTitle = (type: string) => {
    switch (type) {
      case "TEXT":
        return "Chat Interview Report";
      case "AUDIO":
        return "Voice Interview Report";
      case "VIDEO":
        return "Video Interview Report";
      default:
        return "Interview Report";
    }
  };

  const getInterviewMode = (type: string) => {
    switch (type) {
      case "TEXT":
        return "text";
      case "AUDIO":
        return "audio";
      case "VIDEO":
        return "audio"; // Video interviews use audio mode for analysis display
      default:
        return "text";
    }
  };

  // Transform database analysis to component format
  const transformAnalysis = (dbAnalysis: any) => {
    if (!dbAnalysis) return null;

    return {
      overallScore: dbAnalysis.overallScore,
      strengths: dbAnalysis.strengths || [],
      improvementAreas: dbAnalysis.improvementAreas || [],
      technicalSkills: {
        score: dbAnalysis.technicalSkills?.score || 5,
        notes:
          dbAnalysis.technicalSkills?.notes ||
          dbAnalysis.technicalSkills?.details ||
          "No assessment available",
      },
      communication: {
        score: dbAnalysis.communication?.score || 5,
        notes:
          dbAnalysis.communication?.notes ||
          dbAnalysis.communication?.details ||
          "No assessment available",
      },
      problemSolving: {
        score: dbAnalysis.problemSolving?.score || 5,
        notes:
          dbAnalysis.problemSolving?.notes ||
          dbAnalysis.problemSolving?.details ||
          "No assessment available",
      },
      culturalFit: {
        score: dbAnalysis.culturalFit?.score || 5,
        notes:
          dbAnalysis.culturalFit?.notes ||
          dbAnalysis.culturalFit?.details ||
          "No assessment available",
      },
      recommendation: dbAnalysis.recommendation || "MAYBE",
      summary: dbAnalysis.summary || "Analysis in progress...",
      keyInsights: dbAnalysis.keyInsights || [],
      stepNumber: dbAnalysis.stepNumber,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interview report...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Error Loading Report
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "Interview not found"}
          </p>
          <Link href="/interview">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Interviews
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const rawAnalysis = interview.InterviewAnalysis;
  const InterviewIcon = getInterviewIcon(interview.type);
  const interviewTitle = getInterviewTitle(interview.type);
  const interviewMode = getInterviewMode(interview.type);

  // Transform analysis data to component format
  const analysis =
    rawAnalysis && Array.isArray(rawAnalysis) && rawAnalysis.length > 0
      ? transformAnalysis(rawAnalysis[0])
      : rawAnalysis && !Array.isArray(rawAnalysis)
        ? transformAnalysis(rawAnalysis)
        : null;

  // Debug: Log the analysis data
  console.log("Interview data:", interview);
  console.log("Raw analysis data:", rawAnalysis);
  console.log("Transformed analysis data:", analysis);
  console.log("Analysis type:", typeof rawAnalysis);
  console.log(
    "Analysis length:",
    Array.isArray(rawAnalysis) ? rawAnalysis.length : "not array"
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header - Mobile-optimized */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="space-y-4">
              {/* Back Button and Icon Row */}
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <Link href="/interview/history">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-sm sm:text-base"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to History</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                </Link>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center">
                  <InterviewIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
              </div>

              {/* Title and Meta Info */}
              <div className="space-y-3">
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                  {interviewTitle}
                </CardTitle>

                {/* Meta Info - Stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">
                      {interview.user?.name ||
                        interview.user?.email ||
                        "Unknown User"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <InterviewIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">{interview.position}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{formatDuration(interview.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">
                      {formatDate(interview.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badges - Mobile-optimized */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <Badge
                  variant={
                    interview.status === "completed" ? "default" : "secondary"
                  }
                  className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold w-fit"
                >
                  {interview.status === "completed"
                    ? "Completed"
                    : "In Progress"}
                </Badge>
                <Badge
                  variant="outline"
                  className="px-3 sm:px-4 py-1 sm:py-2 capitalize text-xs sm:text-sm w-fit"
                >
                  {interviewMode === "text"
                    ? "💬 Chat"
                    : interviewMode === "audio"
                      ? "🎤 Voice"
                      : interviewMode === "video"
                        ? "📹 Video"
                        : interviewMode}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Interview Details - Mobile-optimized */}
        <Card className="hidden sm:block mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">
              Interview Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                    Position
                  </h4>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {interview.position}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                    Interview Type
                  </h4>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {interview.interviewType}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                    Duration
                  </h4>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {formatDuration(interview.duration)}
                  </p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                    Status
                  </h4>
                  <Badge
                    variant={
                      interview.status === "completed" ? "default" : "secondary"
                    }
                    className="text-xs sm:text-sm"
                  >
                    {interview.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                    Started
                  </h4>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {formatDate(interview.createdAt)}
                  </p>
                </div>
                {interview.completedAt && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                      Completed
                    </h4>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {formatDate(interview.completedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        {interview.status === "completed" && analysis ? (
          <InterviewAnalysis
            analysis={analysis}
            config={{
              position: interview.position,
              type: interview.interviewType,
              candidateName: interview.user.name || interview.user.email,
              mode: interviewMode as "text" | "audio",
            }}
            messages={interview.transcript || []}
            cvText={interview.cvText}
          />
        ) : interview.status === "completed" ? (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Analysis</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-center py-6 sm:py-8">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  Analysis Not Available
                </h3>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  The interview analysis is still being processed or is not
                  available.
                  {rawAnalysis && (
                    <span className="block text-xs mt-2">
                      Debug: Raw analysis exists but transformed analysis is
                      null - check console
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">
                Interview Status
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-center py-6 sm:py-8">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  Interview In Progress
                </h3>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  This interview is still in progress. Analysis will be
                  available once the interview is completed.
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `/api/interviews/${interviewId}/complete`,
                        {
                          method: "POST",
                        }
                      );
                      if (response.ok) {
                        // Refresh the page to show the analysis
                        window.location.reload();
                      } else {
                        alert(
                          "Failed to complete interview. Please try again."
                        );
                      }
                    } catch (error) {
                      console.error("Error completing interview:", error);
                      alert("Failed to complete interview. Please try again.");
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                  Complete Interview & Generate Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transcript Preview - Mobile-optimized */}
        {interview.transcript && (
            <>
              {/* Debug info - Hidden on mobile */}
              <div className="mb-4 p-2 bg-muted rounded text-xs hidden sm:block">
                <strong>Debug:</strong> Transcript type:{" "}
                {typeof interview.transcript}, Length:{" "}
                {Array.isArray(interview.transcript)
                  ? interview.transcript.length
                  : "not array"}
              </div>
            </>
          ) && (
            <Card className="mt-4 sm:mt-6">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">
                  Interview Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="bg-muted rounded-lg p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-y-auto">
                  <div className="space-y-3 sm:space-y-4">
                    {Array.isArray(interview.transcript) ? (
                      interview.transcript.map(
                        (message: any, index: number) => (
                          <div key={index} className="flex gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-primary-foreground font-medium">
                                {message.role === "user" ? "U" : "AI"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-muted-foreground mb-1">
                                {message.role === "user"
                                  ? "Candidate"
                                  : "Interviewer"}
                              </div>
                              <div className="text-sm text-foreground">
                                {(() => {
                                  // Handle AI SDK v5 message format with parts array (chat interviews)
                                  if (
                                    message.parts &&
                                    Array.isArray(message.parts)
                                  ) {
                                    const textParts = message.parts
                                      .filter(
                                        (part: any) =>
                                          part.type === "text" && part.text
                                      )
                                      .map((part: any) => part.text)
                                      .join(" ");
                                    return textParts || "No text content";
                                  }
                                  // Handle plain text format (video/audio interviews)
                                  if (typeof message === "string") {
                                    return message;
                                  }
                                  // Fallback to old format
                                  return (
                                    message.content ||
                                    message.text ||
                                    "No content"
                                  );
                                })()}
                              </div>
                              {/* Debug message structure - Hidden on mobile */}
                              <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                                <details>
                                  <summary>Debug: Message {index}</summary>
                                  <pre className="text-xs overflow-x-auto">
                                    {JSON.stringify(message, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            </div>
                          </div>
                        )
                      )
                    ) : typeof interview.transcript === "string" ? (
                      <div className="text-sm text-foreground whitespace-pre-wrap">
                        {interview.transcript}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Transcript format not supported
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
