"use client";

import { useState } from "react";
import { bulkImportStudents } from "@/lib/actions/student.actions";

export default function BulkImportManager() {
  const [parsedData, setParsedData] = useState<Array<{ fullName: string, email: string, department: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ successCount?: number, errors?: string[] } | null>(null);

  // Native Browser CSV Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      
      // Split by newline and remove empty rows
      const rows = text.split("\n").filter(row => row.trim() !== "");
      
      // Skip the header row (index 0) and map the rest
      const students = rows.slice(1).map(row => {
        const columns = row.split(",");
        return {
          fullName: columns[0] || "",
          email: columns[1] || "",
          department: columns[2] || ""
        };
      }).filter(s => s.email.includes("@")); // Basic validation

      setParsedData(students);
      setResults(null);
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (parsedData.length === 0) return;
    setIsLoading(true);
    setResults(null);

    const res = await bulkImportStudents(parsedData);
    
    if (res.success) {
      setResults({ successCount: res.successCount, errors: res.errors });
      setParsedData([]); // Clear the table on success
    } else {
      setResults({ errors: [res.error || "A critical error occurred."] });
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Bulk Student Import</h3>
          <p className="text-sm text-slate-500 mt-1">Upload a CSV file with columns: <b>FullName, Email, Department</b></p>
        </div>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload}
          className="block w-full text-sm text-slate-500 max-w-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Results Panel */}
      {results && (
        <div className={`p-4 rounded-lg mb-6 ${results.errors?.length === 0 ? "bg-green-50" : "bg-yellow-50"}`}>
          <p className="font-bold text-slate-800">Import Complete: {results.successCount} students added.</p>
          {results.errors && results.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-600 max-h-32 overflow-y-auto space-y-1">
              {results.errors.map((err, i) => <p key={i}>• {err}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <div>
          <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto mb-4 border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Preview ({parsedData.length} records detected)</p>
            {parsedData.slice(0, 5).map((s, i) => (
              <div key={i} className="text-sm text-slate-700 py-1 border-b border-slate-100 last:border-0 flex gap-4">
                <span className="w-1/3 truncate font-medium">{s.fullName}</span>
                <span className="w-1/3 truncate text-slate-500">{s.email}</span>
                <span className="w-1/3 truncate">{s.department}</span>
              </div>
            ))}
            {parsedData.length > 5 && <p className="text-xs text-slate-400 mt-2 italic">+ {parsedData.length - 5} more rows hidden for preview...</p>}
          </div>

          <button 
            onClick={executeImport} 
            disabled={isLoading}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Processing Database Upload..." : `Confirm & Import ${parsedData.length} Students`}
          </button>
        </div>
      )}
    </div>
  );
}