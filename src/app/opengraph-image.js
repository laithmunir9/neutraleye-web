import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "See How an Article Frames the Story with NeutralEye";
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
          background: "linear-gradient(145deg, #FFFFFF 0%, #E5F0F0 100%)",
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
              color: "#0D0F10",
              letterSpacing: "-0.01em",
              fontStyle: "italic",
            }}
          >
            NeutralEye
          </span>
          <span
            style={{
              fontSize: 22,
              color: "#0E5A5E",
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
