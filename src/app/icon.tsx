import { ImageResponse } from "next/og";

export const contentType = "image/png";

const variants = [
  { id: "32", width: 32, height: 32 },
  { id: "192", width: 192, height: 192 },
  { id: "512", width: 512, height: 512 },
];

export function generateImageMetadata() {
  return variants.map(({ id, width, height }) => ({
    id,
    size: { width, height },
    contentType,
  }));
}

export default function Icon({ id }: { id: string }) {
  const { width, height } = variants.find((v) => v.id === id) ?? variants[0];
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
          borderRadius: width * 0.15,
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: width * 0.4,
            fontWeight: 300,
            letterSpacing: "0.06em",
            fontFamily: "Georgia, serif",
          }}
        >
          PL
        </span>
      </div>
    ),
    { width, height }
  );
}
