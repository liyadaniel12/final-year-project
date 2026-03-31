export default function Home() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
}
