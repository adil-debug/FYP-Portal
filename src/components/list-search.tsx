"use client";

import { useState } from "react";

/**
 * Client-side search/filter box for a list page. Wraps its children in a
 * render-prop pattern isn't necessary here — instead each list page keeps
 * its own filtering logic and just renders this input, wiring `onChange`
 * up to local state. Kept intentionally dumb (just an input) so it can sit
 * in front of any table without coupling to that table's row shape.
 */
export function ListSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input w-full text-sm"
        aria-label={placeholder}
      />
    </div>
  );
}

/**
 * Tiny hook wrapper so list pages don't each redeclare the same
 * useState(""). Not strictly necessary, but keeps every list page's
 * filter state declaration identical.
 */
export function useListSearch() {
  return useState("");
}
