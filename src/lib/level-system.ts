// Level calculation system
// New level requirements:
// Level 1: 0-99 exp
// Level 2: 100-299 exp
// Level 3: 300-499 exp
// Level 4: 500-699 exp
// Level 5: 700-999 exp
// Level 6: 1000-1399 exp
// Level 7: 1400-1899 exp
// Level 8: 1900-2399 exp
// Level 9: 2400-2999 exp
// Level 10: 3000+ exp

const LEVEL_REQUIREMENTS = [
  0, // Level 1
  100, // Level 2
  300, // Level 3
  500, // Level 4
  700, // Level 5
  1000, // Level 6
  1400, // Level 7
  1900, // Level 8
  2400, // Level 9
  3000, // Level 10
];

export function calculateLevel(exp: number): number {
  for (let level = LEVEL_REQUIREMENTS.length; level >= 1; level--) {
    if (exp >= LEVEL_REQUIREMENTS[level - 1]) {
      return level;
    }
  }
  return 1; // Default to level 1
}

export function getExpForLevel(level: number): number {
  // Returns the minimum exp required for a given level
  if (level < 1 || level > LEVEL_REQUIREMENTS.length) {
    return 0;
  }
  return LEVEL_REQUIREMENTS[level - 1];
}

export function getExpToNextLevel(currentExp: number): number {
  const currentLevel = calculateLevel(currentExp);
  if (currentLevel >= LEVEL_REQUIREMENTS.length) {
    return 0; // Max level reached
  }
  const nextLevelExp = getExpForLevel(currentLevel + 1);
  return nextLevelExp - currentExp;
}

export function getLevelProgress(currentExp: number): {
  level: number;
  currentLevelExp: number;
  nextLevelExp: number;
  progress: number; // 0-1
} {
  const level = calculateLevel(currentExp);
  const currentLevelExp = getExpForLevel(level);

  if (level >= LEVEL_REQUIREMENTS.length) {
    // Max level reached
    return {
      level,
      currentLevelExp,
      nextLevelExp: currentLevelExp,
      progress: 1,
    };
  }

  const nextLevelExp = getExpForLevel(level + 1);
  const progress =
    (currentExp - currentLevelExp) / (nextLevelExp - currentLevelExp);

  return {
    level,
    currentLevelExp,
    nextLevelExp,
    progress: Math.min(progress, 1),
  };
}
