"use client";

import { useState } from "react";
import DeleteUserButton from "@/components/DeleteUserButton";

export default function UserManagementTable({ profiles }: { profiles: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Real-time filtering logic: checks name, email, role, or department!
  const filteredProfiles = profiles.filter((profile) => {
    const query = searchQuery.toLowerCase();
    return (
      profile.fullName?.toLowerCase().includes(query) ||
      profile.email?.toLowerCase().includes(query) ||
      profile.role?.toLowerCase().includes(query) ||
      profile.department?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Table Header & Search Bar */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Master User Directory</h2>
          <p className="text-sm text-slate-500">Showing {filteredProfiles.length} of {profiles.length} users</p>
        </div>
        
        {/* The Live Search Input */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-400">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>
      
      {/* The Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Name & Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4 text-right">Danger Zone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                  No users found matching "{searchQuery}"
                </td>
              </tr>
            ) : (
              filteredProfiles.map((profile: any) => (
                <tr key={profile.$id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{profile.fullName}</p>
                    <p className="text-xs text-slate-500">{profile.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    {profile.role === 'mentor' ? (
                      <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">Mentor</span>
                    ) : profile.role === 'admin' ? (
                      <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">Admin</span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">Mentee</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{profile.department || "N/A"}</td>
                  <td className="px-6 py-4 text-right">
                    <DeleteUserButton profileId={profile.$id} role={profile.role} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}