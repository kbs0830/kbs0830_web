import { ImageResponse } from "next/og";

export const alt = "PINGWEI LI — Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#fafaf8",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 100px",
          position: "relative",
        }}
      >
        {/* top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#2d5a8e",
          }}
        />

        {/* location label */}
        <p
          style={{
            color: "#6b6b6b",
            fontSize: 15,
            letterSpacing: "0.3em",
            marginBottom: 32,
            fontFamily: "monospace",
            margin: "0 0 32px",
          }}
        >
          Kaohsiung · Fukuoka
        </p>

        {/* name */}
        <h1
          style={{
            color: "#1a1a1a",
            fontSize: 80,
            fontWeight: 300,
            letterSpacing: "0.04em",
            margin: "0 0 20px",
            lineHeight: 1,
          }}
        >
          PINGWEI LI
        </h1>

        {/* tagline */}
        <p
          style={{
            color: "#2d5a8e",
            fontSize: 22,
            letterSpacing: "0.22em",
            fontFamily: "monospace",
            margin: "0 0 48px",
          }}
        >
          AI Engineer · Web Developer
        </p>

        {/* divider */}
        <div
          style={{
            width: 48,
            height: 1,
            background: "#e0ddd8",
            margin: "0 0 28px",
          }}
        />

        {/* stack */}
        <p
          style={{
            color: "#9b9b9b",
            fontSize: 14,
            letterSpacing: "0.2em",
            fontFamily: "monospace",
            margin: 0,
          }}
        >
          Next.js · Python · YOLOv8 · Gemini · Three.js
        </p>

        {/* bottom-right handle */}
        <p
          style={{
            position: "absolute",
            bottom: 72,
            right: 100,
            color: "#b0b0a8",
            fontSize: 13,
            letterSpacing: "0.15em",
            fontFamily: "monospace",
            margin: 0,
          }}
        >
          github.com/kbs0830
        </p>
      </div>
    ),
    { ...size }
  );
}
