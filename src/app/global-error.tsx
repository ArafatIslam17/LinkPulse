"use client";

// Last-resort boundary for errors in the root layout itself. Keeps styling inline
// because the app's stylesheet may not have loaded.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "64px 24px", maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ color: "#5d6680", lineHeight: 1.6 }}>The app hit an unexpected error. Reload to try again.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 24,
            minHeight: 44,
            padding: "0 18px",
            borderRadius: 10,
            border: 0,
            background: "#2346e8",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
