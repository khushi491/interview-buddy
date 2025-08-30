"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { VideoCallInterface } from "@/components/video-call-interface";

interface VideoInterviewRoomProps {
  config: any;
  cvText?: string;
}

export default function VideoInterviewRoom({ config, cvText }: VideoInterviewRoomProps) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        interviewState: {
          flow: config.flow || {
            sections: [],
            totalDuration: 25,
            difficulty: "mid",
            focus: "mixed",
          },
          position: config.position,
          interviewType: config.type,
          cvText,
          jobDescription: config.jobDescription,
          currentSectionId: "",
          sectionIndex: 0,
          elapsedTime: 0,
          startTime: Date.now(),
          finished: false,
          responses: [],
        },
      },
    }),
  });

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 z-50">
      <VideoCallInterface
        messages={messages}
        input=""
        handleInputChange={() => {}}
        handleSubmit={() => {}}
        isLoading={status === 'streaming'}
        currentStep={1}
        disabled={false}
        onEndCall={() => {}}
        duration={0}
        isInterviewComplete={false}
        interviewType="video"
      />
    </div>
  );
}
