"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function InterviewIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page if no interview ID is provided
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
