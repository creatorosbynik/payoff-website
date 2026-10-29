// Designed blog graphics in the Payoff palette. Rendered as stills (no AI credits needed).
// Cover: 1600x680 (2.35:1, matches the journal-style letterboxed covers). Card: 1600x900.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import "@fontsource/anton/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/800.css";
import "@fontsource/jetbrains-mono/500.css";

const RED = "#D52204";
const CREAM = "#FFD9A1";
const INK = "#241A15";
const DISPLAY = "Anton, Impact, sans-serif";
const BODY = "'DM Sans', Arial, sans-serif";
const MONO = "'JetBrains Mono', monospace";

export type CardSpec =
  | { type: "cover"; pillar: string; slate: number; title: string; kicker?: string; tone?: "red" | "ink" | "cream" }
  | { type: "stat"; big: string; label: string; source?: string; tone?: "red" | "ink" | "cream" }
  | { type: "list"; title: string; items: string[]; tone?: "red" | "ink" | "cream" }
  | { type: "versus"; left: { title: string; points: string[] }; right: { title: string; points: string[] }; tone?: "red" | "ink" | "cream" }
  | { type: "quote"; text: string; by?: string; tone?: "red" | "ink" | "cream" };

const palette = (tone: string | undefined) =>
  tone === "ink"
    ? { bg: INK, fg: CREAM, accent: RED, soft: "rgba(255,217,161,0.7)" }
    : tone === "cream"
    ? { bg: CREAM, fg: INK, accent: RED, soft: "rgba(36,26,21,0.7)" }
    : { bg: RED, fg: CREAM, accent: INK, soft: "rgba(255,217,161,0.8)" };

const Grain: React.FC = () => (
  <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.25, pointerEvents: "none" }}>
    <svg width="100%" height="100%">
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#n)" />
    </svg>
  </AbsoluteFill>
);

const Mono: React.FC<{ c: string; children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ c, children, size = 26, style }) => (
  <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: "0.12em", textTransform: "uppercase", color: c, ...style }}>{children}</div>
);

