import {
  calculateLevel,
  getExpForLevel,
  getExpToNextLevel,
  getLevelProgress,
} from "../level-system";

describe("Level System", () => {
  describe("calculateLevel", () => {
    it("should calculate correct levels", () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(99)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(299)).toBe(2);
      expect(calculateLevel(300)).toBe(3);
      expect(calculateLevel(500)).toBe(4);
      expect(calculateLevel(700)).toBe(5);
      expect(calculateLevel(1000)).toBe(6);
      expect(calculateLevel(1400)).toBe(7);
      expect(calculateLevel(1900)).toBe(8);
      expect(calculateLevel(2400)).toBe(9);
      expect(calculateLevel(3000)).toBe(10);
      expect(calculateLevel(5000)).toBe(10); // Max level
    });
  });

  describe("getExpForLevel", () => {
    it("should return correct exp requirements", () => {
      expect(getExpForLevel(1)).toBe(0);
      expect(getExpForLevel(2)).toBe(100);
      expect(getExpForLevel(3)).toBe(300);
      expect(getExpForLevel(4)).toBe(500);
      expect(getExpForLevel(5)).toBe(700);
      expect(getExpForLevel(6)).toBe(1000);
      expect(getExpForLevel(7)).toBe(1400);
      expect(getExpForLevel(8)).toBe(1900);
      expect(getExpForLevel(9)).toBe(2400);
      expect(getExpForLevel(10)).toBe(3000);
    });
  });

  describe("getExpToNextLevel", () => {
    it("should return correct exp to next level", () => {
      expect(getExpToNextLevel(0)).toBe(100);
      expect(getExpToNextLevel(50)).toBe(50);
      expect(getExpToNextLevel(100)).toBe(200);
      expect(getExpToNextLevel(200)).toBe(100);
      expect(getExpToNextLevel(300)).toBe(200);
      expect(getExpToNextLevel(1000)).toBe(400);
      expect(getExpToNextLevel(3000)).toBe(0); // Max level
    });
  });

  describe("getLevelProgress", () => {
    it("should return correct progress data", () => {
      const progress1 = getLevelProgress(0);
      expect(progress1.level).toBe(1);
      expect(progress1.currentLevelExp).toBe(0);
      expect(progress1.nextLevelExp).toBe(100);
      expect(progress1.progress).toBe(0);

      const progress2 = getLevelProgress(50);
      expect(progress2.level).toBe(1);
      expect(progress2.progress).toBe(0.5);

      const progress3 = getLevelProgress(100);
      expect(progress3.level).toBe(2);
      expect(progress3.progress).toBe(0);

      const progress4 = getLevelProgress(200);
      expect(progress4.level).toBe(2);
      expect(progress4.progress).toBe(0.5);

      const progress5 = getLevelProgress(3000);
      expect(progress5.level).toBe(10);
      expect(progress5.progress).toBe(1); // Max level
    });
  });
});
