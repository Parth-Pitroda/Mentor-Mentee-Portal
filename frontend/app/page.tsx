import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getProfileByEmail } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const user = await getLoggedInUser();

  if (user) {
    const profileData = await getProfileByEmail(user.email);
    if (!profileData) {
      redirect("/onboarding");
    }

    const role = profileData.role;
    const department = profileData.department;
    const profileId = profileData.$id;

    if (role === "admin") {
      redirect("/admin-dashboard");
    }

    if (role === "mentor") {
      redirect("/mentor-dashboard");
    }

    if (role === "mentee" || role === "student") {
      const isProfileComplete =
        department &&
        department !== "Pending Assignment" &&
        department !== "Unassigned";

      if (!isProfileComplete) {
        redirect("/onboarding");
      }

      redirect(`/dashboard/${profileId}`);
    }
  }

  return (
    <div className="relative isolate overflow-hidden bg-white min-h-screen">
      {/* Background gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-semibold leading-6 text-indigo-600 ring-1 ring-inset ring-indigo-500/20">
              AI-Powered Mentorship
            </span>
          </div>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Accelerate your career with the right mentor.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Connect, schedule, and grow with industry experts at PDEU. Our AI dynamically matches you with mentors tailored to your academic goals and learning style.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Link href="/sign-up" className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all">
              Get Started
            </Link>
            <Link href="/sign-in" className="text-sm font-semibold leading-6 text-slate-900 hover:text-indigo-600 transition-colors">
              Sign In <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Right side illustration/dashboard preview */}
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="rounded-xl bg-slate-50/50 p-2 ring-1 ring-slate-200 lg:-m-4 lg:rounded-2xl lg:p-4 shadow-2xl backdrop-blur-sm">
               <div className="h-[450px] w-[700px] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  {/* Fake Header */}
                  <div className="h-12 border-b border-slate-100 flex items-center px-4 justify-between bg-slate-50/80">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                     </div>
                     <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
                  </div>
                  {/* Fake Content */}
                  <div className="flex-1 p-6 flex gap-6">
                     <div className="w-48 h-full space-y-3">
                        <div className="h-8 w-full bg-indigo-50 rounded-md border border-indigo-100"></div>
                        <div className="h-8 w-full bg-slate-50 rounded-md"></div>
                        <div className="h-8 w-full bg-slate-50 rounded-md"></div>
                        <div className="h-8 w-full bg-slate-50 rounded-md"></div>
                     </div>
                     <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-center">
                           <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                           <div className="h-8 w-24 bg-indigo-600 rounded-lg"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="h-32 bg-slate-50 rounded-xl border border-slate-100 p-4">
                              <div className="h-4 w-1/2 bg-slate-200 rounded mb-2"></div>
                              <div className="h-8 w-1/4 bg-slate-300 rounded mb-4"></div>
                              <div className="h-2 w-full bg-slate-200 rounded-full"></div>
                           </div>
                           <div className="h-32 bg-violet-50 rounded-xl border border-violet-100 p-4">
                              <div className="flex justify-between items-start">
                                 <div className="h-10 w-10 bg-violet-200 rounded-full"></div>
                                 <div className="h-5 w-16 bg-violet-200 rounded-full"></div>
                              </div>
                              <div className="h-4 w-3/4 bg-violet-200 rounded mt-4"></div>
                           </div>
                        </div>
                        <div className="h-48 bg-slate-50 rounded-xl border border-slate-100 p-4">
                           <div className="h-4 w-1/3 bg-slate-200 rounded mb-4"></div>
                           <div className="space-y-2">
                              <div className="h-10 w-full bg-white border border-slate-100 rounded-lg"></div>
                              <div className="h-10 w-full bg-white border border-slate-100 rounded-lg"></div>
                              <div className="h-10 w-full bg-white border border-slate-100 rounded-lg"></div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
      </div>
    </div>
  );
}
