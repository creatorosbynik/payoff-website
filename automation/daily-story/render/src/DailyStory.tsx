import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import "@fontsource/anton/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/800.css";
import "@fontsource/jetbrains-mono/500.css";
import {
  BEAT_F,
  END_F,
  HOOK_F,
  MOVE_F,
  StoryVideo,
  totalFrames,
} from "./types";

// Brand Book v1 — these four only.
const RED = "#D52204";
const CREAM = "#FFD9A1";
const INK = "#241A15";
const BLACK = "#0B0806";
const DISPLAY = "Anton, Impact, sans-serif";
const BODY = "'DM Sans', Arial, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------- small parts ---------- */

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 8;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.22 }}>
      <svg width="100%" height="100%">
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Progress: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [0, total - 1], [0, 100], clamp);
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: "rgba(36,26,21,0.35)" }}>
      <div style={{ width: `${w}%`, height: "100%", background: CREAM }} />
    </div>
  );
};

/** Splits "a *word* here" into words; *word* gets the highlight. Words land one by one with a focus-pull. */
const Words: React.FC<{
  text: string;
  start?: number;
  stagger?: number;
  style: React.CSSProperties;
  highlight: React.CSSProperties;
}> = ({ text, start = 0, stagger = 3, style, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", ...style }}>
      {words.map((raw, i) => {
        const hl = /^\*.*\*[.,!?:;]?$/.test(raw);
        const w = raw.replace(/\*/g, "");
        const f = frame - start - i * stagger;
        const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 180, mass: 0.6 } });
        const blur = interpolate(f, [0, 8], [14, 0], clamp);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.24em",
              opacity: interpolate(f, [0, 4], [0, 1], clamp),
              transform: `translateY(${(1 - s) * 40}px)`,
              filter: `blur(${blur}px)`,
              ...(hl ? highlight : {}),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

const Mono: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({
  children,
  color = CREAM,
  style,
}) => (
  <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 30, letterSpacing: "0.12em", color, textTransform: "uppercase", ...style }}>
    {children}
  </div>
);

const SceneIn: React.FC<{ children: React.ReactNode; dur: number }> = ({ children, dur }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 5, dur - 4, dur], [0, 1, 1, 0.0], clamp);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/* ---------- scenes ---------- */

const pad = (n: number) => String(n).padStart(3, "0");
const prettyDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const HookScene: React.FC<{ v: StoryVideo }> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // clapper: arm starts open (-24deg) and snaps shut at frame 10
  const arm = interpolate(frame, [0, 9, 10], [-24, -6, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const flash = interpolate(frame, [10, 11, 16], [0, 0.85, 0], clamp);
  const boardIn = spring({ frame, fps, config: { damping: 18 } });
  const stripes = Array.from({ length: 7 });
  const Stripe: React.FC<{ dark?: boolean }> = ({ dark }) => (
    <div style={{ display: "flex", height: 70, border: `6px solid ${CREAM}`, background: dark ? INK : INK }}>
      {stripes.map((_, i) => (
        <div key={i} style={{ flex: 1, background: i % 2 ? CREAM : "transparent", transform: "skewX(-28deg)", margin: "0 -4px" }} />
      ))}
    </div>
  );
  return (
    <SceneIn dur={HOOK_F}>
      <AbsoluteFill style={{ background: RED }}>
        {/* clapperboard */}
        <div style={{ position: "absolute", left: 90, right: 90, top: 250, transform: `translateY(${(1 - boardIn) * -80}px)` }}>
          <div style={{ transformOrigin: "0% 100%", transform: `rotate(${arm}deg)` }}>
            <Stripe />
          </div>
          <div style={{ marginTop: 8, border: `6px solid ${CREAM}`, background: INK, padding: "26px 34px", display: "flex", justifyContent: "space-between" }}>
            <Mono>Slate {pad(v.slate)}</Mono>
            <Mono color={CREAM} style={{ opacity: 0.75 }}>{v.pillar}</Mono>
          </div>
        </div>
        <div style={{ position: "absolute", left: 90, right: 90, top: 640 }}>
          <Words
            text={v.hook}
            start={14}
            stagger={4}
            style={{ fontFamily: DISPLAY, fontSize: 132, lineHeight: 1.02, color: CREAM, textTransform: "uppercase" }}
            highlight={{ color: INK, background: CREAM, padding: "0 14px", marginRight: "0.24em" }}
          />
        </div>
        <Mono style={{ position: "absolute", left: 90, bottom: 330, opacity: 0.8 }}>{prettyDate(v.date)} · payoffcreative.com</Mono>
        <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      </AbsoluteFill>
    </SceneIn>
  );
};

/** No-image beat: the highlighted word, oversized and outlined, drifting behind the caption. */
const TypeFrame: React.FC<{ word: string; i: number }> = ({ word, i }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, BEAT_F], [i % 2 ? 60 : -60, i % 2 ? -140 : 140], clamp);
  const holes = Array.from({ length: 14 });
  const Sprockets: React.FC<{ side: "left" | "right" }> = ({ side }) => (
    <div style={{ position: "absolute", top: 0, bottom: 0, [side]: 22, display: "flex", flexDirection: "column", justifyContent: "space-around" } as React.CSSProperties}>
      {holes.map((_, k) => <div key={k} style={{ width: 26, height: 40, borderRadius: 6, background: "rgba(255,217,161,0.12)" }} />)}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: i % 2 ? INK : BLACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 330, left: 0, whiteSpace: "nowrap", transform: `translateX(${x}px)`, fontFamily: DISPLAY, fontSize: 520, lineHeight: 1, textTransform: "uppercase", color: "transparent", WebkitTextStroke: `4px ${CREAM}`, opacity: 0.55 }}>
        {word.replace(/[.,!?:;]$/, "")}
      </div>
      <div style={{ position: "absolute", top: 860, left: 80, width: 180, height: 12, background: RED }} />
      <Sprockets side="left" />
      <Sprockets side="right" />
    </AbsoluteFill>
  );
};

