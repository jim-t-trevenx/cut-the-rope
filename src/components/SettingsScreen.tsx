import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { getSettings, saveSettings, resetProgress, GameSettings } from '../utils/storage';

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await getSettings();
    setSettings(loadedSettings);
  };

  const toggleSetting = async (key: keyof GameSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await saveSettings({ [key]: newSettings[key] });
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetProgress();
            Alert.alert('Progress Reset', 'All progress has been reset.');
          },
        },
      ]
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
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Settings panel */}
      <View style={styles.panel}>
        {/* Sound toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>🔊</Text>
            <Text style={styles.settingLabel}>Sound Effects</Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={() => toggleSetting('soundEnabled')}
            trackColor={{ false: '#767577', true: '#81C784' }}
            thumbColor={settings.soundEnabled ? '#4CAF50' : '#f4f3f4'}
          />
        </View>

        {/* Music toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>🎵</Text>
            <Text style={styles.settingLabel}>Music</Text>
          </View>
          <Switch
            value={settings.musicEnabled}
            onValueChange={() => toggleSetting('musicEnabled')}
            trackColor={{ false: '#767577', true: '#81C784' }}
            thumbColor={settings.musicEnabled ? '#4CAF50' : '#f4f3f4'}
          />
        </View>

        {/* Haptics toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>📳</Text>
            <Text style={styles.settingLabel}>Vibration</Text>
          </View>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={() => toggleSetting('hapticsEnabled')}
            trackColor={{ false: '#767577', true: '#81C784' }}
            thumbColor={settings.hapticsEnabled ? '#4CAF50' : '#f4f3f4'}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Reset progress button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetProgress}>
          <Text style={styles.resetButtonText}>Reset Progress</Text>
        </TouchableOpacity>
      </View>

      {/* Version info */}
      <Text style={styles.version}>Version 1.0.0</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
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
  backIcon: {
    fontSize: 24,
    color: '#5D4037',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5D4037',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  placeholder: {
    width: 50,
  },
  panel: {
    margin: 20,
    marginTop: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 18,
    color: '#5D4037',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  resetButton: {
    backgroundColor: '#EF5350',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#5D4037',
    opacity: 0.5,
    fontSize: 14,
  },
});
