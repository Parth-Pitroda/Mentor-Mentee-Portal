"use client";

export default function DownloadTranscriptBtn() {
  return (
    <button 
      onClick={() => window.print()}
      className="text-sm px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors font-medium cursor-pointer"
    >
      Download Transcript
    </button>
  );
}