const BeatScene: React.FC<{ v: StoryVideo; i: number }> = ({ v, i }) => {
  const frame = useCurrentFrame();
  const b = v.beats[i];
  const scale = interpolate(frame, [0, BEAT_F], [1.06, 1.18], clamp);
  const drift = interpolate(frame, [0, BEAT_F], [0, i % 2 ? -30 : 30], clamp);
  const pull = interpolate(frame, [0, 14], [18, 0], clamp);
  return (
    <SceneIn dur={BEAT_F}>
      <AbsoluteFill style={{ background: BLACK }}>
        {b.image ? (
          <Img
            src={staticFile(b.image)}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale}) translateX(${drift}px)`, filter: `blur(${pull}px)` }}
          />
        ) : (
          <TypeFrame word={(b.text.match(/\*([^*]+)\*/) || [, String(i + 1)])[1]} i={i} />
        )}
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,8,6,0.55) 0%, rgba(11,8,6,0) 26%, rgba(11,8,6,0) 42%, rgba(11,8,6,0.92) 78%, rgba(11,8,6,0.96) 100%)" }} />
        <div style={{ position: "absolute", top: 230, left: 80, display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ background: RED, padding: "10px 18px" }}>
            <Mono>{b.kicker}</Mono>
          </div>
          {b.label ? <Mono style={{ fontSize: 22, opacity: 0.7 }}>{b.label}</Mono> : null}
        </div>
        <div style={{ position: "absolute", left: 80, right: 80, top: 1080 }}>
          <Words
            text={b.text}
            start={8}
            stagger={3}
            style={{ fontFamily: BODY, fontWeight: 800, fontSize: 78, lineHeight: 1.12, color: "#fff", letterSpacing: "-0.01em" }}
            highlight={{ color: CREAM, background: RED, padding: "0 12px", marginRight: "0.24em" }}
          />
        </div>
      </AbsoluteFill>
    </SceneIn>
  );
};

const MoveScene: React.FC<{ v: StoryVideo }> = ({ v }) => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [6, 30], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <SceneIn dur={MOVE_F}>
      <AbsoluteFill style={{ background: CREAM }}>
        <div style={{ position: "absolute", top: 300, left: 90, right: 90 }}>
          <Mono color={RED} style={{ fontSize: 36 }}>The move</Mono>
          <div style={{ height: 8, width: `${line}%`, background: RED, marginTop: 18 }} />
        </div>
        <div style={{ position: "absolute", top: 520, left: 90, right: 90 }}>
          <Words
            text={v.move}
            start={12}
            stagger={4}
            style={{ fontFamily: DISPLAY, fontSize: 112, lineHeight: 1.04, color: INK, textTransform: "uppercase" }}
            highlight={{ color: RED, marginRight: "0.24em" }}
          />
        </div>
      </AbsoluteFill>
    </SceneIn>
  );
};

const EndScene: React.FC<{ v: StoryVideo }> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4, fps, config: { damping: 14 } });
  return (
    <SceneIn dur={END_F + 4}>
      <AbsoluteFill style={{ background: RED, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 560, width: 880, transform: `scale(${0.85 + s * 0.15})`, opacity: s }}>
          <Img src={staticFile("brand/logo-cream.png")} style={{ width: "100%" }} />
        </div>
        <div style={{ position: "absolute", top: 860, left: 90, right: 90, textAlign: "center" }}>
          <Words
            text={v.closing || "That's the payoff."}
            start={18}
            stagger={4}
            style={{ justifyContent: "center", fontFamily: DISPLAY, fontSize: 96, color: CREAM, textTransform: "uppercase" }}
            highlight={{}}
          />
        </div>
        <Mono style={{ position: "absolute", top: 1130, left: 90, right: 90, textAlign: "center", opacity: interpolate(frame, [34, 44], [0, 1], clamp), fontSize: 32, lineHeight: 1.5 }}>
          {v.cta}
        </Mono>
        <Mono style={{ position: "absolute", top: 1260, left: 90, right: 90, textAlign: "center", opacity: interpolate(frame, [40, 50], [0, 0.8], clamp) }}>
          @payoffcreative
        </Mono>
      </AbsoluteFill>
    </SceneIn>
  );
};

/* ---------- the film ---------- */

export const DailyStory: React.FC<StoryVideo> = (v) => {
  const total = totalFrames(v);
  const moveAt = HOOK_F + v.beats.length * BEAT_F;
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <Sequence durationInFrames={HOOK_F}>
        <HookScene v={v} />
      </Sequence>
      {v.beats.map((_, i) => (
        <Sequence key={i} from={HOOK_F + i * BEAT_F} durationInFrames={BEAT_F}>
          <BeatScene v={v} i={i} />
        </Sequence>
      ))}
      <Sequence from={moveAt} durationInFrames={MOVE_F}>
        <MoveScene v={v} />
      </Sequence>
      <Sequence from={moveAt + MOVE_F}>
        <EndScene v={v} />
      </Sequence>
      <Grain />
      <Progress total={total} />
      {v.music ? (
        <Audio
          src={staticFile(v.music)}
          volume={(f) => interpolate(f, [0, 10, total - 40, total], [0, v.voiceover ? 0.18 : 0.6, v.voiceover ? 0.18 : 0.6, 0], clamp)}
        />
      ) : null}
      {v.voiceover ? <Audio src={staticFile(v.voiceover)} /> : null}
    </AbsoluteFill>
  );
};
