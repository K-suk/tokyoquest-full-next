"use client";

import { useState, useEffect, useCallback } from "react";
import { storyEventManager, STORY_UNLOCKED_EVENT } from "@/lib/story-events";

export function useStoryCount() {
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStoryCount = useCallback(async () => {
    try {
      const response = await fetch("/api/stories");
      if (response.ok) {
        const data = await response.json();
        setUnlockedCount(data.unlockedLevels?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching story count:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCount = useCallback(() => {
    fetchStoryCount();
  }, [fetchStoryCount]);

  useEffect(() => {
    fetchStoryCount();

    // Listen for story unlock events
    const handleStoryUnlocked = () => {
      fetchStoryCount();
    };

    // Subscribe to both custom event and event manager
    const unsubscribe = storyEventManager.subscribe(handleStoryUnlocked);

    if (typeof window !== "undefined") {
      window.addEventListener(STORY_UNLOCKED_EVENT, handleStoryUnlocked);
    }

    return () => {
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener(STORY_UNLOCKED_EVENT, handleStoryUnlocked);
      }
    };
  }, [fetchStoryCount]);

  return {
    unlockedCount,
    loading,
    refreshCount,
  };
}
