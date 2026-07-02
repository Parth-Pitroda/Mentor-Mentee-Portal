import { SparklesIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";

// Dummy data for visual representation
const mentors = [
  {
    id: 1,
    name: "Dr. Jane Smith",
    role: "Senior AI Researcher",
    company: "Google DeepMind",
    avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=random",
    expertise: ["Machine Learning", "Python", "Data Science"],
    matchScore: 98,
    nextAvailable: "Tomorrow, 10 AM",
  },
  {
    id: 2,
    name: "Prof. Alan Turing",
    role: "Cryptography Lead",
    company: "Bletchley Park",
    avatar: "https://ui-avatars.com/api/?name=Alan+Turing&background=random",
    expertise: ["Algorithms", "Security", "Math"],
    matchScore: 92,
    nextAvailable: "Friday, 2 PM",
  },
  {
    id: 3,
    name: "Grace Hopper",
    role: "Distinguished Engineer",
    company: "IBM",
    avatar: "https://ui-avatars.com/api/?name=Grace+Hopper&background=random",
    expertise: ["System Design", "Compilers", "Leadership"],
    matchScore: 85,
    nextAvailable: "Next Mon, 9 AM",
  },
];

export default function MentorSearchPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Find a Mentor</h1>
          <p className="mt-1 text-sm text-slate-500">Discover and connect with industry experts tailored to your goals.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-200 transition-colors">
            <SparklesIcon className="h-4 w-4 text-violet-500" />
            AI Auto-Match
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, company, or expertise..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
          />
        </div>
        <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          Filters
        </button>
      </div>

      {/* Grid of Mentors */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mentors.map((mentor) => (
          <div key={mentor.id} className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mentor.avatar} alt={mentor.name} className="h-14 w-14 rounded-full object-cover border border-slate-100" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{mentor.name}</h3>
                  <p className="text-sm text-slate-500 truncate max-w-[120px]" title={`${mentor.role} at ${mentor.company}`}>{mentor.role}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-600/20">
                  <SparklesIcon className="h-3 w-3 text-violet-500" />
                  {mentor.matchScore}% Match
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {mentor.expertise.map((skill: string) => (
                <span key={skill} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="text-sm text-slate-500">
                Next available:<br/>
                <span className="font-medium text-slate-900">{mentor.nextAvailable}</span>
              </div>
              <button className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
