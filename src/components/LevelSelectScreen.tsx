import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { levels } from '../game/levels';
import { getLevelProgress, getTotalStars, LevelProgress } from '../utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LevelSelectScreenProps {
  onSelectLevel: (levelId: number) => void;
  onOpenSettings: () => void;
}

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  onSelectLevel,
  onOpenSettings,
}) => {
  const [progress, setProgress] = useState<LevelProgress>({});
  const [totalStars, setTotalStars] = useState(0);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const levelProgress = await getLevelProgress();
    const stars = await getTotalStars();
    setProgress(levelProgress);
    setTotalStars(stars);
  };

  const isLevelUnlocked = (levelId: number): boolean => {
    if (levelId === 1) return true;
    return !!progress[levelId];
  };

  const getLevelStars = (levelId: number): number => {
    return progress[levelId]?.stars || 0;
  };

  const renderStars = (count: number, max: number = 3) => {
    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: max }).map((_, i) => (
          <Text key={i} style={[styles.star, i < count && styles.starFilled]}>
            {i < count ? '★' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background layers */}
      <View style={styles.bgTop} />
      <View style={styles.bgMiddle} />
      <View style={styles.bgBottom} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cut the Rope</Text>
        <View style={styles.totalStarsContainer}>
          <Text style={styles.totalStarsIcon}>★</Text>
          <Text style={styles.totalStarsText}>{totalStars}</Text>
        </View>
      </View>

      {/* Settings button */}
      <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>

      {/* Level grid */}
      <ScrollView contentContainerStyle={styles.levelGrid}>
        {levels.map((level) => {
          const unlocked = isLevelUnlocked(level.id);
          const stars = getLevelStars(level.id);

          return (
            <TouchableOpacity
              key={level.id}
              style={[styles.levelButton, !unlocked && styles.levelLocked]}
              onPress={() => unlocked && onSelectLevel(level.id)}
              disabled={!unlocked}
            >
              {unlocked ? (
                <>
                  <Text style={styles.levelNumber}>{level.id}</Text>
                  {renderStars(stars)}
                </>
              ) : (
                <Text style={styles.lockIcon}>🔒</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Om Nom decoration */}
      <View style={styles.omNomDecoration}>
        <View style={styles.omNomBody}>
          <View style={styles.omNomEyeContainer}>
            <View style={styles.omNomEye}>
              <View style={styles.omNomPupil} />
            </View>
            <View style={styles.omNomEye}>
              <View style={styles.omNomPupil} />
            </View>
          </View>
          <View style={styles.omNomMouth} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4F8',
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: '#87CEEB',
  },
  bgMiddle: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#B0E0E6',
  },
  bgBottom: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#E0F7FA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#5D4037',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  totalStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  totalStarsIcon: {
    fontSize: 24,
    color: '#FFD700',
  },
  totalStarsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5D4037',
    marginLeft: 8,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  settingsIcon: {
    fontSize: 24,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 30,
  },
  levelButton: {
    width: (SCREEN_WIDTH - 80) / 4,
    aspectRatio: 1,
    backgroundColor: '#66BB6A',
    borderRadius: 15,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#43A047',
  },
  levelLocked: {
    backgroundColor: '#9E9E9E',
    borderColor: '#757575',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  lockIcon: {
    fontSize: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  star: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  starFilled: {
    color: '#FFD700',
  },
  omNomDecoration: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  omNomBody: {
    width: 60,
    height: 60,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#388E3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  omNomEyeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -5,
  },
  omNomEye: {
    width: 14,
    height: 14,
    backgroundColor: 'white',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  omNomPupil: {
    width: 8,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  omNomMouth: {
    width: 20,
    height: 10,
    backgroundColor: '#8B0000',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: 3,
  },
});
