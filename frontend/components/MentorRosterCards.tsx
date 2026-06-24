"use client";

import { useMemo } from "react";
import MenteeCard from "./MenteeCard";
import { Users } from "lucide-react";

export default function MentorRosterCards({ mentees, searchQuery = "" }: { mentees: any[], searchQuery?: string }) {
  const filteredMentees = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return mentees;

    return mentees.filter((m) => {
      return (
        String(m.fullName || "").toLowerCase().includes(search) ||
        String(m.email || "").toLowerCase().includes(search) ||
        String(m.rollNo || "").toLowerCase().includes(search) ||
        String(m.department || "").toLowerCase().includes(search)
      );
    });
  }, [mentees, searchQuery]);

  return (
    <div className="space-y-6">
      {filteredMentees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center select-none animate-in fade-in duration-300">
          <Users className="w-10 h-10 text-slate-350 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-850">No mentees found</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1">No profiles match the search query "{searchQuery}".</p>
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
