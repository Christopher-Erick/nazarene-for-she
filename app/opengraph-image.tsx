import { ImageResponse } from "next/og";
import { site } from "@/lib/data/site";

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
          background: "#1b0b1c",
          color: "#f7f1e8",
          padding: "72px",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: "0.28em", textTransform: "uppercase", color: "#e4c48a" }}>
          Kenya · Dignity · Skill · Future
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 72, lineHeight: 0.95, fontWeight: 600 }}>{site.name}</div>
          <div style={{ fontSize: 32, fontStyle: "italic", color: "#c47a2c" }}>{site.tagline}</div>
        </div>
        <div style={{ fontSize: 24, maxWidth: 860, color: "rgba(247,241,232,0.75)" }}>
          A pad can meet an immediate need. Empowerment can change tomorrow.
        </div>
      </div>
    ),
    size,
  );
}
