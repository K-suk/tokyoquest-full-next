"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface LevelUpData {
  oldLevel: number;
  newLevel: number;
  expGained: number;
  unlockedStories: number[];
}

export function useLevelUpNotification() {
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const showLevelUpNotification = useCallback((data: LevelUpData) => {
    setLevelUpData(data);
    setIsModalOpen(true);
  }, []);

  const handleReadStory = useCallback(
    (level: number) => {
      setIsModalOpen(false);
      router.push(`/stories/${level}`);
    },
    [router]
  );

  const handleViewStories = useCallback(() => {
    setIsModalOpen(false);
    router.push("/stories");
  }, [router]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setLevelUpData(null);
  }, []);

  return {
    levelUpData,
    isModalOpen,
    showLevelUpNotification,
    handleReadStory,
    handleViewStories,
    handleClose,
  };
}
