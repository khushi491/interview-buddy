export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br w-full px-2 sm:px-4 md:px-8 py-4">
      {children}
    </div>
  );
}
