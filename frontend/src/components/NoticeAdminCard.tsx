import React from "react";
import type { NoticeRecord } from "@/types";

export default function NoticeAdminCard({ notices, onSubmit }: { notices: NoticeRecord[]; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-800">Global Notice</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="title" required placeholder="Notice title" className="w-full rounded-lg border border-slate-200 p-3 text-sm" />
        <textarea name="content" required placeholder="Notice content" className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm" />
        <button className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white">Publish</button>
      </form>
      <div className="mt-5 space-y-3">
        {notices.map((notice) => (
          <div key={notice.$id} className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-bold text-slate-800">{notice.title}</p>
            <p className="text-slate-500">{notice.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
