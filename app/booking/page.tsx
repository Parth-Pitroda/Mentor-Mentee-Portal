"use client";

import { useState } from "react";
import { CalendarIcon, ClockIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState("Oct 24");
  const [selectedTime, setSelectedTime] = useState("");

  const dates = [
    { day: "Mon", date: "Oct 23", available: false },
    { day: "Tue", date: "Oct 24", available: true },
    { day: "Wed", date: "Oct 25", available: true },
    { day: "Thu", date: "Oct 26", available: true },
    { day: "Fri", date: "Oct 27", available: false },
  ];

  const times = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
    "03:00 PM", "04:00 PM"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book a Session</h1>
        <p className="mt-1 text-sm text-slate-500">Schedule your next 1-on-1 mentorship meeting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Mentor Info Sidebar */}
        <div className="col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://ui-avatars.com/api/?name=Jane+Smith&background=random" alt="Mentor" className="h-20 w-20 rounded-full border border-slate-100 object-cover mb-4" />
              <h2 className="text-lg font-bold text-slate-900">Dr. Jane Smith</h2>
              <p className="text-sm text-slate-500">Senior AI Researcher</p>
            </div>

            <hr className="my-6 border-slate-100" />

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <ClockIcon className="h-5 w-5 text-slate-400" />
                <span>45 Minute Session</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <VideoCameraIcon className="h-5 w-5 text-slate-400" />
                <span>Google Meet</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CalendarIcon className="h-5 w-5 text-slate-400" />
                <span>
                  {selectedDate ? selectedDate : "Select a date"}
                  {selectedTime ? `, ${selectedTime}` : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Date/Time Selection Main */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {/* Date Selector */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Select a Date</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {dates.map((d) => (
                <button
                  key={d.date}
                  disabled={!d.available}
                  onClick={() => { setSelectedDate(d.date); setSelectedTime(""); }}
                  className={`flex flex-col items-center justify-center min-w-[4rem] rounded-xl border p-3 transition-all ${
                    !d.available
                      ? "border-slate-100 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed"
                      : selectedDate === d.date
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                  }`}
                >
                  <span className="text-xs uppercase font-medium mb-1">{d.day}</span>
                  <span className="text-lg font-bold">{d.date.split(" ")[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Selector */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Available on {selectedDate}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {times.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`flex items-center justify-center rounded-lg border py-2.5 text-sm font-medium transition-all ${
                    selectedTime === time
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm Action */}
          <div className="pt-4 flex justify-end">
            <button
              disabled={!selectedTime}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
