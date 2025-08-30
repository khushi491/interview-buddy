"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { User, CheckCircle, ArrowRight } from "lucide-react";
import { BaseInterviewRoom } from "../interview/base-interview-room";
import { InterviewConfig } from "@/lib/interview-types";
import { INTERVIEW_CONSTANTS } from "@/lib/interview-constants";
import { UIMessage } from "ai";

// Helper function to extract text content from UIMessage
const getMessageText = (message: UIMessage): string => {
    const textPart = message.parts.find(part => part.type === 'text');
    return textPart ? (textPart as any).text : '';
};

interface ChatInterviewRoomProps {
  config: InterviewConfig;
  cvText?: string;
}

export const ChatInterviewRoom: React.FC<ChatInterviewRoomProps> = ({
  config,
  cvText,
}) => {
  return (
    <BaseInterviewRoom config={config} cvText={cvText}>
      {({
        interviewState,
        stateManager,
        messagesEndRef,
        controls,
        metrics,
        messages,
        isLoading,
        sendMessage,
      }) => (
        <div className="h-full flex flex-col min-w-0 overflow-hidden">
          {/* Chat Interview Header */}
          <div className="bg-gradient-to-r from-muted/50 to-muted/30 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  Text Interview
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  Type your responses to the interview questions
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-gradient-to-b from-muted/20 to-transparent">
            {/* Welcome State */}
            {messages.length === 0 && !interviewState.isStarted && (
              <ChatWelcomeState
                config={config}
                onStart={controls.startInterview}
              />
            )}

            {/* Loading State */}
            {messages.length === 0 && interviewState.isStarted && (
              <ChatLoadingState />
            )}

            {/* Messages */}
            {messages.length > 0 && (
              <ChatMessages
                key={`messages-${messages.length}`}
                messages={messages}
                isLoading={isLoading}
              />
            )}

            {/* Thinking Indicator - show when loading */}
            {isLoading && <ChatThinkingIndicator />}

            {/* Section Complete State */}
            {interviewState.sectionComplete &&
              interviewState.showContinueButton && (
                <ChatSectionCompleteState
                  onAnalyze={controls.analyzeCurrentSection}
                  onContinue={controls.continueToNextSection}
                  isAnalyzing={interviewState.isAnalyzing}
                  autoAdvancing={interviewState.autoAdvancing}
                />
              )}

            {/* Auto-advancing State */}
            {interviewState.autoAdvancing && <ChatAutoAdvancingState />}

            {/* Interview Complete State */}
            {interviewState.isEnded && (
              <ChatInterviewCompleteState
                onGenerateAnalysis={controls.generateAnalysis}
                isAnalyzing={interviewState.isAnalyzing}
              />
            )}

            {/* Scroll to Bottom Button - appears when not at bottom */}
            <ScrollToBottomButton messagesEndRef={messagesEndRef} />
            
            {/* Auto-scroll when AI is typing */}
            <ChatAutoScroll isLoading={isLoading} messagesEndRef={messagesEndRef} messages={messages} />
          </div>

          {/* Chat Input Area */}
          <div className="border-t border-border p-4 sm:p-6 bg-background/50 backdrop-blur-sm flex-shrink-0">
            <ChatInputArea
              messages={messages}
              chatDisabled={interviewState.chatDisabled}
              interviewEnded={interviewState.isEnded}
              isLoading={isLoading}
              sendMessage={sendMessage}
            />
          </div>
        </div>
      )}
    </BaseInterviewRoom>
  );
};

// Sub-components for better organization
const ChatWelcomeState: React.FC<{
  config: InterviewConfig;
  onStart: () => Promise<void>;
}> = ({ config, onStart }) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
        <User className="w-8 h-8 text-primary-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Ready for your interview?
      </h3>
      <p className="text-muted-foreground mb-6">
        {INTERVIEW_CONSTANTS.MESSAGES.WELCOME}
      </p>
      <Button
        onClick={onStart}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        I'm Ready
      </Button>
    </div>
  );
};

