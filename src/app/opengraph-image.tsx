import { ImageResponse } from "next/og";

export const alt = "TickerBeat — Sound is the new ticker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "64px",
      background: "#090a08",
      color: "#f0eee5",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24 }}>
        <strong style={{ color: "#d9ff43" }}>TICKERBEAT / TB–01</strong>
        <span>BUILT ON BASE</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ color: "#d9ff43", fontSize: 22, letterSpacing: 4 }}>BROWSER GROOVEBOX</span>
        <strong style={{ fontSize: 108, lineHeight: 0.9, letterSpacing: -8 }}>SOUND IS THE<br />NEW TICKER.</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}>
        <span>MAKE A BEAT → PUBLISH → LAUNCH</span>
        <span style={{ color: "#ff5a36" }}>CLANKER V4 / BASE</span>
      </div>
    </div>,
    size,
  );
}
