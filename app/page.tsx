"use client";

import { useState } from "react";
import { StartInterviewDialog } from "@/components/start-interview-dialog";
import { useRouter } from "next/navigation";
import { useInterviewLoader } from "@/hooks/use-interview-loader";
import { PageLoader } from "@/components/ui/page-loader";
import { useToast } from "@/hooks/use-toast";

// Helper function to extract CV text using backend API
type ExtractCvResult = { content: string; resumeId?: string };
const extractCVText = async (file: File): Promise<ExtractCvResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extract-cv", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to extract CV text");
  }

  const result = await response.json();
  return { content: result.content as string, resumeId: result.resumeId };
};

export default function Home() {
  const router = useRouter();
  const { isLoading, loaderState, showLoader, hideLoader } =
    useInterviewLoader();
  const { toast } = useToast();

  const handleStartInterview = async (config: {
    position: string;
    type: string;
    mode: "text" | "video";
    difficulty: "easy" | "medium" | "hard";
    cv?: File;
    jobDescription?: string;
    interviewId?: string;
    useMultiInterviewers?: boolean;
  }) => {
    console.log("Starting interview with config:", config);

    // Use a default candidate name since we don't have authentication
    const candidateName = "Interview Candidate";

    try {
      // Start the loader when API call begins
      showLoader("pre_interview", 0); // No timeout, we'll control it manually

      let cvText: string | undefined;

      // If CV file is provided, extract its content using backend API
      if (config.cv) {
        try {
          console.log("Extracting CV text...");
          const extractResult = await extractCVText(config.cv);
          cvText = extractResult.content;
          if (extractResult.resumeId) {
            sessionStorage.setItem("uploadedResumeId", extractResult.resumeId);
            toast({
              title: "Resume saved",
              description: `Your resume was saved and linked. ID: ${extractResult.resumeId}`,
            });
          } else {
            toast({
              title: "Resume extracted",
              description: "Text extracted successfully.",
            });
          }
          console.log("CV text extracted successfully");
        } catch (error) {
          console.error("Error extracting CV text:", error);
          toast({
            title: "Resume extraction failed",
            description:
              "We couldn't read your file. You can still continue without it.",
          });
          // Continue without CV text if extraction fails
        }
      }

      // Move to waiting room stage
      showLoader("waiting_room", 0);

      // Call the create-interview API
      console.log("Creating interview...");
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: config.mode === "video" ? "AUDIO" : "TEXT", // video mode uses AUDIO type for backend
          position: config.position,
          interviewType: config.type,
          difficulty: config.difficulty,
          jobDescription: config.jobDescription,
          cvText,
          useMultiInterviewers: config.useMultiInterviewers,
          transcript: {
            candidateName: candidateName,
            startTime: new Date().toISOString(),
          },
          // Optional: resumeId if CV is uploaded
          resumeId: config.cv
            ? sessionStorage.getItem("uploadedResumeId") || undefined
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create interview");
      }

      const result = await response.json();
      console.log("Interview created:", result.interview);

      // Move to interviewer prep stage
      showLoader("interviewer_prep", 0);

      // Give a brief moment for the user to see the final stage
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Hide loader and redirect
      hideLoader();

      // Redirect to the appropriate interview page based on mode
      if (config.mode === "video") {
        // Store difficulty in sessionStorage for video interview
        sessionStorage.setItem("interviewDifficulty", config.difficulty);
        router.push(`/video-interview/${result.interview.id}`);
      } else {
        router.push(`/interview/${result.interview.id}`);
      }
    } catch (error) {
      hideLoader();
      console.error("Error creating interview:", error);
      // You might want to show an error message to the user here
      alert("Failed to create interview. Please try again.");
    }
  };

  return (
    <>
      <PageLoader
        isLoading={isLoading}
        state={loaderState}
        showProgress={true}
      />
      <StartInterviewDialog onStart={handleStartInterview} />
    </>
  );
}
