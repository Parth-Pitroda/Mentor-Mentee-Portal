"use client";

import { useState } from "react";
import { updateProfileDetails } from "@/lib/actions/student.actions";

export default function ProfileManager({ profileData, mentorName, isOwnProfile }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Convert the array back to a comma-separated string for the text input
  const initialSkillsString = profileData?.skills ? profileData.skills.join(", ") : "";

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const department = formData.get("department") as string;
    const skills = formData.get("skills") as string;

    const result = await updateProfileDetails(profileData.$id, department, skills);

    if (result.success) {
      setIsEditing(false);
      window.location.reload();
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER WITH EDIT BUTTON */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">Mentorship Profile</h2>
          <p className="text-slate-500 mt-1 font-medium">Personal details, academic department, and system status.</p>
        </div>
        
        {isOwnProfile && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors text-sm"
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      {/* EDIT MODE FORM */}
      {isEditing ? (
        <form onSubmit={handleUpdate} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4">Update Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Department</label>
              <select name="department" defaultValue={profileData.department || ""} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none bg-white">
                <option value="">Select Department...</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information & Communication Tech">Information & Communication Tech</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Technical Skills</label>
              <input 
                name="skills" 
                type="text" 
                defaultValue={initialSkillsString}
                placeholder="e.g. React, Node.js, Python, UI/UX"
                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" 
              />
              <p className="text-xs text-slate-400 mt-1.5">Separate multiple skills with commas.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button disabled={isLoading} type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
            <button disabled={isLoading} type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* READ-ONLY VIEW (Moved from the previous page.tsx) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">Identity Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Full Name</p>
                <p className="text-lg font-medium text-slate-800">{profileData.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">University Email</p>
                <p className="text-slate-700">{profileData.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">System Role</p>
                <p className="capitalize text-slate-700">{profileData.role}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Verification Status</p>
                {profileData.isVerified ? (
                  <span className="inline-block px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-md text-xs font-bold uppercase">Verified Account</span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-md text-xs font-bold uppercase">Pending Verification</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">Academic Assignment</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Department</p>
                  <p className="text-slate-800 font-medium">{profileData.department || "Not Specified"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Primary Mentor</p>
                  <p className="text-blue-700 font-medium">{mentorName}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Registered Skills</h3>
              {profileData.skills && profileData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill: string, index: number) => (
                    <span key={index} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium border border-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm italic">No skills registered yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}