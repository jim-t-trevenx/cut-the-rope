import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  LEVEL_PROGRESS: 'cut_the_rope_level_progress',
  SETTINGS: 'cut_the_rope_settings',
};

export interface LevelProgress {
  [levelId: number]: {
    completed: boolean;
    stars: number;
  };
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
};

// Level Progress
export async function getLevelProgress(): Promise<LevelProgress> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LEVEL_PROGRESS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading level progress:', error);
  }
  return { 1: { completed: false, stars: 0 } }; // Level 1 is always unlocked
}

export async function saveLevelProgress(levelId: number, stars: number): Promise<void> {
  try {
    const progress = await getLevelProgress();
    const currentStars = progress[levelId]?.stars || 0;

    // Update current level
    progress[levelId] = {
      completed: true,
      stars: Math.max(currentStars, stars), // Keep best star count
    };

    // Unlock next level
    const nextLevelId = levelId + 1;
    if (!progress[nextLevelId]) {
      progress[nextLevelId] = { completed: false, stars: 0 };
    }

    await AsyncStorage.setItem(STORAGE_KEYS.LEVEL_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving level progress:', error);
  }
}

export async function getTotalStars(): Promise<number> {
  const progress = await getLevelProgress();
  return Object.values(progress).reduce((total, level) => total + level.stars, 0);
}

export async function isLevelUnlocked(levelId: number): Promise<boolean> {
  if (levelId === 1) return true;
  const progress = await getLevelProgress();
  return !!progress[levelId];
}

// Settings
export async function getSettings(): Promise<GameSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return defaultSettings;
}

export async function saveSettings(settings: Partial<GameSettings>): Promise<void> {
  try {
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Reset all progress
export async function resetProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.LEVEL_PROGRESS);
  } catch (error) {
    console.error('Error resetting progress:', error);
  }
}
