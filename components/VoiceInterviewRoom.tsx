"use client";
import { useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";

// Helper function to extract text content from UIMessage
const getMessageText = (message: UIMessage): string => {
    const textPart = message.parts.find(part => part.type === 'text');
    return textPart ? (textPart as any).text : '';
};
import { useAIPlayback } from "@/hooks/use-ai-playback";
import { ChatInterface } from "@/components/chat-interface";

interface VoiceInterviewRoomProps {
  config: any;
  cvText?: string;
}

export default function VoiceInterviewRoom({
  config,
  cvText,
}: VoiceInterviewRoomProps) {
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

  const { playAudio, isPlaying } = useAIPlayback();

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      const messageText = getMessageText(lastMessage);
      console.log("Playing audio for assistant message:", messageText);
      playAudio(messageText);
    }
  }, [messages, playAudio]);

  const handleTranscriptionUpdate = useCallback((text: string) => {
    // In the new API, we need to handle input differently
    console.log("Transcription update:", text);
  }, []);

  return (
    <ChatInterface
      messages={messages}
      input=""
      handleInputChange={() => {}}
      handleSubmit={() => {}}
      isLoading={status === 'streaming'}
      isVoiceMode={true}
      onTranscriptionUpdate={handleTranscriptionUpdate}
      playAudio={playAudio}
      isPlayingAudio={isPlaying}
    />
  );
}
