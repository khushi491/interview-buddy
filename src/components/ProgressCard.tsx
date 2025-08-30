import { CheckCircle } from 'lucide-react';

interface ProgressCardProps {
  questions: string[];
  completedCount: number;
}

export default function ProgressCard({ questions, completedCount }: ProgressCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Interview Progress
      </h3>
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div key={index} className="flex items-center gap-2">
            {index < completedCount ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
            )}
            <span className={`text-sm ${
              index < completedCount 
                ? 'text-green-600 font-medium' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              Question {index + 1}
            </span>
          </div>
        ))}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>{completedCount} of {questions.length}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${questions.length > 0 ? (completedCount / questions.length) * 100 : 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
} 