const ChatLoadingState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <User className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Starting interview...
      </h3>
      <p className="text-muted-foreground mb-6">
        {INTERVIEW_CONSTANTS.MESSAGES.LOADING}
      </p>
      <div className="flex items-center justify-center gap-3">
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <span className="text-muted-foreground text-sm">
          Loading questions...
        </span>
      </div>
    </div>
  );
};

const ChatMessages: React.FC<{
  messages: any[];
  isLoading: boolean;
}> = ({ messages, isLoading }) => {

  // Filter out duplicate messages based on content, role, and timestamp
  const uniqueMessages = messages.filter((message, index, self) => {
    const firstIndex = self.findIndex(
      (m) =>
        getMessageText(m) === getMessageText(message) &&
        m.role === message.role &&
        m.id === message.id
    );
    return firstIndex === index;
  });

  // Additional deduplication: remove consecutive identical messages
  const finalMessages = uniqueMessages.filter((message, index, array) => {
    if (index === 0) return true;
    const previousMessage = array[index - 1];
    return !(
      getMessageText(message) === getMessageText(previousMessage) &&
      message.role === previousMessage.role
    );
  });



  // Debug: Log if duplicates were found
  if (finalMessages.length !== messages.length) {
    console.log(
      `Deduplication: ${messages.length} -> ${finalMessages.length} messages`
    );
  }

  return (
    <div className="chat-container space-y-4 sm:space-y-6">
      {finalMessages.map((message, index) => (
        <div
          key={`${message.id}-${getMessageText(message).substring(0, 20)}-${index}`}
          className={`flex gap-2 sm:gap-4 min-w-0 ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {message.role === "assistant" && (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          )}

          <div
            className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-6 rounded-2xl sm:rounded-3xl break-words ${
              message.role === "user"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-muted text-foreground border border-border"
            }`}
          >
            <div className="space-y-1 sm:space-y-2">
              <div
                className={`text-xs font-medium opacity-75 ${
                  message.role === "user"
                    ? "text-blue-100"
                    : "text-muted-foreground"
                }`}
              >
                {message.role === "user" ? "You" : "Interviewer"}
              </div>
              <div className="chat-message leading-relaxed text-sm sm:text-base whitespace-pre-wrap overflow-hidden">
                {getMessageText(message)}
              </div>
            </div>
          </div>

          {message.role === "user" && (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ChatThinkingIndicator: React.FC = () => {
  return (
    <div className="flex gap-4 justify-start">
      <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
        <User className="w-5 h-5 text-white" />
      </div>
      <div className="bg-muted border border-border rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <span className="text-muted-foreground text-sm">
            {INTERVIEW_CONSTANTS.MESSAGES.THINKING}
          </span>
        </div>
      </div>
    </div>
  );
};

const ChatSectionCompleteState: React.FC<{
  onAnalyze: () => Promise<void>;
  onContinue: () => Promise<void>;
  isAnalyzing: boolean;
  autoAdvancing: boolean;
}> = ({ onAnalyze, onContinue, isAnalyzing, autoAdvancing }) => {
  return (
    <div className="flex gap-4 justify-start">
      <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
        <CheckCircle className="w-5 h-5 text-white" />
      </div>
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-3xl p-6 max-w-[75%]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-semibold text-green-800 dark:text-green-200">
              Section Complete!
            </span>
          </div>
          <p className="text-green-700 dark:text-green-300">
            Great work! We've covered this section thoroughly. You can review
            your performance or continue to the next section.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onAnalyze}
              variant="outline"
              size="sm"
              className="bg-white/80 dark:bg-green-900/80 backdrop-blur-sm border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Review Performance"}
            </Button>
            <Button
              onClick={onContinue}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={autoAdvancing}
            >
              {autoAdvancing ? "Continuing..." : "Continue to Next Section"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatAutoAdvancingState: React.FC = () => {
  return (
    <div className="flex gap-4 justify-start">
      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
        <ArrowRight className="w-5 h-5 text-white" />
      </div>
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <span className="text-blue-700 dark:text-blue-300 text-sm">
            {INTERVIEW_CONSTANTS.MESSAGES.MOVING_NEXT}
          </span>
        </div>
      </div>
    </div>
  );
};

const ScrollToBottomButton: React.FC<{
  messagesEndRef: React.RefObject<HTMLDivElement>;
}> = ({ messagesEndRef }) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const checkScrollPosition = () => {
      if (messagesEndRef.current) {
        const container = messagesEndRef.current.closest('.overflow-y-auto');
        if (container) {
          const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
          setShowButton(!isAtBottom);
        }
      }
    };

    const container = messagesEndRef.current?.closest('.overflow-y-auto');
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition(); // Check initial position
      
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [messagesEndRef]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.overflow-y-auto');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  if (!showButton) return null;

  return (
    <button
      onClick={scrollToBottom}
      className="fixed bottom-20 right-4 z-50 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-all duration-200"
      title="Scroll to bottom"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
  );
};

const ChatInterviewCompleteState: React.FC<{
  onGenerateAnalysis: () => Promise<void>;
  isAnalyzing?: boolean;
}> = ({ onGenerateAnalysis, isAnalyzing = false }) => {
  return (
    <div className="text-center py-8">
      <div className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
        Interview Complete!
      </div>
      <div className="text-muted-foreground mb-4">
        {INTERVIEW_CONSTANTS.MESSAGES.COMPLETE}
      </div>
      <Button
        onClick={onGenerateAnalysis}
        disabled={isAnalyzing}
        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
      >
        {isAnalyzing ? (
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <span>Generating Analysis...</span>
          </div>
        ) : (
          "Show Analysis"
        )}
      </Button>
    </div>
  );
};

const ChatInputArea: React.FC<{
  messages: any;
  chatDisabled: boolean;
  interviewEnded: boolean;
  isLoading: boolean;
  sendMessage: (message: { text: string }) => Promise<void>;
}> = ({ messages, chatDisabled, interviewEnded, isLoading, sendMessage }) => {
  const [input, setInput] = useState("");

  if (chatDisabled || interviewEnded) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground text-sm">
          {interviewEnded
            ? INTERVIEW_CONSTANTS.MESSAGES.COMPLETE
            : INTERVIEW_CONSTANTS.MESSAGES.SECTION_COMPLETE}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const messageText = input.trim();
      setInput(""); // Clear input immediately
      await sendMessage({ text: messageText });
    }
  };

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your response..."
          className="flex-1 bg-background border border-border focus:border-primary transition-colors text-sm rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};

const ChatAutoScroll: React.FC<{
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messages: any[];
}> = ({ isLoading, messagesEndRef, messages }) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Find and store reference to the scrollable container
  useEffect(() => {
    const findScrollContainer = () => {
      // Find the scrollable container by class name
      const container = document.querySelector('.overflow-y-auto') as HTMLDivElement;
      if (container) {
        scrollContainerRef.current = container;
        console.log('Found scroll container:', container);
      }
    };
    
    findScrollContainer();
  }, []);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollContainerRef.current) {
        console.log('Scrolling to bottom - isLoading:', isLoading);
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    };

    if (isLoading) {
      // Scroll immediately when AI starts typing
      scrollToBottom();
      
      // Also scroll after a short delay to ensure content is rendered
      const timeoutId = setTimeout(scrollToBottom, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  // Also scroll when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      const scrollToBottom = () => {
        if (scrollContainerRef.current) {
          console.log('Scrolling to bottom - new messages:', messages.length);
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      };
      
      // Scroll after a short delay to ensure content is rendered
      const timeoutId = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  return null;
};
