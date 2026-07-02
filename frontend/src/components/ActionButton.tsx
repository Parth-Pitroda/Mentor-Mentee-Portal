import { useState } from "react";
import { Check, X } from "lucide-react";

export default function ActionButton({ onClick, label, danger }: { onClick: () => Promise<void>; label: string; danger?: boolean }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        await onClick();
        setLoading(false);
      }}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${danger ? "border border-rose-200 bg-rose-50 text-rose-600" : "bg-slate-900 text-white"}`}
    >
      {danger ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
      {loading ? "Working..." : label}
    </button>
  );
}
