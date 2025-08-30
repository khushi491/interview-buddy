import { Brain } from 'lucide-react';

interface FeedbackCardProps {
  feedback: string;
  isLoading?: boolean;
}

export default function FeedbackCard({ feedback, isLoading = false }: FeedbackCardProps) {
  if (!feedback && !isLoading) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-purple-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          AI Feedback
        </h3>
      </div>
      
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Generating feedback...
            </p>
          </div>
        ) : (
          <p className="text-gray-900 dark:text-white">
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
} 