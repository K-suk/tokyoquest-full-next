// Minimal telemetry utility for story system
export function track(event: string, props?: Record<string, any>) {
  // In production, this would integrate with your analytics system
  // If Google Analytics is available, use it
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", event, props);
  }
}

// Story-specific tracking functions
export const storyTelemetry = {
  unlocked: (level: number) => track("story_unlocked", { level }),
  opened: (level: number, source: "unlock_toast" | "stories_page" | "direct") =>
    track("story_opened", { level, source }),
  completed: (level: number, readMs: number, scrollDepth: number) =>
    track("story_completed", {
      level,
      read_ms: readMs,
      scroll_depth: scrollDepth,
    }),
  answerSaved: (level: number, length: number) =>
    track("story_answer_saved", { level, length }),
};
