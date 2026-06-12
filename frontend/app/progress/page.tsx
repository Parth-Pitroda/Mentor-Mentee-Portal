import { ChartBarIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default function ProgressPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mentorship Progress</h1>
        <p className="mt-1 text-sm text-slate-500">Track your goals, completed milestones, and upcoming tasks.</p>
      </div>

      {/* Bento Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {/* Main Progress (Spans 2 cols) */}
        <div className="md:col-span-2 lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-indigo-600" />
              Core Objectives
            </h2>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">On Track</span>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">Resume & Portfolio Review</span>
                <span className="font-bold text-emerald-600">100%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 w-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">Mock Interviews</span>
                <span className="font-bold text-indigo-600">60%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600 w-[60%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">System Design Prep</span>
                <span className="font-bold text-amber-500">25%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 w-[25%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="rounded-2xl border border-transparent bg-indigo-600 p-6 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-indigo-500 opacity-50 blur-2xl"></div>
          <div>
            <h2 className="text-sm font-semibold text-indigo-100 flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Total Hours
            </h2>
            <p className="text-5xl font-black mt-4 tracking-tight">12.5</p>
          </div>
          <div className="mt-8 pt-4 border-t border-indigo-500/50">
            <p className="text-sm font-medium text-indigo-50">+2.5 hrs this month</p>
          </div>
        </div>

        {/* Milestones Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
            Milestones
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">First Meeting</p>
                <p className="text-xs text-slate-500">Oct 1st</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Goal Setting</p>
                <p className="text-xs text-slate-500">Oct 5th</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center flex-shrink-0">
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Mock Interview 1</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Shared Resources (Spans 2 cols) */}
        <div className="md:col-span-3 lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-blue-500" />
              Recent Resources
            </h2>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "System Design Primer", type: "PDF", date: "Oct 20" },
              { title: "Behavioral Qs Guide", type: "Link", date: "Oct 15" },
              { title: "Resume Template", type: "Doc", date: "Oct 10" },
            ].map((resource, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white transition-colors cursor-pointer group">
                <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:border-indigo-200">
                  <DocumentTextIcon className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{resource.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{resource.type}</span>
                    <span className="text-[10px] text-slate-400">• {resource.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
