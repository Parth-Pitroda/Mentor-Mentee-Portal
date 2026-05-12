"use client";

export default function ExportCSVButton({ data }: { data: any[] }) {
  const downloadCSV = () => {
    if (data.length === 0) return alert("No verified students to export.");

    // 1. Get the headers (keys from the first object)
    const headers = Object.keys(data[0]);
    
    // 2. Map the data to CSV format
    const csvRows = [
      headers.join(","), // Header row
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(",")) // Data rows
    ];
    
    const csvString = csvRows.join("\n");
    
    // 3. Trigger the browser download
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Verified_Students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={downloadCSV}
      className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-sm transition-all flex items-center gap-2"
    >
      📥 Download Verified Roster (CSV)
    </button>
  );
}