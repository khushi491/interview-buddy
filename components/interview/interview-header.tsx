"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Settings, AlertCircle } from "lucide-react";
import { InterviewHeaderProps } from "@/lib/interview-types";
import { INTERVIEW_CONSTANTS } from "@/lib/interview-constants";

export const InterviewHeader: React.FC<InterviewHeaderProps> = ({
  config,
  currentSection,
  progressPercentage,
  timeRemaining,
  sectionTimeRemaining,
  interviewStarted,
  formatDuration,
  autoTriggerEnabled,
  setAutoTriggerEnabled,
  analysisError,
  isAnalyzing,
  generateAnalysis,
  nextStep,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/20 to-transparent sm:backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 lg:px-8 py-4 gap-3 sm:gap-4">
        {/* Call Info */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse shadow-lg flex-shrink-0" />
            <span className="text-white font-medium text-sm sm:text-lg truncate">
              {config.candidateName}
            </span>
            <div className="hidden sm:block w-px h-4 sm:h-6 bg-white/30 flex-shrink-0" />
            <span className="text-white/80 text-xs sm:text-sm truncate hidden sm:block">
              {config.position}
            </span>
            {currentSection && (
              <>
                <div className="hidden sm:block w-px h-4 sm:h-6 bg-white/30 flex-shrink-0" />
                <span className="text-white/80 text-xs sm:text-sm truncate hidden sm:block">
                  {currentSection.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Progress */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 border border-white/10">
            <div className="flex items-center gap-2 sm:gap-3 text-white/90">
              <div className="flex-1 bg-white/20 rounded-full h-1.5 sm:h-2 min-w-[60px] sm:min-w-[100px]">
                <div
                  className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs sm:text-sm font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 border border-white/10">
            <div className="flex items-center gap-1 sm:gap-2 text-white/90">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-mono text-xs sm:text-sm">
                {interviewStarted
                  ? formatDuration(timeRemaining)
                  : formatDuration(
                      INTERVIEW_CONSTANTS.DEFAULT_INTERVIEW_DURATION
                    )}
              </span>
            </div>
          </div>

          {/* Section Timer */}
          {currentSection && (
            <div className="bg-black/30 backdrop-blur-md rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 border border-white/10">
              <div className="flex items-center gap-1 sm:gap-2 text-white/90">
                <span className="text-xs">Section:</span>
                <span className="font-mono text-xs sm:text-sm">
                  {formatDuration(sectionTimeRemaining)}
                </span>
              </div>
            </div>
          )}

          {/* Analysis Error */}
          {analysisError && (
            <div className="bg-red-500/20 backdrop-blur-md rounded-xl px-3 py-2 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Analysis failed</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Get Feedback Button */}
            <Button
              onClick={generateAnalysis}
              variant="outline"
              size="sm"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              disabled={isAnalyzing}
            >
              {isAnalyzing
                ? INTERVIEW_CONSTANTS.MESSAGES.ANALYZING
                : "Get Feedback"}
            </Button>

            {/* Continue Button */}
            {currentSection && (
              <Button
                onClick={nextStep}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                Continue →
              </Button>
            )}
          </div>

          {/* Auto-trigger */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-white/10">
            <div className="flex items-center gap-1 sm:gap-2 text-white/90">
              <span className="text-xs font-medium">Auto-Advance:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoTriggerEnabled(!autoTriggerEnabled)}
                className={`px-1.5 sm:px-2 py-1 text-xs rounded-lg transition-colors ${
                  autoTriggerEnabled
                    ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                    : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                }`}
              >
                {autoTriggerEnabled ? "ON" : "OFF"}
              </Button>
            </div>
          </div>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 sm:w-10 sm:h-10 p-0 bg-black/30 backdrop-blur-md rounded-xl border border-white/10 hover:bg-black/50"
          >
            <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
          </Button>
        </div>
      </div>
    </div>
  );
};
