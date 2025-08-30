"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  User,
  Building,
  Play,
  Eye,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trophy,
  Target,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Interview {
  id: string;
  type: string; // This is the database enum: TEXT, AUDIO, VIDEO
  position: string;
  interviewType: string; // This is the interview category: technical, behavioral, etc.
  status: string;
  completedAt: string | null;
  createdAt: string;
  duration: number | null;
  mode: string | null;
  score: number | null;
  feedback: string | null;
}

export default function InterviewHistoryPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch interviews immediately since we don't have authentication
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/interviews");
      if (!response.ok) {
        throw new Error("Failed to fetch interviews");
      }
      const data = await response.json();
      setInterviews(data.interviews || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load interviews"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteInterview = async (interviewId: string) => {
    if (!confirm("Are you sure you want to delete this interview?")) {
      return;
    }

    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete interview");
      }

      // Remove from local state
      setInterviews((prev) =>
        prev.filter((interview) => interview.id !== interviewId)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete interview"
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
            In Progress
          </Badge>
        );
      case "abandoned":
        return (
          <Badge className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
            Abandoned
          </Badge>
        );
      case "did_not_finish":
        return (
          <Badge className="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
            Did Not Finish
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "technical":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            Technical
          </Badge>
        );
      case "behavioral":
        return (
          <Badge
            variant="outline"
            className="border-purple-500 text-purple-600"
          >
            Behavioral
          </Badge>
        );
      case "cultural-fit":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Cultural Fit
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getModeBadge = (interviewType: string, mode: string | null) => {
    // Use the database type field to determine the actual interview mode
    switch (interviewType) {
      case "TEXT":
        return (
          <Badge variant="outline" className="border-cyan-500 text-cyan-600">
            💬 Chat
          </Badge>
        );
      case "AUDIO":
        return (
          <Badge
            variant="outline"
            className="border-orange-500 text-orange-600"
          >
            🎤 Voice
          </Badge>
        );
      case "VIDEO":
        return (
          <Badge variant="outline" className="border-red-500 text-red-600">
            📹 Video
          </Badge>
        );
      default:
        return mode ? (
          <Badge variant="outline" className="capitalize">
            {mode}
          </Badge>
        ) : null;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading your interview history...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchInterviews}>Try Again</Button>
        </div>
      </div>
    );
  }

  const completedInterviews = interviews.filter(
    (i) => i.status === "completed"
  );
  const inProgressInterviews = interviews.filter(
    (i) => i.status === "in_progress"
  );
  const didNotFinishInterviews = interviews.filter(
    (i) => i.status === "did_not_finish"
  );
  const averageScore =
    completedInterviews.length > 0
      ? Math.round(
          completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) /
            completedInterviews.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-border sticky z-50 px-3 sm:px-4 lg:px-12 py-3 sm:py-4">
        {/* Breadcrumb - Simplified for mobile */}
        <div className="flex items-center space-x-2 mb-3 sm:mb-4 lg:mb-6">
          <Link
            href="/"
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="text-muted-foreground hidden sm:inline">/</span>
          <span className="text-foreground font-medium text-sm sm:text-base">
            Interview History
          </span>
        </div>

        {/* Header - Mobile-optimized */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
                📋 Interview History
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Review your past interviews and track your progress
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-3">
              <Badge className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs sm:text-sm px-2 sm:px-3 py-1">
                {interviews.length} total
              </Badge>
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src="https://avatars.githubusercontent.com/u/1234567?v=4" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-xs sm:text-sm">
                  IC
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards - Mobile-optimized grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base sm:text-lg lg:text-2xl font-bold text-foreground">
                    {interviews.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base sm:text-lg lg:text-2xl font-bold text-foreground">
                    {completedInterviews.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base sm:text-lg lg:text-2xl font-bold text-foreground">
                    {inProgressInterviews.length +
                      didNotFinishInterviews.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base sm:text-lg lg:text-2xl font-bold text-foreground">
                    {averageScore}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Score</div>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interviews List - Mobile-optimized */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {interviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  No interviews yet
                </h3>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                  Start your first interview to see your history here
                </p>
                <Link href="/interview">
                  <Button className="w-full sm:w-auto">
                    <Play className="h-4 w-4 mr-2" />
                    Start Interview
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            interviews.map((interview) => (
              <Card
                key={interview.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <CardTitle className="text-base sm:text-lg truncate">
                            {interview.position}
                          </CardTitle>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getTypeBadge(interview.interviewType)}
                          {getModeBadge(interview.type, interview.mode)}
                          {getStatusBadge(interview.status)}
                        </div>
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs sm:text-sm">
                            {getTimeAgo(interview.createdAt)}
                          </span>
                        </span>
                        {interview.duration && (
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs sm:text-sm">
                              {formatDuration(interview.duration)}
                            </span>
                          </span>
                        )}
                        {interview.score && (
                          <span className="flex items-center space-x-1">
                            <span className="font-medium text-xs sm:text-sm">
                              Score: {interview.score}/100
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Action Buttons - Mobile-optimized */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {/* Analytics Button */}
                        <Link
                          href={`/interview-report/${interview.id}`}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Analytics</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                        </Link>

                        {/* Continue Button */}
                        {interview.status === "in_progress" &&
                          interview.type === "TEXT" && (
                            <Link
                              href={`/interview/${interview.id}`}
                              className="w-full sm:w-auto"
                            >
                              <Button size="sm" className="w-full sm:w-auto">
                                <Play className="h-4 w-4 mr-1" />
                                Continue
                              </Button>
                            </Link>
                          )}

                        {/* Disabled continue button for video/audio interviews */}
                        {(interview.status === "did_not_finish" ||
                          interview.status === "in_progress") &&
                          (interview.type === "AUDIO" ||
                            interview.type === "VIDEO") && (
                            <Button
                              size="sm"
                              disabled
                              className="w-full sm:w-auto"
                              title="Video/Voice interviews cannot be continued - you must start a new one"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Continue
                            </Button>
                          )}

                        {/* Delete Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteInterview(interview.id)}
                          className="text-red-500 hover:text-red-700 w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">Remove</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {interview.feedback && (
                  <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {interview.feedback}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
