"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VoiceInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  useEffect(() => {
    // Redirect to video interview route since voice and video are now the same mode
    router.replace(`/video-interview/${interviewId}`);
  }, [interviewId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to video interview...</p>
      </div>
    </div>
  );
}
