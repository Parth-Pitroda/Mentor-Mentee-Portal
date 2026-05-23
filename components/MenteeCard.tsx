import Link from "next/link";

export default function MenteeCard({ student }: { student: any }) {
  // Helper to grab initials (e.g., "Rahul Sharma" -> "RS")
  const getInitials = (name: string) => {
    if (!name) return "S";
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Link 
      href={`?tab=student-profile&id=${student.$id}`}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden cursor-pointer"
    >
      
      {/* --- AVATAR --- */}
      {/* Added group-hover:scale-105 so the image slightly zooms when hovering the card */}
      <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl border-4 border-white shadow-sm overflow-hidden z-10 shrink-0 relative mb-4 transition-transform duration-300 group-hover:scale-105">
        {student.profilePictureId ? (
          <img 
            src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${student.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
            alt={`${student.fullName} Profile`}
            className="w-full h-full object-cover"
          />
        ) : (
          getInitials(student.fullName)
        )}
      </div>

      {/* --- DETAILS --- */}
      <div className="z-10 w-full">
        <h3 className="text-lg font-bold text-slate-800 truncate px-2 group-hover:text-blue-700 transition-colors" title={student.fullName}>
          {student.fullName || "Unnamed Student"}
        </h3>
        <p className="text-sm text-slate-500 mb-3 truncate px-2" title={student.email}>
          {student.email}
        </p>
        
        <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
          {student.department || "Unassigned"}
        </div>
      </div>

    </Link>
  );
}