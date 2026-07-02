import type { NoticeRecord } from "@/types";

export default function NoticeList({ notices }: { notices: NoticeRecord[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-bold text-slate-900">Recent Broadcasts</h2>
      <div className="space-y-4">
        {notices.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No notices have been published yet.</p>
        ) : (
          notices.map((notice) => (
            <div key={notice.$id} className="rounded-xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900">{notice.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{notice.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
