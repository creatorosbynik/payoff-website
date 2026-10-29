// The shape of one day's video. Lives in days/<date-slug>/story.json under "video".
export type Beat = {
  /** Small mono label, e.g. "01 · THE PROBLEM" */
  kicker: string;
  /** Spoken-style caption, 6–16 words. Wrap one word in *asterisks* to highlight it. */
  text: string;
  /** Image path relative to render/public, e.g. "days/2026-10-30-x/beat-1.webp" */
  image?: string;
  /** Optional photo credit / AI label shown small, e.g. "AI image" */
  label?: string;
};

export type StoryVideo = {
  slate: number;
  pillar: string; // e.g. "AD LAB"
  date: string; // ISO date
  hook: string; // headline on the opening card, 3–9 words, *highlight* allowed
  beats: Beat[]; // 3 or 4
  move: string; // "The move" line, one sentence
  cta: string; // e.g. "Full breakdown → payoffcreative.com/blog"
  closing?: string; // defaults to "That's the payoff."
  music?: string; // path relative to public/
  voiceover?: string; // path relative to public/
};

export const FPS = 30;
export const HOOK_F = 96;
export const BEAT_F = 165;
export const MOVE_F = 150;
export const END_F = 120;

export const totalFrames = (v: StoryVideo) =>
  HOOK_F + v.beats.length * BEAT_F + MOVE_F + END_F;
