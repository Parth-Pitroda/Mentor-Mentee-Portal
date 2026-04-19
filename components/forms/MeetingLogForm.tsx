"use client";

import { useState } from "react";
import { ID } from "appwrite";
import { databases } from "@/lib/appwrite/config";

export default function MeetingLogForm({ 
  profileId, 
  onSuccess 
}: { 
  profileId: string; 
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    mentorName: "", // <-- Added this
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
      const MEETINGS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!; 

      await databases.createDocument(
        DATABASE_ID,
        MEETINGS_COLLECTION,
        ID.unique(),
        {
          studentId: profileId,
          topic: formData.topic,
          mentorName: formData.mentorName, // <-- Added to the payload
          description: formData.description,
          date: formData.date,
          status: "Pending",
        }
      );

      onSuccess();
    } catch (error: any) {
      console.error("Failed to create log:", error);
      alert(`Error saving log: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* <-- New Mentor Name Input field --> */}
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
        {isLoading ? "Saving..." : "Submit Log"}
      </button>
    </form>
  );
}