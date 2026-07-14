"use client";

import { useMemo, useState } from "react";
import MenteeCard from "./MenteeCard";
import { Users, ArrowUpDown } from "lucide-react";

export default function MentorRosterCards({ mentees, searchQuery = "" }: { mentees: any[], searchQuery?: string }) {
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredMentees = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    let result = [...mentees];

    // 1. Apply Search Query
    if (search) {
      result = result.filter((m) => {
        return (
          String(m.fullName || "").toLowerCase().includes(search) ||
          String(m.email || "").toLowerCase().includes(search) ||
          String(m.rollNo || "").toLowerCase().includes(search) ||
          String(m.department || "").toLowerCase().includes(search)
        );
      });
    }

    // 2. Apply Sorting
    result.sort((a, b) => {
      let compare = 0;

      if (sortBy === "name") {
        compare = String(a.fullName || "").localeCompare(String(b.fullName || ""));
      } else if (sortBy === "roll") {
        compare = String(a.rollNo || "").localeCompare(String(b.rollNo || ""));
      } else if (sortBy === "cgpa") {
        const valA = parseFloat(String(a.cgpa || 0)) || 0;
        const valB = parseFloat(String(b.cgpa || 0)) || 0;
        compare = valA - valB;
      } else if (sortBy === "backlogs") {
        const valA = parseInt(String(a.backlogs || 0), 10) || 0;
        const valB = parseInt(String(b.backlogs || 0), 10) || 0;
        compare = valA - valB;
      }

      return sortOrder === "asc" ? compare : -compare;
    });

    return result;
  }, [mentees, searchQuery, sortBy, sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider select-none">Sort By:</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold py-2 pl-4 pr-10 rounded cursor-pointer transition-all duration-200 outline-none border-0 select-none font-sans"
              >
                <option value="name">Name</option>
                <option value="roll">Roll Number</option>
                <option value="cgpa">CGPA</option>
                <option value="backlogs">Backlogs</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 hover:bg-slate-200/80 text-slate-550 hover:text-slate-800 transition-all duration-200 cursor-pointer"
              title={sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"}
            >
              <ArrowUpDown className={`h-4.5 w-4.5 transition-transform duration-350 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {filteredMentees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center select-none animate-in fade-in duration-300">
          <Users className="w-10 h-10 text-slate-350 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-850">No mentees found</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1">No profiles match the search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMentees.map((student, idx) => (
            <MenteeCard key={student.$id} student={student} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
