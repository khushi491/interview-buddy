"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INTERVIEWER_PERSONAS } from "@/lib/honcho-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MultiInterviewerDisplayProps {
  activeInterviewer?: "soft" | "hard" | "both";
  showPersonas?: boolean;
  className?: string;
}

export function MultiInterviewerDisplay({
  activeInterviewer = "both",
  showPersonas = true,
  className = "",
}: MultiInterviewerDisplayProps) {
  const softInterviewer = INTERVIEWER_PERSONAS.SOFT;
  const hardInterviewer = INTERVIEWER_PERSONAS.HARD;

  return (
    <div className={`space-y-4 ${className}`}>
      {showPersonas && (
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Meet Your Interview Panel
          </h3>
          <p className="text-sm text-gray-600">
            You'll be interviewed by our collaborative AI panel
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Soft Interviewer */}
        <Card
          className={`transition-all duration-200 ${
            activeInterviewer === "soft" || activeInterviewer === "both"
              ? "ring-2 ring-blue-200 bg-blue-50/50"
              : "opacity-70"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-12 h-12 bg-blue-100">
                <AvatarFallback className="text-2xl">
                  {softInterviewer.avatar}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {softInterviewer.name}
                  </h4>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 text-xs"
                  >
                    {softInterviewer.role}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {softInterviewer.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {softInterviewer.personality
                    .split(", ")
                    .map((trait, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                      >
                        {trait}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hard Interviewer */}
        <Card
          className={`transition-all duration-200 ${
            activeInterviewer === "hard" || activeInterviewer === "both"
              ? "ring-2 ring-red-200 bg-red-50/50"
              : "opacity-70"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-12 h-12 bg-red-100">
                <AvatarFallback className="text-2xl">
                  {hardInterviewer.avatar}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {hardInterviewer.name}
                  </h4>
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-800 text-xs"
                  >
                    {hardInterviewer.role}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {hardInterviewer.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {hardInterviewer.personality
                    .split(", ")
                    .map((trait, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full"
                      >
                        {trait}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeInterviewer === "both" && (
        <div className="text-center">
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-blue-100 to-red-100 text-gray-700"
          >
            🤝 Collaborative Mode Active
          </Badge>
        </div>
      )}
    </div>
  );
}

interface InterviewerMessageProps {
  content: string;
  className?: string;
}

export function InterviewerMessage({
  content,
  className = "",
}: InterviewerMessageProps) {
  // Parse collaborative messages that have the format:
  // **Jordan:** [message]
  // **Alex:** [message]

  const parseCollaborativeMessage = (content: string) => {
    const parts = content.split(/\*\*(Jordan|Alex):\*\*/);
    const messages: Array<{ interviewer: string; content: string }> = [];

    for (let i = 1; i < parts.length; i += 2) {
      const interviewer = parts[i];
      const messageContent = parts[i + 1]?.trim();
      if (messageContent) {
        messages.push({ interviewer, content: messageContent });
      }
    }

    return messages.length > 0 ? messages : null;
  };

  const collaborativeMessages = parseCollaborativeMessage(content);

  if (!collaborativeMessages) {
    // Regular single interviewer message
    return (
      <div className={`prose prose-sm max-w-none ${className}`}>
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    );
  }

  // Collaborative message with multiple interviewers
  return (
    <div className={`space-y-4 ${className}`}>
      {collaborativeMessages.map((msg, index) => {
        const isJordan = msg.interviewer === "Jordan";
        const interviewer = isJordan
          ? INTERVIEWER_PERSONAS.SOFT
          : INTERVIEWER_PERSONAS.HARD;

        return (
          <div
            key={index}
            className={`flex items-start space-x-3 p-3 rounded-lg ${
              isJordan
                ? "bg-blue-50 border-l-4 border-blue-200"
                : "bg-red-50 border-l-4 border-red-200"
            }`}
          >
            <Avatar
              className={`w-8 h-8 ${isJordan ? "bg-blue-100" : "bg-red-100"}`}
            >
              <AvatarFallback className="text-sm">
                {interviewer.avatar}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span
                  className={`font-semibold text-sm ${
                    isJordan ? "text-blue-800" : "text-red-800"
                  }`}
                >
                  {interviewer.name}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    isJordan
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {interviewer.role}
                </Badge>
              </div>

              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {msg.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
