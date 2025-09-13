import { storyTelemetry } from "./telemetry";

export interface StoryUnlockResult {
  success: boolean;
  unlockedLevels: number[];
  newlyUnlocked?: number;
  alreadyUnlocked?: boolean;
}

export async function unlockStoryLevel(
  level: number
): Promise<StoryUnlockResult> {
  try {
    const response = await fetch("/api/stories/unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ level }),
    });

    if (!response.ok) {
      throw new Error(`Failed to unlock story: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error unlocking story level:", error);
    throw error;
  }
}

export async function markStoryAsRead(
  level: number,
  readMs?: number,
  scrollDepth?: number
) {
  try {
    const response = await fetch(`/api/stories/${level}/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ readMs, scrollDepth }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark story as read: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error marking story as read:", error);
    throw error;
  }
}

export async function saveStoryAnswer(level: number, answer: string) {
  try {
    const response = await fetch(`/api/stories/${level}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answer }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save story answer: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving story answer:", error);
    throw error;
  }
}

// Level-up integration hook
export function useLevelUpIntegration() {
  const handleLevelUp = async (newLevel: number, previousLevel: number) => {
    try {
      // Unlock all levels from previousLevel + 1 to newLevel
      const levelsToUnlock = [];
      for (let level = previousLevel + 1; level <= newLevel; level++) {
        levelsToUnlock.push(level);
      }

      const unlockPromises = levelsToUnlock.map((level) =>
        unlockStoryLevel(level)
      );
      const results = await Promise.all(unlockPromises);

      // Find the highest newly unlocked level
      const newlyUnlockedLevels = results
        .filter((result) => result.newlyUnlocked)
        .map((result) => result.newlyUnlocked!);

      return {
        success: true,
        newlyUnlockedLevels,
        totalUnlocked: results.reduce(
          (acc, result) => acc + result.unlockedLevels.length,
          0
        ),
      };
    } catch (error) {
      console.error("Error handling level up:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  return { handleLevelUp };
}
