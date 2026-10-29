import React from "react";
import { Composition } from "remotion";
import { DailyStory } from "./DailyStory";
import { Card, CardSpec } from "./Cards";
import { FPS, StoryVideo, totalFrames } from "./types";

const sample: StoryVideo = {
  slate: 1,
  pillar: "Ad Lab",
  date: "2026-10-30",
  hook: "Your ads aren't *tired.* Your story is.",
  beats: [
    { kicker: "01 · The symptom", text: "Same product. Same offer. New creator every week. *CTR* keeps sliding." },
    { kicker: "02 · The real cause", text: "Twenty creators, twenty *different* brands. Nobody remembers which one was you." },
    { kicker: "03 · The fix", text: "Write the story in one line. Then brief every creator to *that* line." },
  ],
  move: "One story. Many *faces.* Never the other way round.",
  cta: "Full breakdown → payoffcreative.com/blog",
};

const sampleCard: CardSpec = { type: "cover", pillar: "Wed · Ad Lab", slate: 1, title: "Your ads aren't tired. Your story is." };

export const Root: React.FC = () => (
  <>
  <Composition
    id="Cover"
    component={Card as unknown as React.FC<Record<string, unknown>>}
    width={1600}
    height={680}
    fps={30}
    durationInFrames={1}
    defaultProps={{ spec: sampleCard } as unknown as Record<string, unknown>}
  />
  <Composition
    id="Card"
    component={Card as unknown as React.FC<Record<string, unknown>>}
    width={1600}
    height={900}
    fps={30}
    durationInFrames={1}
    defaultProps={{ spec: { type: "stat", big: "3x", label: "Sample stat card" } } as unknown as Record<string, unknown>}
  />
  <Composition
    id="DailyStory"
    component={DailyStory as unknown as React.FC<Record<string, unknown>>}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={totalFrames(sample)}
    defaultProps={sample as unknown as Record<string, unknown>}
    calculateMetadata={({ props }) => ({ durationInFrames: totalFrames(props as unknown as StoryVideo) })}
  />
  </>
);
