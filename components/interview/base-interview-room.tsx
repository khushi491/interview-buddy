"use client";

import React from "react";
import { PageLoader } from "@/components/ui/page-loader";
import { InterviewAnalysis } from "@/components/interview-analysis";
import { useInterviewLoader } from "@/hooks/use-interview-loader";
import { useInterviewState } from "@/hooks/use-interview-state";
import { InterviewHeader } from "./interview-header";
import { InterviewFlowPanel } from "./interview-flow-panel";
import { BaseInterviewRoomProps } from "@/lib/interview-types";
import { getRoomGradient } from "@/lib/interview-utils";

interface BaseInterviewRoomPropsWithChildren extends BaseInterviewRoomProps {
  children:
    | React.ReactNode
    | ((props: {
        interviewState: any;
        stateManager: any;
        messagesEndRef: React.RefObject<HTMLDivElement>;
        controls: any;
        metrics: any;
        messages: any;
        isLoading: boolean;
        status: string;
        sendMessage: (message: { text: string }) => Promise<void>;
      }) => React.ReactNode);
}

export const BaseInterviewRoom: React.FC<
  BaseInterviewRoomPropsWithChildren
> = ({ config, cvText, children }) => {
  const {
    isLoading: isPageLoading,
    loaderState,
    showLoader,
    hideLoader,
  } = useInterviewLoader();

  const {
    interviewState,
    stateManager,
    messagesEndRef,
    controls,
    metrics,
    messages,
    isLoading,
    status,
    sendMessage,
    setInterviewState,
  } = useInterviewState(config, cvText);

  const {
    isStarted,
    isEnded,
    isAnalyzing,
    analysisError,
    autoAdvancing,
    sectionComplete,
    showContinueButton,
    chatDisabled,
    autoTriggerEnabled,
    isFlowOpen,
    showAnalysis,
    analysis,
  } = interviewState;

  const {
    startInterview,
    nextStep,
    continueToNextSection,
    analyzeCurrentSection,
    generateAnalysis,
    handleFullReport,
    setAutoTriggerEnabled,
    setIsFlowOpen,
  } = controls;

  const {
    progressPercentage,
    timeRemaining,
    sectionTimeRemaining,
    currentSection,
    formatDuration,
  } = metrics;

  // Show analysis if available
  if (showAnalysis && analysis) {
    return (
      <>
        <PageLoader
          isLoading={isPageLoading}
          state={loaderState}
          showProgress={true}
        />
        <InterviewAnalysis
          analysis={analysis}
          config={{
            position: config.position,
            type: config.type,
            candidateName: config.candidateName || "Candidate",
            mode: config.mode === "video" ? "text" : config.mode,
          }}
          messages={messages}
          onBack={() =>
            setInterviewState((prev) => ({ ...prev, showAnalysis: false }))
          }
          cvText={cvText}
          section={currentSection}
        />
      </>
    );
  }

  return (
    <>
      <PageLoader
        isLoading={isPageLoading}
        state={loaderState}
        showProgress={true}
      />

      {/* Fullscreen Interview Environment */}
      <div className="interview-container min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-x-hidden">
        {/* Professional Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getRoomGradient(isLoading, messages.length)} transition-all duration-1000`}
        />

        {/* Subtle Professional Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)`,
            backgroundSize: "30px 30px",
          }}
        />

        {/* Main Interview Interface */}
        <div className="relative min-h-screen w-full flex flex-col">
          {/* Interview Header */}
          <InterviewHeader
            config={config}
            currentSection={currentSection}
            progressPercentage={progressPercentage}
            timeRemaining={timeRemaining}
            sectionTimeRemaining={sectionTimeRemaining}
            interviewStarted={isStarted}
            formatDuration={formatDuration}
            autoTriggerEnabled={autoTriggerEnabled}
            setAutoTriggerEnabled={setAutoTriggerEnabled}
            analysisError={analysisError}
            isAnalyzing={isAnalyzing}
            generateAnalysis={generateAnalysis}
            nextStep={nextStep}
          />

          {/* Interview Flow Panel */}
          <InterviewFlowPanel
            stateManager={stateManager}
            isOpen={isFlowOpen}
            onToggle={setIsFlowOpen}
          />

          {/* Main Content Area */}
          <div
            className={`sm:flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-4 sm:pb-8 transition-all duration-300 ${
              isFlowOpen ? "lg:pl-40" : "lg:pl-20"
            }`}
          >
            <div className="w-full max-w-6xl">
              {/* Interview Container */}
              <div className="h-[70vh] md:h-[80vh] bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden max-w-full">
                {/* Render children (mode-specific content) */}
                {typeof children === "function"
                  ? children({
                      interviewState,
                      stateManager,
                      messagesEndRef,
                      controls,
                      metrics,
                      messages,
                      isLoading,
                      status,
                      sendMessage,
                    })
                  : children}
              </div>
            </div>
          </div>

          {/* Floating Action Panel */}
          {stateManager && (
            <div className="fixed bottom-4 right-4 z-10">
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-3 sm:p-4 shadow-xl border border-white/10">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <div className="text-xs sm:text-sm text-white/80 text-center sm:text-left">
                    {stateManager.getState().sectionIndex + 1} of{" "}
                    {stateManager.getState().flow.sections.length} sections
                  </div>
                  <button
                    onClick={handleFullReport}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? "Generating..." : "Full Report"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages End Ref for Auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </>
  );
};
