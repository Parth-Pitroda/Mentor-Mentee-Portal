"use client";

import { usePathname, useRouter, useSearchParams } from "@/lib/router-compat";
import { Search } from "lucide-react";
import { useTransition } from "react";

export default function HeaderSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const currentValue = searchParams.get("q") || "";
  const isMeetingsTab = searchParams.get("tab") === "meetings";

  return (
    <div className="relative max-w-xs w-full flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm shadow-sm animate-in fade-in duration-300">
      <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
      <input
        type="search"
        defaultValue={currentValue}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={isMeetingsTab ? "Search meetings..." : "Search mentees..."}
        className="bg-transparent border-none outline-none w-full text-xs font-semibold placeholder:text-slate-400 text-slate-700"
      />
    </div>
  );
}
