import { StatusBar } from 'expo-status-bar';
import { useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { GameScreen } from './src/components/GameScreen';
import { LevelSelectScreen } from './src/components/LevelSelectScreen';
import { SettingsScreen } from './src/components/SettingsScreen';
import { getTotalLevels } from './src/game/levels';

type Screen = 'levelSelect' | 'game' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('levelSelect');
  const [selectedLevel, setSelectedLevel] = useState(1);

  const handleSelectLevel = useCallback((levelId: number) => {
    setSelectedLevel(levelId);
    setCurrentScreen('game');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setCurrentScreen('levelSelect');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setCurrentScreen('settings');
  }, []);

  const handleCloseSettings = useCallback(() => {
    setCurrentScreen('levelSelect');
  }, []);

  const handleNextLevel = useCallback(() => {
    const totalLevels = getTotalLevels();
    if (selectedLevel < totalLevels) {
      setSelectedLevel(prev => prev + 1);
    } else {
      // If on last level, go back to menu
      setCurrentScreen('levelSelect');
    }
  }, [selectedLevel]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {currentScreen === 'levelSelect' && (
        <LevelSelectScreen
          onSelectLevel={handleSelectLevel}
          onOpenSettings={handleOpenSettings}
        />
      )}
      {currentScreen === 'game' && (
        <GameScreen
          key={selectedLevel}
          levelId={selectedLevel}
          onBack={handleBackToMenu}
          onNextLevel={handleNextLevel}
        />
      )}
      {currentScreen === 'settings' && (
        <SettingsScreen onClose={handleCloseSettings} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
});
