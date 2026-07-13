import React from "react";
import { Link } from "react-router-dom";

export default function StatCard({ label, value, to }: { label: string; value: React.ReactNode; to?: string }) {
  const content = (
    <>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200">
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}
