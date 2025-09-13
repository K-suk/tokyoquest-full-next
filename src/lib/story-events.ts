// Global event system for story updates
class StoryEventManager {
  private listeners: Set<() => void> = new Set();

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyStoryUnlocked() {
    this.listeners.forEach((callback) => callback());
  }
}

export const storyEventManager = new StoryEventManager();

// Custom event for story unlocks
export const STORY_UNLOCKED_EVENT = "story-unlocked";

export function dispatchStoryUnlocked() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STORY_UNLOCKED_EVENT));
  }
  storyEventManager.notifyStoryUnlocked();
}
