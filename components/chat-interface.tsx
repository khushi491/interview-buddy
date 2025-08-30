"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { UIMessage } from "ai";

// Helper function to extract text content from UIMessage
const getMessageText = (message: UIMessage): string => {
    const textPart = message.parts.find(part => part.type === 'text');
    return textPart ? (textPart as any).text : '';
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Mic, MicOff } from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

interface ChatInterfaceProps {
  messages: any[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isVoiceMode?: boolean;
  onTranscriptionUpdate?: (text: string) => void;
  playAudio?: (text: string) => Promise<void>;
  isPlayingAudio?: boolean;
}

export function ChatInterface({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  isVoiceMode = false,
  onTranscriptionUpdate,
  playAudio,
  isPlayingAudio,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isRecording, startRecording, stopRecording, currentTranscript } =
    useAudioRecorder(onTranscriptionUpdate || (() => {}));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isVoiceMode && currentTranscript) {
      const event = {
        target: { value: currentTranscript },
      } as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(event);
    }
  }, [currentTranscript, isVoiceMode, handleInputChange]);

  const handleMicClick = async () => {
    if (isRecording) {
      await stopRecording();
      // Submit the current transcript when recording stops
      if (input.trim()) {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className="flex-1 p-3 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {messages.filter((message, index, self) => {
            const firstIndex = self.findIndex(m => 
              getMessageText(m) === getMessageText(message) && 
              m.role === message.role
            );
            return firstIndex === index;
          }).map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2 sm:gap-4 ${message.role === "user" ? "justify-end" : ""}`}
            >
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-primary-foreground shadow-lg flex-shrink-0">
                  <AvatarFallback className="text-xs sm:text-sm font-semibold">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`p-3 sm:p-4 rounded-2xl max-w-[85%] sm:max-w-xs lg:max-w-md shadow-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                <div className="text-xs sm:text-sm leading-relaxed">{getMessageText(message)}</div>
              </div>
              {message.role === "user" && (
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary text-secondary-foreground shadow-lg flex-shrink-0">
                  <AvatarFallback className="text-xs sm:text-sm font-semibold">
                    U
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {(isLoading || isPlayingAudio) && (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                <span className="text-xs sm:text-sm">
                  {isPlayingAudio ? "Playing response..." : "AI is thinking..."}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-3 sm:p-6 border-t border-border bg-background/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={isVoiceMode ? "Speak now..." : "Type your response..."}
            className="flex-1 bg-background border-border focus:border-primary transition-colors text-sm"
            disabled={
              isLoading || (isVoiceMode && isRecording) || isPlayingAudio
            }
          />
          {isVoiceMode && (
            <Button
              type="button"
              onClick={handleMicClick}
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              className="shrink-0 w-8 h-8 sm:w-10 sm:h-10"
            >
              {isRecording ? (
                <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading || !input.trim() || isPlayingAudio}
            className="shrink-0 w-8 h-8 sm:w-10 sm:h-10"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </form>
        {isVoiceMode && currentTranscript && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3 px-1">
            <span className="font-medium">Transcript:</span> {currentTranscript}
          </p>
        )}
      </div>
    </div>
  );
}
