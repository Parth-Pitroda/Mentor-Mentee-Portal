import React from "react";
import { Inbox } from "lucide-react";

export default function Queue({ records, empty, render }: { records: any[]; empty: string; render: (record: any) => React.ReactNode }) {
  if (!records?.length) {
    return (
      <div className="mx-auto my-8 max-w-xl rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <Inbox className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h3 className="text-base font-bold text-slate-800">{empty}</h3>
      </div>
    );
  }
  return <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{records.map(render)}</div>;
}
