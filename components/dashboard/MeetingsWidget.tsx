"use client";

import { useState } from "react";
import { logMeeting } from "@/lib/actions/student.actions";

export default function MeetingsWidget({ 
  studentId, 
  initialData 
}: { 
  studentId: string, 
  initialData: any[] 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Set today's date as the default
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({ date: today, topic: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    await logMeeting(studentId, formData.date, formData.topic);
    
    setFormData({ date: today, topic: "" });
    setIsAdding(false);
    setIsLoading(false);
  }

  // Format date to be more readable (e.g., "Apr 15, 2026")
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800">Meeting Logs</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition-colors"
        >
          {isAdding ? "Cancel" : "+ Log Session"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
            <input 
              type="date" 
              required
              className="w-full text-sm p-2 border border-gray-300 rounded outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discussion Topic</label>
            <input 
              type="text" 
              placeholder="e.g., Resume Review"
              required
              className="w-full text-sm p-2 border border-gray-300 rounded outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-orange-500 text-white text-sm font-bold py-2 rounded hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Saving..." : "Save Log"}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {initialData.length === 0 && !isAdding ? (
          <div className="h-full flex flex-col justify-center items-center text-center opacity-70 py-4">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-xs text-gray-500">No meetings logged yet.<br/>Schedule a session with your mentor!</p>
          </div>
        ) : (
          initialData.map((meeting) => (
            <div key={meeting.$id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="mt-0.5 text-lg">💬</div>
              <div>
                <p className="text-sm font-bold text-gray-800 leading-tight">{meeting.topic}</p>
                <p className="text-xs text-orange-600 font-semibold mt-1">{formatDate(meeting.date)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}