export default function LoadingPage({ label = "Loading portal..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
      {label}
    </div>
  );
}
