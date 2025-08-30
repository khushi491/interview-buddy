"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { InterviewAnalysis } from "@/components/interview-analysis";
import { PageLoader } from "@/components/ui/page-loader";

export default function InterviewAnalysisPage() {
  const params = useParams();
  const interviewId = params?.id as string;
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/interviews/${interviewId}/analysis`);
        const data = await res.json();
        if (data.analysis) {
          setAnalysis(data.analysis);
          setLoading(false);
        } else {
          // No analysis, trigger generation
          const interviewRes = await fetch(`/api/interviews/${interviewId}`);
          const interviewData = await interviewRes.json();
          if (!interviewData.interview) throw new Error("Interview not found");
          const analyzeRes = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              interviewData: {
                position: interviewData.interview.position,
                type: interviewData.interview.type,
                candidateName:
                  interviewData.interview.candidateName || "Candidate",
                duration: interviewData.interview.elapsedTime || 0,
                messages: interviewData.interview.transcript || [],
              },
            }),
          });
          const analysisResult = await analyzeRes.json();
          // Save analysis
          await fetch(`/api/interviews/${interviewId}/analysis`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ analysis: analysisResult }),
          });
          setAnalysis(analysisResult);
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load analysis");
        setLoading(false);
      }
    }
    if (interviewId) fetchAnalysis();
  }, [interviewId]);

  if (loading)
    return <PageLoader isLoading={true} message="Loading analysis..." />;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!analysis) return <div className="p-8">No analysis available.</div>;

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-8 py-4">
      <InterviewAnalysis
        analysis={analysis}
        config={{
          candidateName: "Candidate",
          position: "",
          type: "",
          mode: "text",
        }}
        messages={[]}
      />
    </div>
  );
}
