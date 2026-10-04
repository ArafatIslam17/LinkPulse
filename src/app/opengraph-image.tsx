import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#f3f5f9",
          color: "#131a2e",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#2346e8" }} />
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 30, color: "#8a92a8" }}>example.com/a/very/long/path/to/something?ref=newsletter</div>
          <div style={{ fontSize: 76, color: "#2346e8", fontWeight: 600, letterSpacing: -2 }}>hop.ln/launch</div>
        </div>
        <div style={{ fontSize: 34, color: "#5d6680" }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
