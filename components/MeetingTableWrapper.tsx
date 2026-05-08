"use client";

import { useState } from "react";
import MeetingLogForm from "./forms/MeetingLogForm";
import { updateMeetingStatus } from "@/lib/actions/student.actions";

export default function MeetingTableWrapper({ initialMeetings, profileId, isMentor = false }: any) {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle Mentor Verification Actions
  const handleStatusUpdate = async (status: "Verified" | "Rejected") => {
    setIsUpdating(true);
    await updateMeetingStatus(selectedLog.$id, status, profileId);
    setIsUpdating(false);
    setSelectedLog(null);
    window.location.reload(); // Refresh to see the new badge color
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Recent Meeting Logs</h3>
            <p className="text-xs text-slate-400">View and track your mentorship history</p>
          </div>
          
          {/* Only mentees should see the "New Meeting Log" button */}
          {!isMentor && (
            <button 
              onClick={() => setIsNewModalOpen(true)}
              className="text-sm px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm shadow-blue-100"
            >
              New Meeting Log
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Meeting Topic</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialMeetings.length > 0 ? (
                initialMeetings.map((log: any) => (
                  <tr key={log.$id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{log.date}</td>
                    <td className="px-6 py-4 text-slate-600">{log.topic}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                        log.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' : 
                        log.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-yellow-50 text-yellow-700 border-yellow-100'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">No meeting logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal for Creating a NEW Log */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 relative">
            <button onClick={() => setIsNewModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Meeting Log</h2>
            <MeetingLogForm profileId={profileId} onSuccess={() => { setIsNewModalOpen(false); window.location.reload(); }} />
          </div>
        </div>
      )}

      {/* 2. Modal for VIEWING Log Details */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 relative">
            <button onClick={() => setSelectedLog(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            
            <div className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedLog.topic}</h2>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                  selectedLog.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' : 
                  selectedLog.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                  'bg-yellow-50 text-yellow-700 border-yellow-100'
                }`}>
                  {selectedLog.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium">Date: {selectedLog.date} • Mentor: {selectedLog.mentorName || "Not Specified"}</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Discussion Summary</h3>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedLog.description}</p>
            </div>

            {/* MENTOR ACTION BUTTONS */}
            {isMentor && selectedLog.status === 'Pending' && (
              <div className="flex gap-3 mb-4">
                <button 
                  onClick={() => handleStatusUpdate("Verified")}
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? "..." : "✓ Verify Meeting"}
                </button>
                <button 
                  onClick={() => handleStatusUpdate("Rejected")}
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}

            <button 
              onClick={() => setSelectedLog(null)}
              className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </>
  );
}