// Official logo versions only: cream-on-red / white-on-red / white on transparent.
// On cream or ink cards the logo sits in a red tab, so it is always cream-on-red.
const Footer: React.FC<{ c: string; onRed: boolean }> = ({ c, onRed }) => (
  <div style={{ position: "absolute", left: 80, right: 80, bottom: 56, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div style={{ background: onRed ? "transparent" : RED, padding: onRed ? 0 : "12px 16px" }}>
      <Img src={staticFile("brand/logo-cream.png")} style={{ height: 34, display: "block" }} />
    </div>
    <Mono c={c} size={20}>payoffcreative.com/blog</Mono>
  </div>
);

export const Card: React.FC<{ spec: CardSpec }> = ({ spec }) => {
  const p = palette(spec.tone);
  const onRed = !spec.tone || spec.tone === "red";
  if (spec.type === "cover") {
    const words = spec.title.length;
    const size = words > 52 ? 84 : words > 36 ? 100 : 120;
    return (
      <AbsoluteFill style={{ background: p.bg }}>
        <div style={{ position: "absolute", left: 80, top: 64, right: 80, display: "flex", justifyContent: "space-between" }}>
          <Mono c={p.fg}>Slate {String(spec.slate).padStart(3, "0")}</Mono>
          <Mono c={p.soft}>{spec.pillar}</Mono>
        </div>
        <div style={{ position: "absolute", left: 80, right: 80, top: 150, fontFamily: DISPLAY, fontSize: size, lineHeight: 1.0, color: p.fg, textTransform: "uppercase" }}>
          {spec.title}
        </div>
        {spec.kicker ? <Mono c={p.soft} size={24} style={{ position: "absolute", left: 80, bottom: 120 }}>{spec.kicker}</Mono> : null}
        <Footer c={p.soft} onRed={onRed} />
        <Grain />
      </AbsoluteFill>
    );
  }
  if (spec.type === "stat") {
    return (
      <AbsoluteFill style={{ background: p.bg }}>
        <div style={{ position: "absolute", left: 80, right: 80, top: 150, fontFamily: DISPLAY, fontSize: 260, lineHeight: 0.95, color: p.fg }}>{spec.big}</div>
        <div style={{ position: "absolute", left: 80, right: 200, top: 470, fontFamily: BODY, fontWeight: 800, fontSize: 58, lineHeight: 1.15, color: p.fg }}>{spec.label}</div>
        {spec.source ? <Mono c={p.soft} size={20} style={{ position: "absolute", left: 80, bottom: 120 }}>Source: {spec.source}</Mono> : null}
        <Footer c={p.soft} onRed={onRed} />
        <Grain />
      </AbsoluteFill>
    );
  }
  if (spec.type === "list") {
    return (
      <AbsoluteFill style={{ background: p.bg }}>
        <div style={{ position: "absolute", left: 80, right: 80, top: 70, fontFamily: DISPLAY, fontSize: 84, lineHeight: 1, color: p.fg, textTransform: "uppercase" }}>{spec.title}</div>
        <div style={{ position: "absolute", left: 80, right: 80, top: 210 }}>
          {spec.items.slice(0, 5).map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 30, alignItems: "baseline", borderTop: `3px solid ${p.soft}`, padding: "20px 0" }}>
              <Mono c={p.accent === INK ? p.fg : p.accent} size={30}>{String(i + 1).padStart(2, "0")}</Mono>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, lineHeight: 1.15, color: p.fg }}>{it}</div>
            </div>
          ))}
        </div>
        <Footer c={p.soft} onRed={onRed} />
        <Grain />
      </AbsoluteFill>
    );
  }
  if (spec.type === "versus") {
    const Col: React.FC<{ side: { title: string; points: string[] }; dark: boolean }> = ({ side, dark }) => (
      <div style={{ flex: 1, background: dark ? INK : CREAM, padding: "70px 60px" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 80, color: dark ? CREAM : INK, textTransform: "uppercase", lineHeight: 1 }}>{side.title}</div>
        {side.points.slice(0, 4).map((pt, i) => (
          <div key={i} style={{ fontFamily: BODY, fontWeight: 800, fontSize: 38, lineHeight: 1.2, color: dark ? CREAM : INK, marginTop: 30, borderTop: `3px solid ${dark ? "rgba(255,217,161,0.3)" : "rgba(36,26,21,0.25)"}`, paddingTop: 22 }}>{pt}</div>
        ))}
      </div>
    );
    return (
      <AbsoluteFill style={{ display: "flex", flexDirection: "row" }}>
        <Col side={spec.left} dark={false} />
        <Col side={spec.right} dark />
        <div style={{ position: "absolute", left: 60, bottom: 50, background: RED, padding: "12px 16px" }}>
          <Img src={staticFile("brand/logo-cream.png")} style={{ height: 34, display: "block" }} />
        </div>
        <div style={{ position: "absolute", left: 760, top: 400, width: 80, height: 80, borderRadius: 40, background: RED, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 40, color: CREAM }}>VS</div>
        <Grain />
      </AbsoluteFill>
    );
  }
  // quote
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <div style={{ position: "absolute", left: 80, top: 30, fontFamily: DISPLAY, fontSize: 300, color: p.accent === INK ? p.soft : p.accent, lineHeight: 1 }}>“</div>
      <div style={{ position: "absolute", left: 80, right: 120, top: 250, fontFamily: DISPLAY, fontSize: 92, lineHeight: 1.04, color: p.fg, textTransform: "uppercase" }}>{spec.text}</div>
      {spec.by ? <Mono c={p.soft} style={{ position: "absolute", left: 80, bottom: 130 }}>{spec.by}</Mono> : null}
      <Footer c={p.soft} onRed={onRed} />
      <Grain />
    </AbsoluteFill>
  );
};
