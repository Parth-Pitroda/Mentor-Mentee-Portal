import Link from "next/link";
import { getFileViewUrl } from "@/lib/files";

export type MenteeCardStudent = {
  $id: string;
  fullName?: string;
  email?: string;
  department?: string;
  rollNo?: string;
  semester?: string | number;
  cgpa?: string | number;
  latestCpi?: string | number;
  latestSpi?: string | number;
  latestAcademicSemester?: string | number;
  performanceScore?: number;
  performanceSource?: string;
  profilePictureId?: string;
  interests?: string;
  backlogs?: string | number;
};


export default function MenteeCard({ student, index = 0 }: { student: MenteeCardStudent; index?: number }) {
  const getInitials = (name?: string) => {
    if (!name) return "S";
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Link 
      href={`?tab=student-profile&id=${student.$id}`}
      style={{ animationDelay: `${index * 45}ms` }}
      className="animate-fade-in-up group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-[0_12px_30px_rgba(59,130,246,0.08)] hover:-translate-y-1.5 transition-all duration-300"
    >


      {/* --- IMAGE TOP HALF --- */}
      <div className="relative w-full h-48 bg-slate-50 overflow-hidden border-b border-slate-100 shrink-0">
        {student.profilePictureId ? (
          <img 
            src={getFileViewUrl(student.profilePictureId)}
            alt={`${student.fullName} Profile`}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-white text-4xl font-black tracking-wider group-hover:scale-108 transition-transform duration-700">
            {getInitials(student.fullName)}
          </div>
        )}
      </div>

      {/* --- CONTENT BOTTOM HALF --- */}
      <div className="p-4 flex flex-col justify-center flex-grow min-w-0">
        <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors truncate" title={student.fullName}>
          {student.fullName || "Unnamed Student"}
        </h3>
        <p className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors duration-300 mt-1">
          {student.rollNo || "No Roll Number"}
        </p>
      </div>
    </Link>
  );
}
