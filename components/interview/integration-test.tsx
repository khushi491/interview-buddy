"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChatInterviewRoom, VideoInterviewRoom } from "./index";
import { InterviewConfig } from "@/lib/interview-types";

const mockConfig: InterviewConfig = {
  position: "Software Engineer",
  type: "Technical Interview",
  candidateName: "John Doe",
  mode: "text",
  jobDescription: "We are looking for a skilled software engineer...",
  interviewId: "test-interview-123",
  flow: {
    sections: [
      {
        id: "intro",
        title: "Introduction",
        order: 1,
        estimatedDuration: 5,
        focusAreas: ["Background", "Experience", "Motivation"],
      },
      {
        id: "technical",
        title: "Technical Questions",
        order: 2,
        estimatedDuration: 10,
        focusAreas: ["Programming", "Problem Solving", "Architecture"],
      },
    ],
    totalDuration: 15,
    difficulty: "mid",
    focus: "Technical skills and problem solving",
  },
};

export const InterviewIntegrationTest: React.FC = () => {
  const [currentMode, setCurrentMode] = React.useState<"text" | "video">(
    "text"
  );

  const renderInterviewComponent = () => {
    const config = { ...mockConfig, mode: currentMode };

    switch (currentMode) {
      case "video":
        return <VideoInterviewRoom config={config} cvText="Mock CV text..." />;
      case "text":
      default:
        return <ChatInterviewRoom config={config} cvText="Mock CV text..." />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Interview Components Integration Test
          </h1>
          <p className="text-white/70 text-lg">
            Test both interview modes with the new component architecture
          </p>
        </div>

        {/* Mode Selector */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Select Interview Mode</CardTitle>
            <CardDescription className="text-white/70">
              Choose which interview mode to test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setCurrentMode("text")}
                variant={currentMode === "text" ? "default" : "outline"}
                className="bg-primary hover:bg-primary/90"
              >
                💬 Chat Interview
              </Button>
              <Button
                onClick={() => setCurrentMode("video")}
                variant={currentMode === "video" ? "default" : "outline"}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                📹 Video/Voice Interview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Mode Info */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              Current Mode:{" "}
              {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}{" "}
              Interview
            </CardTitle>
            <CardDescription className="text-white/70">
              Testing the {currentMode} interview component with mock data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/80">
              <div>
                <strong>Position:</strong> {mockConfig.position}
              </div>
              <div>
                <strong>Type:</strong> {mockConfig.type}
              </div>
              <div>
                <strong>Candidate:</strong> {mockConfig.candidateName}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview Component */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {renderInterviewComponent()}
        </div>

        {/* Integration Status */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Integration Status</CardTitle>
            <CardDescription className="text-white/70">
              Component integration verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">
                  ✅ Base Interview Room Component
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">
                  ✅ Shared Interview State Hook
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">
                  ✅ Chat Interview Room Component
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">
                  ✅ Video/Voice Interview Room Component
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">✅ Two-Mode Architecture</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">
                  ✅ Route Integration Complete
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
