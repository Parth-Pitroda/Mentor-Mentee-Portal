"use client";

import { useId, useState } from "react";

export default function StyledFileInput({
  name,
  accept,
  required = false,
  label = "Choose file",
}: {
  name: string;
  accept?: string;
  required?: boolean;
  label?: string;
}) {
  const inputId = useId();
  const [fileName, setFileName] = useState("");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-1.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          {label}
        </label>
        <div className="min-w-0 flex-1 px-2 py-1 text-sm text-slate-500">
          <span className="block truncate">{fileName || "No file selected"}</span>
        </div>
      </div>
      <input
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
      />
    </div>
  );
}
