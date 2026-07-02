import React from "react";
import { Eye } from "lucide-react";
import { getFileViewUrl } from "@/lib/files";

export default function ApprovalCard({ icon, title, meta, body, fileId, children }: { icon: React.ReactNode; title: string; meta?: string; body?: string; fileId?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">{icon}</div>
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          {meta && <p className="text-xs font-semibold text-slate-500">{meta}</p>}
        </div>
      </div>
      {body && <p className="mb-5 text-sm text-slate-600">{body}</p>}
      <div className="flex flex-wrap gap-2">
        {fileId && (
          <a href={getFileViewUrl(fileId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700">
            <Eye className="h-3.5 w-3.5" /> View
          </a>
        )}
        {children}
      </div>
    </div>
  );
}
