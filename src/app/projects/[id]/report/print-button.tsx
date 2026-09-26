"use client";

// Triggers the browser's native print dialog — the user chooses "Save as
// PDF" there if they want a file. No PDF library involved, per the chosen
// scope ("Print-friendly HTML page").
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-solid-primary text-sm"
    >
      Print / Save as PDF
    </button>
  );
}
