import Link from "next/link";
import { signUpUser } from "@/lib/actions/auth.actions";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
          <span className="text-white text-2xl font-bold">P</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl border border-slate-200 sm:px-10">
          
          <form action={async (formData) => {
  "use server";
  await signUpUser(formData);
}} className="space-y-6">
            
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Legal Name</label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="Rahul Sharma"
                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number (For Students)</label>
              <input 
                type="text" 
                name="rollNo" 
                placeholder="e.g. 24BCP413D"
                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">University Email Address</label>
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="name@sot.pdpu.ac.in"
                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                Student and Faculty roles are assigned automatically based on email.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                name="password" 
                required 
                placeholder="••••••••"
                minLength={8}
                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Register Account
              </button>
            </div>
            
          </form>

        </div>
      </div>
    </div>
  );
}