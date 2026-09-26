"use client";

import { useState } from "react";

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="btn-outline text-sm"
    >
      {isLoggingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
