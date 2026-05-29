# Frontend Design Plan: Mentor-Mentee Portal

## 1. Design System & UX Philosophy

**Inspiration:**
- **Stripe:** Crisp typography, subtle gradients, soft drop-shadows, and high-contrast primary actions.
- **Notion:** Minimalist layout, strong use of whitespace, and clear hierarchy.
- **Modern SaaS Dashboards:** Bento-box grid layouts, collapsible sidebars, and contextual AI-assistant popovers.

### Color Palette (Tailwind CSS)
- **Backgrounds:** `bg-slate-50` (App background), `bg-white` (Cards, Modals)
- **Primary:** `text-indigo-600`, `bg-indigo-600` (Main actions, brand identity)
- **Secondary/Text:** `text-slate-900` (Headings), `text-slate-500` (Body/Subtext)
- **AI/Magic Accent:** `text-violet-600`, `bg-violet-100` (Used to highlight AI-powered features like matching and AI chat)
- **Status Indicators:** `bg-emerald-500` (Online/Success), `bg-amber-500` (Pending/Warning)

### Typography
- **Font:** Inter (already configured in `layout.tsx`).
- **Styling:** Heavy use of font-weights for hierarchy (e.g., `font-semibold` for card titles, `font-medium` for buttons).

### Layout Structure
- **App Layout:** Fixed left sidebar (collapsible on mobile), fixed top navbar (with search, notifications, profile), and scrollable main content area.
- **Card Design:** `rounded-xl border border-slate-200 bg-white shadow-sm p-6`.

---

## 2. Key Components & Code Snippets

### A. Landing Page & Authentication (Stripe-inspired)
A clean split-screen or centered card design with subtle background blurs.

```tsx
// components/LandingHero.tsx
export default function LandingHero() {
  return (
    <div className="relative isolate overflow-hidden bg-white">
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
            Connect, schedule, and grow with industry experts. Our AI dynamically matches you with mentors tailored to your goals and learning style.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <a href="/sign-up" className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all">
              Get Started
            </a>
            <a href="/sign-in" className="text-sm font-semibold leading-6 text-slate-900 hover:text-indigo-600 transition-colors">
              Sign In <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        {/* Right side illustration/dashboard preview */}
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="rounded-xl bg-white/5 p-2 ring-1 ring-white/10 lg:-m-4 lg:rounded-2xl lg:p-4 shadow-2xl">
               <div className="h-[400px] w-[600px] bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 font-medium">
                  App Preview Graphic
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### B. App Shell & Layout
Modern SaaS dashboard with Sidebar navigation.

```tsx
// components/DashboardLayout.tsx
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import PortalTopNavbar from "./PortalTopNavbar";

export default function DashboardLayout({ children, user }: { children: ReactNode, user: any }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col pl-64"> {/* pl-64 for fixed sidebar */}
        <PortalTopNavbar userName={user.name} userEmail={user.email} />
        <main className="flex-1 p-8 mt-16 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### C. Mentor Search & AI Match Card
Using violet accents to highlight the AI matching score.

```tsx
// components/MentorMatchCard.tsx
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function MentorMatchCard({ mentor, matchScore }: { mentor: any, matchScore: number }) {
  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <img src={mentor.avatar} alt={mentor.name} className="h-14 w-14 rounded-full object-cover border border-slate-100" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{mentor.name}</h3>
            <p className="text-sm text-slate-500">{mentor.role} at {mentor.company}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-600/20">
            <SparklesIcon className="h-3 w-3 text-violet-500" />
            {matchScore}% Match
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {mentor.expertise.map((skill: string) => (
          <span key={skill} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">Next available: <span className="font-medium text-slate-900">Tomorrow, 10 AM</span></p>
        <button className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">
          View Profile
        </button>
      </div>
    </div>
  );
}
```

### D. Session Booking (Calendar Integration)
A clean, grid-based time selector.

```tsx
// components/TimeSlotSelector.tsx
export default function TimeSlotSelector({ date, slots }: { date: string, slots: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900 mb-4">Available on {date}</h3>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {slots.map((slot) => (
          <button
            key={slot}
            className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
          >
            {slot}
          </button>
        ))}
      </div>
      <button className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all">
        Confirm Booking
      </button>
    </div>
  );
}
```

### E. AI-Assisted Messaging Chat
A chat interface with an embedded AI assistant toggle for smart replies and summarizing.

```tsx
// components/AIChatInterface.tsx
import { PaperAirplaneIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function AIChatInterface() {
  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src="/mentor-avatar.jpg" className="h-10 w-10 rounded-full" alt="Mentor" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Dr. Jane Smith</h3>
            <p className="text-xs text-slate-500">Online</p>
          </div>
        </div>
        <button className="text-xs font-medium text-violet-600 hover:bg-violet-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
          <SparklesIcon className="h-4 w-4" />
          AI Summarize
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        <div className="flex gap-3">
          <img src="/mentor-avatar.jpg" className="h-8 w-8 rounded-full" alt="" />
          <div className="rounded-2xl rounded-tl-none bg-slate-100 px-4 py-2 text-sm text-slate-800">
            Hi! Looking forward to our session tomorrow. Please share your current resume.
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <div className="rounded-2xl rounded-tr-none bg-indigo-600 px-4 py-2 text-sm text-white shadow-sm">
            Hello Dr. Smith! I'll upload it right now.
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
          <button className="p-2 text-slate-400 hover:text-violet-600 transition-colors" title="AI Smart Reply">
            <SparklesIcon className="h-5 w-5" />
          </button>
          <input
            type="text"
            className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-slate-400"
            placeholder="Type your message..."
          />
          <button className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-500 shadow-sm transition-colors">
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### F. Progress Tracking Dashboard (Bento Box)
```tsx
// components/ProgressDashboard.tsx
export default function ProgressDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main Progress Card */}
      <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Mentorship Goals</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-slate-700">Resume Review</span>
              <span className="text-slate-500">100%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-emerald-500 w-full"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-slate-700">Mock Interviews</span>
              <span className="text-slate-500">50%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-indigo-600 w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Stats Card */}
      <div className="rounded-xl border border-slate-200 bg-indigo-600 p-6 shadow-sm text-white">
        <h2 className="text-sm font-medium text-indigo-100 mb-1">Hours Mentored</h2>
        <p className="text-4xl font-bold mb-4">12.5</p>
        <p className="text-sm text-indigo-200">Next session in 2 days</p>
      </div>
    </div>
  );
}
```

## Summary
By using `TailwindCSS` with a unified color palette (`slate`, `indigo`, `violet`, `emerald`), robust typography (Inter), and modern components (cards with borders/soft shadows, bento grids), the portal will feel like an enterprise-grade SaaS application. The integration of `SparklesIcon` visually distinguishes AI capabilities seamlessly within the user workflows.
