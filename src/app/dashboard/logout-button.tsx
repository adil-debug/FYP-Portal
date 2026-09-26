"use client";

import { useState } from "react";

export function LogoutButton({
  className = "btn-outline text-sm",
}: {
  // Both the coordinator sidebar and the faculty dashboard header render
  // this on a dark background now, where the default light btn-outline
  // (white fill, slate border) looks out of place — callers on a dark
  // surface pass a dark-appropriate className instead.
  className?: string;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button onClick={handleLogout} disabled={isLoggingOut} className={className}>
      {isLoggingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
