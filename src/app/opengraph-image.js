import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NeutralEye — See How an Article Frames the Story";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #f8f4ee 0%, #efe8dd 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://tryneutraleye.com/neutraleye-logo-128.png"
          width={120}
          height={120}
          alt=""
          style={{ borderRadius: "50%" }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 32,
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 400,
              color: "#1a1816",
              letterSpacing: "-0.01em",
              fontStyle: "italic",
            }}
          >
            NeutralEye
          </span>
          <span
            style={{
              fontSize: 22,
              color: "#8b6741",
              fontWeight: 400,
              maxWidth: 600,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            See how an article frames the story
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
