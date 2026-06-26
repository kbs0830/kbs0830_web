import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#2d5a8e",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "5px",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 13,
            fontWeight: 300,
            letterSpacing: "0.06em",
            fontFamily: "Georgia, serif",
          }}
        >
          PL
        </span>
      </div>
    ),
    { ...size }
  );
}
