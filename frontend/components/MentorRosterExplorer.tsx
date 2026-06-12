"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MenteeCard, { type MenteeCardStudent } from "@/components/MenteeCard";

type ViewMode = "all" | "top";

function normalize(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function getSearchText(mentee: MenteeCardStudent) {
  return [
    mentee.fullName,
    mentee.email,
    mentee.rollNo,
    mentee.department,
    mentee.semester,
  ].map(normalize).join(" ");
}

function getScore(mentee: MenteeCardStudent) {
  return Number(mentee.performanceScore || mentee.latestCpi || mentee.cgpa || mentee.latestSpi || 0);
}

export default function MentorRosterExplorer({ mentees }: { mentees: MenteeCardStudent[] }) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  const rankedMentees = useMemo(() => {
    return [...mentees].sort((a, b) => {
      const scoreDelta = getScore(b) - getScore(a);
      if (scoreDelta !== 0) return scoreDelta;

      return normalize(a.fullName).localeCompare(normalize(b.fullName));
    });
  }, [mentees]);

  const topPerformers = useMemo(() => {
    return rankedMentees.filter((mentee) => getScore(mentee) > 0).slice(0, 5);
  }, [rankedMentees]);

  const visibleMentees = useMemo(() => {
    const source = viewMode === "top" ? topPerformers : mentees;
    const search = normalize(query);

    if (!search) return source;
    return source.filter((mentee) => getSearchText(mentee).includes(search));
  }, [mentees, query, topPerformers, viewMode]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <label htmlFor="mentee-search" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Search Mentees
            </label>
            <input
              id="mentee-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, roll number, email, department, or semester"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex w-full rounded-lg border border-slate-200 bg-slate-100 p-1 lg:w-fit">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded-md px-4 py-2 text-sm font-bold transition ${
                viewMode === "all" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setViewMode("top")}
              className={`rounded-md px-4 py-2 text-sm font-bold transition ${
                viewMode === "top" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Top
            </button>
          </div>
        </div>
      </div>

      {topPerformers.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">Top Performing Mentees</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Highest academic scores under your guidance</h2>
            </div>
            <span className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-bold text-green-700">
              {topPerformers.length} ranked
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {topPerformers.map((mentee, index) => (
              <Link
                key={mentee.$id}
                href={`?tab=student-profile&id=${mentee.$id}`}
                className="rounded-lg border border-green-100 bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{mentee.fullName || "Unnamed Student"}</p>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">{mentee.rollNo || mentee.department || "No roll number"}</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-100 text-xs font-black text-green-700">
                    {index + 1}
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {mentee.performanceSource || "Score"}
                    </p>
                    <p className="text-2xl font-black text-green-700">{getScore(mentee).toFixed(2)}</p>
                  </div>
                  {mentee.latestAcademicSemester && (
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                      Sem {mentee.latestAcademicSemester}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {visibleMentees.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-lg font-bold text-slate-800">No matching mentees</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">Adjust the search or switch back to the full roster.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleMentees.map((mentee) => (
            <MenteeCard key={mentee.$id} student={mentee} />
          ))}
        </div>
      )}
    </div>
  );
}
