"use client";

import { InterviewLoader } from "./interview-loader";

interface PageLoaderProps {
  isLoading: boolean;
  state?:
    | "pre_interview"
    | "waiting_room"
    | "interviewer_prep"
    | "first_impression"
    | "deep_dive"
    | "evaluation"
    | "decision_making";
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  duration?: number;
}

export function PageLoader({
  isLoading,
  state = "pre_interview",
  message,
  subMessage,
  showProgress = false,
  duration = 3000,
}: PageLoaderProps) {
  if (!isLoading) return null;

  return (
    <InterviewLoader
      state={state}
      message={message}
      subMessage={subMessage}
      showProgress={showProgress}
      duration={duration}
    />
  );
}
