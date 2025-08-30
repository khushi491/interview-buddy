"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  MessageSquare,
  Mic,
  Video,
  Briefcase,
  Settings,
  Sparkles,
  FileText,
  Upload,
} from "lucide-react";
import { Textarea } from "./ui/textarea";
import { ClientIcon } from "./ui/client-icon";

interface StartInterviewDialogProps {
  onStart: (config: {
    position: string;
    type: string;
    mode: "text" | "video";
    difficulty: "easy" | "medium" | "hard";
    cv?: File;
    jobDescription?: string;
    interviewId?: string;
  }) => Promise<void>;
}

export function StartInterviewDialog({ onStart }: StartInterviewDialogProps) {
  const [position, setPosition] = useState("");
  const [type, setType] = useState("");
  const [mode, setMode] = useState<"text" | "video">("text");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [cv, setCv] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userName = "there";

  const handleStart = async () => {
    if (position && type && !isSubmitting) {
      setIsSubmitting(true);

      try {
        await onStart({
          position,
          type,
          mode,
          difficulty,
          cv: cv || undefined,
          jobDescription: jobDescription || undefined,
        });
      } catch (error) {
        setIsSubmitting(false);
        console.error("Error starting interview:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-slate-900/5 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-slate-400/5" />

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-slate-500/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl">
        <Card className="w-full shadow-2xl border-0 bg-card/95 backdrop-blur-xl rounded-3xl overflow-hidden">
          {/* Header */}
          <CardHeader className="text-center space-y-4 sm:space-y-6 pb-6 sm:pb-8 bg-gradient-to-br from-muted/50 to-muted/30">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-3xl flex items-center justify-center shadow-lg">
              <ClientIcon
                icon={Sparkles}
                className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground"
              />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <CardTitle className="text-2xl sm:text-4xl font-bold text-primary">
                Interview Experience
              </CardTitle>
              <CardDescription className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
                Hello {userName}! Step into the future of interviews. An
                AI-powered conversation that adapts to you, understands your
                journey, and helps you showcase your best self.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            {/* Form Fields */}
            <div className="space-y-2 sm:space-y-3">
              <Label
                htmlFor="position"
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <ClientIcon icon={Briefcase} className="w-4 h-4 text-primary" />
                Position
              </Label>
              <Input
                id="position"
                placeholder="e.g., Senior Product Manager"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="h-12 sm:h-14 border-2 border-border focus:border-primary transition-all duration-200 rounded-2xl px-4 sm:px-6 text-base sm:text-lg bg-background/80 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ClientIcon icon={Settings} className="w-4 h-4 text-primary" />
                Interview Focus
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12 sm:h-14 border-2 border-border focus:border-primary rounded-2xl px-4 sm:px-6 text-base sm:text-lg bg-background/80 backdrop-blur-sm">
                  <SelectValue placeholder="What would you like to focus on?" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-2xl bg-popover backdrop-blur-xl">
                  <SelectItem
                    value="technical"
                    className="rounded-xl p-3 sm:p-4 text-sm sm:text-base"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <div>
                        <div className="font-medium text-foreground">
                          Technical Skills
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Deep dive into your technical expertise
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="behavioral"
                    className="rounded-xl p-3 sm:p-4 text-sm sm:text-base"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div>
                        <div className="font-medium text-foreground">
                          Behavioral & Leadership
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Explore your experiences and approach
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="system-design"
                    className="rounded-xl p-3 sm:p-4 text-sm sm:text-base"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <div>
                        <div className="font-medium text-foreground">
                          System Design
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Architecture and scalability thinking
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="cultural-fit"
                    className="rounded-xl p-3 sm:p-4 text-sm sm:text-base"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <div>
                        <div className="font-medium text-foreground">
                          Cultural Fit
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Values, collaboration, and team dynamics
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="leadership"
                    className="rounded-xl p-3 sm:p-4 text-sm sm:text-base"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <div>
                        <div className="font-medium text-foreground">
                          Leadership Assessment
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Vision, influence, and decision-making
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ClientIcon icon={Settings} className="w-4 h-4 text-primary" />
                Difficulty Level
              </Label>
              <RadioGroup
                value={difficulty}
                onValueChange={(value: "easy" | "medium" | "hard") =>
                  setDifficulty(value)
                }
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <RadioGroupItem
                      value="easy"
                      id="easy"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="easy"
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all cursor-pointer bg-card/80 backdrop-blur-sm ${
                        difficulty === "easy"
                          ? "border-green-500 bg-green-50 dark:bg-green-950"
                          : "border-border hover:border-green-500"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          difficulty === "easy"
                            ? "border-green-500 bg-green-500"
                            : "border-border"
                        }`}
                      >
                        {difficulty === "easy" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="text-center">
                        <div
                          className={`font-semibold text-sm ${
                            difficulty === "easy"
                              ? "text-green-700 dark:text-green-300"
                              : "text-foreground"
                          }`}
                        >
                          Easy
                        </div>
                        <div
                          className={`text-xs ${
                            difficulty === "easy"
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          Beginner friendly
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="relative">
                    <RadioGroupItem
                      value="medium"
                      id="medium"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="medium"
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all cursor-pointer bg-card/80 backdrop-blur-sm ${
                        difficulty === "medium"
                          ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                          : "border-border hover:border-yellow-500"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          difficulty === "medium"
                            ? "border-yellow-500 bg-yellow-500"
                            : "border-border"
                        }`}
                      >
                        {difficulty === "medium" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="text-center">
                        <div
                          className={`font-semibold text-sm ${
                            difficulty === "medium"
                              ? "text-yellow-700 dark:text-yellow-300"
                              : "text-foreground"
                          }`}
                        >
                          Medium
                        </div>
                        <div
                          className={`text-xs ${
                            difficulty === "medium"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          Standard level
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="relative">
                    <RadioGroupItem
                      value="hard"
                      id="hard"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="hard"
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all cursor-pointer bg-card/80 backdrop-blur-sm ${
                        difficulty === "hard"
                          ? "border-red-500 bg-red-50 dark:bg-red-950"
                          : "border-border hover:border-red-500"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          difficulty === "hard"
                            ? "border-red-500 bg-red-500"
                            : "border-border"
                        }`}
                      >
                        {difficulty === "hard" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="text-center">
                        <div
                          className={`font-semibold text-sm ${
                            difficulty === "hard"
                              ? "text-red-700 dark:text-red-300"
                              : "text-foreground"
                          }`}
                        >
                          Hard
                        </div>
                        <div
                          className={`text-xs ${
                            difficulty === "hard"
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          Expert level
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Label className="text-sm font-semibold text-gray-700">
                Interview Mode
              </Label>
              <RadioGroup
                value={mode}
                onValueChange={(value: "text" | "video") => setMode(value)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative">
                    <RadioGroupItem
                      value="text"
                      id="text"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="text"
                      className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-6 border-2 rounded-2xl transition-all cursor-pointer bg-card/80 backdrop-blur-sm ${
                        mode === "text"
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
                          mode === "text"
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {mode === "text" && (
                          <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                        )}
                      </div>
                      <ClientIcon
                        icon={MessageSquare}
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          mode === "text"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div>
                        <div
                          className={`font-semibold text-sm sm:text-base ${
                            mode === "text" ? "text-primary" : "text-foreground"
                          }`}
                        >
                          Chat Interview
                        </div>
                        <div
                          className={`text-xs sm:text-sm ${
                            mode === "text"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          Type your responses
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="relative">
                    <RadioGroupItem
                      value="video"
                      id="video"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="video"
                      className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-6 border-2 rounded-2xl transition-all cursor-pointer bg-card/80 backdrop-blur-sm ${
                        mode === "video"
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
                          mode === "video"
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {mode === "video" && (
                          <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                        )}
                      </div>
                      <ClientIcon
                        icon={Video}
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          mode === "video"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div>
                        <div
                          className={`font-semibold text-sm sm:text-base ${
                            mode === "video"
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          Video/Voice Interview
                        </div>
                        <div
                          className={`text-xs sm:text-sm ${
                            mode === "video"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          Speak with video or voice only
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="cv"
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <ClientIcon icon={FileText} className="w-4 h-4 text-primary" />
                Upload CV
              </Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 sm:p-6 text-center hover:border-primary transition-colors">
                <Input
                  id="cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCv(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Label
                  htmlFor="cv"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <ClientIcon
                    icon={Upload}
                    className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {cv ? cv.name : "Drop CV here or click to upload"}
                  </span>
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="jd"
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <ClientIcon icon={FileText} className="w-4 h-4 text-primary" />
                Job Description
              </Label>
              <Textarea
                id="jd"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[80px] sm:min-h-[100px] border-2 border-border focus:border-primary transition-colors bg-background/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
              />
            </div>

            {/* Start Button */}
            <div className="pt-4">
              <Button
                onClick={handleStart}
                disabled={!position || !type || isSubmitting}
                className="w-full h-14 sm:h-16 text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl rounded-2xl"
              >
                {isSubmitting
                  ? "Preparing Your Experience..."
                  : "Begin Interview"}
              </Button>
            </div>

            {/* Encouragement */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
              <p className="text-gray-700 font-medium text-sm sm:text-base">
                🌟 <strong>You're in the right place.</strong> This conversation
                is designed to help you showcase your best self.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
