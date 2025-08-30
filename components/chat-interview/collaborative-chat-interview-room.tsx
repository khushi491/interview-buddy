"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "ai/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Brain, Heart } from "lucide-react";
import {
  MultiInterviewerDisplay,
  InterviewerMessage,
} from "@/components/multi-interviewer-display";
import { InterviewConfig } from "@/lib/interview-types";
import { useInterviewState } from "@/hooks/use-interview-state";
import { InterviewHeader } from "@/components/interview/interview-header";
import { InterviewFlowPanel } from "@/components/interview/interview-flow-panel";

interface CollaborativeChatInterviewRoomProps {
  config: InterviewConfig;
  cvText?: string;
}

export function CollaborativeChatInterviewRoom({
  config,
  cvText,
}: CollaborativeChatInterviewRoomProps) {
  const [honchoWorkspaceId] = useState(
    `interview-${config.interviewId || Date.now()}`
  );
  const [candidateId] = useState(`candidate-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { interviewState, stateManager, controls, metrics } = useInterviewState(
    config,
    cvText
  );

  const {
    isStarted,
    isEnded,
    isAnalyzing,
    analysisError,
    chatDisabled,
    isFlowOpen,
  } = interviewState;

  const { startInterview, setIsFlowOpen, generateAnalysis, nextStep } =
    controls;

  const {
    progressPercentage,
    timeRemaining,
    sectionTimeRemaining,
    currentSection,
    formatDuration,
  } = metrics;

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      interviewState: stateManager?.getState(),
      useMultiInterviewers: true,
      honchoWorkspaceId,
      candidateId,
    },
    onFinish: (message) => {
      // Handle interview state updates
      if (stateManager && message.content) {
        stateManager.addResponse(message.content, input);
      }
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Collaborative AI Interview
                </h1>
              </div>
              <p className="text-lg text-gray-600">
                You'll be interviewed by our AI panel working together
              </p>
            </div>

            <MultiInterviewerDisplay
              activeInterviewer="both"
              showPersonas={true}
              className="mb-8"
            />

            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span>Ready to Begin?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-50">
                      Position
                    </Badge>
                    <span>{config.position}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50">
                      Type
                    </Badge>
                    <span>{config.type}</span>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <Button
                    onClick={startInterview}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Start Collaborative Interview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Interview Header */}
      <InterviewHeader
        config={config}
        currentSection={currentSection}
        progressPercentage={progressPercentage}
        timeRemaining={timeRemaining}
        sectionTimeRemaining={sectionTimeRemaining}
        interviewStarted={isStarted}
        formatDuration={formatDuration}
        autoTriggerEnabled={false}
        setAutoTriggerEnabled={() => {}}
        analysisError={analysisError}
        isAnalyzing={isAnalyzing}
        generateAnalysis={generateAnalysis}
        nextStep={nextStep}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Interview Panel Info */}
          <div className="lg:col-span-1">
            <MultiInterviewerDisplay
              activeInterviewer="both"
              showPersonas={false}
              className="sticky top-24"
            />

            {/* Flow Panel */}
            {stateManager && (
              <div className="mt-6">
                <InterviewFlowPanel
                  stateManager={stateManager}
                  isOpen={isFlowOpen}
                  onToggle={setIsFlowOpen}
                />
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <Brain className="w-5 h-5 text-blue-500" />
                    <span>Interview Conversation</span>
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-blue-100 to-red-100"
                  >
                    Collaborative Mode
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col h-full p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.role === "user" ? (
                        <div className="max-w-[80%] bg-blue-600 text-white rounded-lg px-4 py-3">
                          <div className="font-medium text-sm mb-1">You</div>
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-[90%]">
                          <InterviewerMessage
                            content={message.content}
                            className="bg-gray-50 rounded-lg p-4"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[90%] bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            Interviewers are discussing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                  <form onSubmit={handleSubmit} className="flex space-x-2">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Type your response..."
                      disabled={chatDisabled || isLoading}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={chatDisabled || isLoading || !input.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>

                  <div className="text-xs text-gray-500 mt-2 text-center">
                    Press Enter to send • Shift+Enter for new line
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
