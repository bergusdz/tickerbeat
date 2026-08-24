import { ImageResponse } from "next/og";

export const alt = "TickerBeat — Make sound. Make market.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: "#070605",
          color: "#f3eee4",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              background: "#d8ff3c",
              color: "#070605",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            TB
          </div>
          <span style={{ fontSize: 22, letterSpacing: 4, color: "#9a9386" }}>BROWSER GROOVEBOX</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <strong style={{ fontSize: 92, lineHeight: 0.9, letterSpacing: -6 }}>TickerBeat</strong>
          <span style={{ fontSize: 36, color: "#d8ff3c" }}>Make sound. Make market.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#9a9386" }}>
          <span>MAKE → MIX → FINISH → BOARD</span>
          <span>16 STEPS · 4 TRACKS</span>
        </div>
      </div>
    ),
    size,
  );
}
