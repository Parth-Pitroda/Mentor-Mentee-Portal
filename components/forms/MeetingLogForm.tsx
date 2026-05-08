"use client";

import { useState } from "react";
import { logMeeting } from "@/lib/actions/student.actions"; // <-- Import the secure action

export default function MeetingLogForm({ 
  profileId, 
  onSuccess 
}: { 
  profileId: string; 
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    topic: "",
    mentorName: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Call the Server Action
    const result = await logMeeting({
      studentId: profileId,
      topic: formData.topic,
      mentorName: formData.mentorName,
      description: formData.description,
      date: formData.date
    });

    if (result.success) {
      onSuccess(); // Close modal and refresh
    } else {
      setError(result.error || "Failed to save the meeting log.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Topic</label>
        <input
          required
          type="text"
          className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="e.g., SIH 2026 Discussion"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Mentor Name</label>
        <input
          required
          type="text"
          className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="e.g., Dr. R.K. Mehta"
          value={formData.mentorName}
          onChange={(e) => setFormData({ ...formData, mentorName: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
        <input
          required
          type="date"
          className="w-full p-2.5 border border-slate-200 rounded-lg outline-none"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Discussion Summary</label>
        <textarea
          required
          rows={4}
          className="w-full p-2.5 border border-slate-200 rounded-lg outline-none"
          placeholder="Briefly describe what was discussed..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-slate-400"
      >
        {isLoading ? "Saving Log securely..." : "Submit Log"}
      </button>
    </form>
  );
}