"use client";

// Handles a crash in the root layout itself (rare — normal page errors are
// caught by error.tsx instead). Must define its own <html>/<body>, since it
// replaces the root layout when active. Uses inline styles rather than
// Tailwind classes, since globals.css may not have loaded if the crash
// happened before or during layout render.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1rem",
          textAlign: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "0.75rem",
            backgroundColor: "#dc2626",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "1.125rem",
          }}
        >
          PO
        </div>
        <h1 style={{ marginTop: "1.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
          The application failed to load
        </h1>
        <p style={{ marginTop: "0.5rem", maxWidth: "24rem", fontSize: "0.875rem", color: "#475569" }}>
          Something went wrong loading the Project Oversight Portal. Please
          try again.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            marginTop: "1.5rem",
            borderRadius: "0.375rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "white",
            backgroundColor: "#4f46e5",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
