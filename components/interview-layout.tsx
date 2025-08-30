"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { CleanInterviewLayout } from "./clean-interview-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Home, BookOpen } from "lucide-react";

interface InterviewLayoutProps {
  children: React.ReactNode;
}

export function InterviewLayout({ children }: InterviewLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're in an interview session (interview/[id], video-interview/[id], voice-interview/[id])
  // Exclude interview/history from using clean layout
  const isInterviewSession =
    (pathname?.includes("/interview/") &&
      !pathname?.includes("/interview/history")) ||
    pathname?.includes("/video-interview/") ||
    pathname?.includes("/voice-interview/");

  // Use clean layout for interview sessions
  if (isInterviewSession) {
    return (
      <CleanInterviewLayout
        showBackButton={true}
        backUrl="/"
        title="Interview Practice"
      >
        {children}
      </CleanInterviewLayout>
    );
  }

  // Use standard layout for other pages
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  Interview App
                </span>
              </div>

              <nav className="hidden md:flex space-x-6">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/")}
                  className="flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/interview/history")}
                  className="flex items-center space-x-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>History</span>
                </Button>
              </nav>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search interviews, questions..."
                  className="pl-10 bg-slate-100 dark:bg-slate-700 border-0"
                />
              </div>
            </div>

            {/* Welcome Message */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Welcome to Interview App
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Start practicing your interview skills
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
