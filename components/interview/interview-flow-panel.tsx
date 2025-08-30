"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { InterviewFlowPanelProps } from "@/lib/interview-types";
import { getSectionStatus } from "@/lib/interview-utils";

export const InterviewFlowPanel: React.FC<InterviewFlowPanelProps> = ({
  stateManager,
  isOpen,
  onToggle,
}) => {
  if (!stateManager) return null;

  const state = stateManager.getState();
  const currentIndex = state.sectionIndex;

  return (
    <div className="hidden lg:block fixed top-20 left-4 z-20">
      <div className="relative">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(!isOpen)}
          className="absolute -right-6 -top-2 w-6 h-6 rounded-full bg-background shadow-lg border border-border p-0 hover:bg-accent z-30"
        >
          {isOpen ? (
            <ChevronLeft className="w-3 h-3 text-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-foreground" />
          )}
        </Button>

        {/* Flow Panel */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isOpen
              ? "opacity-100 max-w-60 w-60"
              : "opacity-0 max-w-0 w-0 overflow-hidden"
          }`}
        >
          <div className="bg-background/90 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-border max-h-[70vh] overflow-y-auto">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Interview Flow
              </div>
              <div className="space-y-2">
                {state.flow.sections.map((section: any, index: number) => {
                  const status = getSectionStatus(currentIndex, index);
                  const isActive = status === "active";
                  const isCompleted = status === "completed";

                  return (
                    <div
                      key={section.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-muted border border-border shadow-sm"
                          : isCompleted
                            ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                            : "hover:bg-accent border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <span className="text-xs font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium flex-1 min-w-0 ${
                          isActive
                            ? "text-primary"
                            : isCompleted
                              ? "text-green-600 dark:text-green-400"
                              : "text-foreground"
                        }`}
                      >
                        {section.title}
                      </span>
                      {isActive && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/20 text-primary text-xs ml-auto flex-shrink-0"
                        >
                          Active
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs ml-auto flex-shrink-0"
                        >
                          ✓
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
