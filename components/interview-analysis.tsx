"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  User,
  Briefcase,
  Clock,
  ArrowLeft,
  Settings,
} from "lucide-react";

interface InterviewAnalysisProps {
  analysis: any;
  config: {
    position: string;
    type: string;
    candidateName: string;
    mode: "text" | "audio";
  };
  messages: any[];
  onBack?: () => void;
  cvText?: string;
  section?: any;
}

export function InterviewAnalysis({
  analysis,
  config,
  messages,
  onBack,
  cvText,
  section,
}: InterviewAnalysisProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getScoreColor = (score: number) => {
    if (score >= 8)
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
    if (score >= 6)
      return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "HIRE":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700";
      case "MAYBE":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700";
      case "NO_HIRE":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const exportToPDF = () => {
    // PDF export functionality would be implemented here
    console.log("Exporting to PDF...");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header - Mobile-optimized */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="space-y-4">
              {/* Icon and Title Row */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {section
                      ? `${section.title} Analysis`
                      : analysis.stepNumber
                        ? `Step ${analysis.stepNumber} Analysis`
                        : "Interview Analysis Report"}
                  </CardTitle>
                </div>
              </div>

              {/* Meta Info - Stacked on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">{config.candidateName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">{config.position}</span>
                </div>
                {section && (
                  <div className="flex items-center gap-1">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">{section.title}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status and Actions - Mobile-optimized */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Badge
                  className={`px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold border w-fit ${getRecommendationColor(analysis.recommendation || "MAYBE")}`}
                >
                  {analysis.recommendation === "HIRE"
                    ? "Recommended for Hire"
                    : analysis.recommendation === "MAYBE"
                      ? "Consider Further"
                      : analysis.recommendation === "NO_HIRE"
                        ? "Not Recommended"
                        : "Partial Assessment"}
                </Badge>
                <Button
                  onClick={exportToPDF}
                  className="hidden sm:block bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Section-specific context - Mobile-optimized */}
        {section && (
          <Card className="mb-4 sm:mb-6 border-0 shadow-lg bg-muted border-border">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                Section Context
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-primary text-sm sm:text-base">
                    Focus Areas:
                  </h4>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {section.focusAreas.join(", ")}
                  </p>
                </div>
                {section.description && (
                  <div>
                    <h4 className="font-semibold text-primary text-sm sm:text-base">
                      Description:
                    </h4>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {section.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CV Information - Mobile-optimized */}
        {cvText && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                CV Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="bg-muted rounded-lg p-3 sm:p-4 max-h-32 sm:max-h-40 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-line">
                  {cvText.length > 500
                    ? `${cvText.substring(0, 500)}...`
                    : cvText}
                </p>
                {cvText.length > 500 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    (Showing first 500 characters)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid - Mobile-optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Overall Score - Mobile-optimized */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-base sm:text-lg">
                Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4">
                <svg
                  className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    strokeDasharray={`${(analysis.overallScore || 7) * 10}, 100`}
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl sm:text-3xl font-bold text-foreground">
                    {analysis.overallScore || 7}/10
                  </span>
                </div>
              </div>
              <Badge
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm ${getScoreColor(analysis.overallScore || 7)}`}
              >
                {(analysis.overallScore || 7) >= 8
                  ? "Excellent"
                  : (analysis.overallScore || 7) >= 6
                    ? "Good"
                    : "Needs Improvement"}
              </Badge>
            </CardContent>
          </Card>

          {/* Key Metrics - Mobile-optimized */}
          <Card className="lg:col-span-2 mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                Performance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  {
                    label: "Technical Skills",
                    score: analysis.technicalSkills?.score || 7,
                    icon: "💻",
                  },
                  {
                    label: "Communication",
                    score: analysis.communication?.score || 8,
                    icon: "💬",
                  },
                  {
                    label: "Problem Solving",
                    score: analysis.problemSolving?.score || 6,
                    icon: "🧩",
                  },
                  {
                    label: "Cultural Fit",
                    score: analysis.culturalFit?.score || 7,
                    icon: "🤝",
                  },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-2">
                        <span>{metric.icon}</span>
                        <span className="truncate">{metric.label}</span>
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        {metric.score}/10
                      </span>
                    </div>
                    <Progress value={metric.score * 10} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths and Improvement Areas - Mobile-optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
          {/* Strengths */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400 text-base sm:text-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-3">
                {(
                  analysis.strengths || [
                    "Clear communication skills",
                    "Good technical understanding",
                    "Positive attitude",
                  ]
                ).map((strength: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-foreground">
                      {strength}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Improvement Areas */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-base sm:text-lg">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-3">
                {(
                  analysis.improvementAreas || [
                    "Could provide more specific examples",
                    "Technical depth could be improved",
                    "Consider more structured responses",
                  ]
                ).map((area: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-foreground">
                      {area}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary - Mobile-optimized */}
        <Card className="mt-4 sm:mt-6 mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              {analysis.stepNumber
                ? `Step ${analysis.stepNumber} Summary`
                : "Executive Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="prose max-w-none">
              <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-line">
                {analysis.summary ||
                  `The candidate demonstrated good overall performance in this ${analysis.stepNumber ? "step" : "interview"}. They showed clear communication skills and provided relevant responses to the questions asked. There are opportunities for improvement in providing more specific examples and demonstrating deeper technical knowledge.`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights - Mobile-optimized */}
        {analysis.keyInsights && (
          <Card className="mt-4 sm:mt-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {analysis.keyInsights.map((insight: string, index: number) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 bg-muted rounded-lg border"
                  >
                    <p className="text-xs sm:text-sm text-foreground">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
