"use client";

import { PaperAirplaneIcon, SparklesIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function MessagesPage() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "mentor", text: "Hi! Looking forward to our session tomorrow. Please share your current resume.", time: "10:30 AM" },
    { id: 2, sender: "me", text: "Hello Dr. Smith! I'll upload it right now.", time: "10:45 AM" },
    { id: 3, sender: "me", text: "Is there anything specific I should prepare for the mock interview portion?", time: "10:46 AM" },
    { id: 4, sender: "mentor", text: "Just review the standard system design patterns we discussed last week. I'll test you on load balancing concepts.", time: "11:00 AM" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: "me", text: input, time: "Now" }]);
    setInput("");
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 p-4">
      {/* Sidebar - Contacts */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-900">Messages</h2>
          <div className="mt-3 relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Active Contact */}
          <div className="p-4 border-b border-slate-100 bg-indigo-50 cursor-pointer transition-colors flex items-center gap-3">
             <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://ui-avatars.com/api/?name=Jane+Smith&background=random" className="h-10 w-10 rounded-full" alt="Mentor" />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-bold text-slate-900 truncate">Dr. Jane Smith</h3>
                <span className="text-xs text-indigo-600 font-medium">11:00 AM</span>
              </div>
              <p className="text-xs text-slate-600 truncate mt-0.5">Just review the standard system...</p>
            </div>
          </div>
          {/* Inactive Contact */}
          <div className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3">
             <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://ui-avatars.com/api/?name=Alan+Turing&background=random" className="h-10 w-10 rounded-full grayscale opacity-80" alt="Mentor" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-semibold text-slate-700 truncate">Prof. Alan Turing</h3>
                <span className="text-xs text-slate-400">Yesterday</span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">Great session today!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://ui-avatars.com/api/?name=Jane+Smith&background=random" className="h-10 w-10 rounded-full" alt="Mentor" />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dr. Jane Smith</h3>
              <p className="text-xs text-slate-500">Online • Senior AI Researcher</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-violet-100">
              <SparklesIcon className="h-4 w-4" />
              AI Summarize
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          <div className="flex justify-center">
             <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">Today</span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
              {msg.sender === "mentor" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="https://ui-avatars.com/api/?name=Jane+Smith&background=random" className="h-8 w-8 rounded-full self-end mb-1" alt="" />
              )}
              <div className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[80%] shadow-sm ${
                  msg.sender === "me"
                    ? "rounded-br-sm bg-indigo-600 text-white"
                    : "rounded-bl-sm bg-white border border-slate-200 text-slate-800"
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-100 p-4 bg-white">
          {/* Smart Replies Suggestion */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            <button className="whitespace-nowrap text-xs font-medium text-violet-700 bg-violet-50 border border-violet-100 hover:bg-violet-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-sm">
              <SparklesIcon className="h-3 w-3" /> Got it, thanks!
            </button>
            <button className="whitespace-nowrap text-xs font-medium text-violet-700 bg-violet-50 border border-violet-100 hover:bg-violet-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-sm">
              <SparklesIcon className="h-3 w-3" /> What specific patterns?
            </button>
          </div>

          <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 shadow-sm transition-all">
            <button className="p-2 text-slate-400 hover:text-violet-600 transition-colors rounded-lg hover:bg-white" title="Generate AI Reply">
              <SparklesIcon className="h-5 w-5" />
            </button>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
              placeholder="Type your message..."
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-500 shadow-sm transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed mb-0.5"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
